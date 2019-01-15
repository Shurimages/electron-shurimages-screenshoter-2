const electron = require('electron');
const app = electron.app;
const fetch = require('electron-fetch');
const crypto = require('crypto');
const FormData = require('form-data');
electron.shurimages = {};

/*********************/
/**	SINGLE INSTANCE	**/
/*********************/
if(!app.requestSingleInstanceLock()){
  app.quit();
  return;
};
app.on('second-instance', function(event, commandLine, workingDirectory){
	// if(
		// typeof electron.shurimages.window !== "undefined" &&
		// electron.shurimages.window != null
	// ){
		// if(Array.isArray(electron.shurimages.window)){
			// for(var i = 0; i < electron.shurimages.window.length; i++){
				// if(electron.shurimages.window[i].isMinimized())
					// electron.shurimages.window[i].restore();
				// electron.shurimages.window[i].focus();
			// }
		// }else{
			// if(electron.shurimages.window.isMinimized())
				// electron.shurimages.window.restore();
			// electron.shurimages.window.focus();
		// }
	// }
});


/*********************/
/** DEPENDENCIES	**/
/*********************/
require('./includes/config.js');
electron.shurimages.libs = {};
electron.shurimages.libs.data = require('./includes/data.js');
electron.shurimages.libs.api = require('./includes/api.js');
electron.shurimages.libs.screen = require('./includes/screen.js');
electron.shurimages.libs.login = require('./includes/loginWindow.js');
electron.shurimages.libs.screenshot = require('./includes/screenshotWindow.js');

var data = require('./includes/private.js');
electron.shurimages.data = new electron.shurimages.libs.data(electron.fs,electron.shurimages.config.config_file);
electron.shurimages.api = new electron.shurimages.libs.api(fetch.default, crypto, FormData, data.apikey, data.apiuri, electron.shurimages.data.get_value("lang"));



/*********************/
/**	WORKFLOW OF APP	**/
/*********************/
app.on('ready', function(e,f){
	/** SCREEN **/
	electron.shurimages.screen = new electron.shurimages.libs.screen(electron.screen);
	
	/** API VERSION CHECK **/
	electron.shurimages.api.get_last_version(
		/* on success */
		function(version){
			if(electron.shurimages.config.version == version){
				/** SCREENSHOT **/
				function take_screenshot(){
					console.log("TAKING A SCREENSHOT");
					electron.shurimages.windowObject = new electron.shurimages.libs.screenshot(
						electron.shurimages.config.app_path, 
						electron.ipcMain,
						electron.BrowserWindow,
						electron.shurimages.screen.displays
					);
					electron.shurimages.windowObject.display();
				}
				
				/** LOGIN **/
				function require_login(){
					electron.shurimages.windowObject = new electron.shurimages.libs.login(
						electron.shurimages.config.app_path, 
						electron.ipcMain,
						electron.BrowserWindow,
						electron.shurimages.screen.current,
						electron.shell,
						electron.shurimages.config.links,
						/** SUBMIT LOGIN **/
						function(user, pass, remember, window){
							electron.shurimages.api.login(
								user, pass, remember, 
								/* on success */
								function(userid, token, remember){
									console.log("DEBUG: Successfully logged in");
									electron.shurimages.data.set_value('userid', 	userid);
									electron.shurimages.data.set_value('token', 	token);
									electron.shurimages.data.set_value('remember', 	remember);
									electron.shurimages.data.save_config();
									take_screenshot();
								/* on error */ 
								}, function(err, fatal){
									if(!fatal){
										window.error(err);
										console.log("DEBUG: Login error "+ err);
									}else{
										console.log("TODO: Login issue");
										console.log("DEBUG: Login request HTTP error");
									}
								}
							);
						}
					);
					electron.shurimages.windowObject.display();
				}
				if(electron.shurimages.data.get_value('remember') === false){
					/** NO SESSION FOUND **/
					console.log("DEBUG: No session found");
					require_login();
				}else{
					/** API SESSION VALIDATION **/
					electron.shurimages.api.validate_session(
						electron.shurimages.data.get_value('userid'),
						electron.shurimages.data.get_value('token'),
						/* on success */
						function(){
							console.log("DEBUG: Session validated");
							take_screenshot();
						},
						/* on error */ 
						function(error){
							// TODO: APP Error
							console.log("DEBUG: Session couldn't be validated");
							console.log("TODO: API Session validation issue", error);
							require_login();
						}
					);
				}
			}else{
				// TODO: APP outdated
				console.log("TODO: Version update or error");
			}
		/* on error */ 
		},function(error){
			// TODO: Api ERROR - json maybe
			console.log("TODO: API Call error", error);
		}
	);
});
