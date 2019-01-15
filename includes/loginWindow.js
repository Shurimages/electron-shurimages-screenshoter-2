var LoginWindow = function(app_path, ipc, BrowserWindow, screen, shell, links, submit_login){
	this.file = "file://" + app_path + "/assets/templates/login.html";
	this.submit_login = submit_login;
	
	this.config = {
		show: false,
		icon: "file://" + app_path + "/assets/img/logo.icns",
		title: "Shurimages - Login",
		x: screen.bounds.x + (screen.size.width/2) - 600/2,
		y: screen.bounds.y + (screen.size.height/2) - 550/2,
		width:600, 
		height:550,
		resizable: false,
		autoHideMenuBar: true,
		minimizable: true,
		backgroundColor: '#FFF',
	};
	
	this.bindings = function(){
		var _this = this;
		ipc.on('login', function(event, data){
			_this.event = event;
			_this.submit_login(data[0], data[1], data[2], _this);
		});		
		ipc.on('goRegister', function(event, data){
			shell.openExternal(links.register);
		});		
		ipc.on('goResetPassword', function(event, data){
			shell.openExternal(links.recover);
		});
	};
	
	this.error = function(error){
		if(this.event != null)
			this.event.sender.send('loginResponse', error);
	};
	
	this.display = function(){
		this.window.loadURL(this.file);
		this.window.once('ready-to-show', () => {
			this.window.show();
			this.bindings();
		});
	};
	
	this.reload = function(){
		this.window.loadURL(this.file);
	};
	
	this.getWindow = function(){
		return this.window;
	}
	
	/** Initialization **/
	this.window = new BrowserWindow(this.config);
};
module.exports = LoginWindow;