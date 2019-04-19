const electron = require('electron');
const { dialog } = require('electron');
const app = electron.app;
const fetch = require('electron-fetch');
const crypto = require('crypto');
const FormData = require('form-data');
const {autoUpdater} = require('electron-updater');
electron.shurimages = {};

/*********************/
/**	SINGLE INSTANCE	**/
/*********************/
if(!app.requestSingleInstanceLock()){
	console.log("DEBUG: Unnable to lock single instance. Quitting...");
	app.quit();
	return;
};
// app.on('second-instance', function(event, commandLine, workingDirectory){
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
// });

autoUpdater.logger = require("electron-log")
autoUpdater.logger.transports.file.level = "info"
autoUpdater.on('checking-for-update', function(){
	console.log("Checking for updates...");
});
autoUpdater.on('update-available', function(info){
	console.log("Update available", info);
});
autoUpdater.on('update-not-available', function(info){
	console.log("Your version is up to date!", info);
});
autoUpdater.on('error', function(error){
	console.log("Autoupdating error...", error);
});
autoUpdater.on('download-progress', function(progressObj){
	// console.log("Download speed: ", progressObj.bytesPerSecond, "Downloaded", progressObj.percent, "/", progressObj.)
	console.log("Downloading...", progressObj);
});
autoUpdater.on('update-downloaded', function(info){
	console.log("Update downloaded, installing...");
	autoUpdater.quitAndInstall();
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
			console.log(electron.shurimages.config.version, version);
			if(electron.shurimages.config.version == version){
				/** SCREENSHOT **/
				function take_screenshot(){
					console.log("TAKING A SCREENSHOT");
					electron.shurimages.windowObject = new electron.shurimages.libs.screenshot(
						electron.shurimages.config.app_path, 
						electron.ipcMain,
						electron.BrowserWindow,
						electron.shurimages.screen.displays,
						app,
						function(image){
							electron.shurimages.api.upload(
								image,
								electron.shurimages.data.get_value('userid'),
								electron.shurimages.data.get_value('token'),
								function(data){
									electron.shell.openExternal(data.msg);
									app.quit();
								},
								function(error){
									console.log("DEBUG: Upload API Call error", error);
									dialog.showErrorBox(
										"Connection issue",
										"We could not connect to our API endpoint. Please, ensure your internet is not down or try again later. If this issue persist please contact us at https://shurimages.com/contact"
									);
									app.quit();
								}
							);
						}
					);
					electron.shurimages.windowObject.display();
				}
				
				/** LOGIN **/
				function require_login(){
					console.log("REQUIRING LOGIN");
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
									window.getWindow().close();
								/* on error */ 
								}, function(err, fatal){
									if(!fatal){
										console.log("DEBUG: Login error "+ err);
										window.error(err);
									}else{
										console.log("DEBUG: Login API Call error", error);
										dialog.showErrorBox(
											"Connection issue",
											"We could not connect to our API endpoint. Please, ensure your internet is not down or try again later. If this issue persist please contact us at https://shurimages.com/contact"
										);
										app.quit();
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
							console.log("DEBUG: Session couldn't be validated");
							/*	might not be needed
							dialog.showMessageBox(null, {
								type: "warning",
								title: "Session corrupted",
								message: "We were unable to validate your session. Please login again"
							})*/
							require_login();
						}
					);
				}
			}else{
				console.log("DEBUG: Version update or error");
				dialog.showErrorBox(
					"Out of date",
					"Please, download the new version!"
				);
				app.quit();
			}
		/* on error */ 
		},function(error){
			console.log("DEBUG: API Call error", error);
			dialog.showErrorBox(
				"Connection issue",
				"We could not connect to our API endpoint. Please, ensure your internet is not down or try again later. If this issue persist please contact us at https://shurimages.com/contact"
			);
			app.quit();
		}
	);
});
