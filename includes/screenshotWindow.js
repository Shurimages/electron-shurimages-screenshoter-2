var screenshotWindow = function(app_path, ipc, BrowserWindow, screens, app, submit_image){
	this.file = "file://" + app_path + "/assets/templates/capture.html";
	this.events = [];
	this.app = app;
	
	this.bindings = function(){
		var _this = this;
		
		//Receive alive and send ready when all screens are alive.
		ipc.on('alive', function(event, data){
			console.log(data + " is alive");
			for(var i = 0;  i < _this.windows.length; i++){
				if(_this.windows[i].sid == data){
					_this.windows[i].event = event;
				}
			}
		});
		
		ipc.on('quit', function(event, data){
			console.log("quit request");
			for(var i = 0;  i < _this.windows.length; i++){
				_this.windows[i].close();
			}
			_this.app.quit()
		});

		ipc.on('captured', function(event, data){
			console.log("captured", data);
			submit_image(data.path);
		});
	};
	
	this.is_ready = function(){
		for(var i = 0;  i < this.windows.length; i++){
			if(!this.windows[i].hasOwnProperty("event"))
				return false;
		}
		return true;
	}
	this.ready  = function(){
		for(var i = 0;  i < this.windows.length; i++){
			this.windows[i].event.sender.send('ready');
		}
	}
	this.close  = function(){
		for(var i = 0;  i < this.windows.length; i++){
			this.windows[i].close();
		}
	}
	
	this.display = function(){
		var _this = this;
		for(var i = 0; i < this.windows.length; i++){
			this.windows[i].once('ready-to-show', function(){
				this.show();
			});
		}
		this.bindings();
	};
	
	this.getWindow = function(){
		return this.windows;
	}
	
	/** Initialization **/
	this.windows = [];
	for(var i = 0;  i < screens.length; i++){
		var w = new BrowserWindow({
			show: false,
			title: "Shurimages - Capture",
			x: screens[i].bounds.x,
			y: screens[i].bounds.y,
			width:screens[i].size.width, 
			height:screens[i].size.height,
			autoHideMenuBar: true,
			fullscreen: true,
			transparent: true,
			frame: false,
			resizable: false,
			minimizable: true,
			useContentSize: false,
		});
		w.sid = screens[i].id;
		w.loadURL(this.file + "#" + w.sid);
		this.windows.push(w);
	}
};
module.exports = screenshotWindow;