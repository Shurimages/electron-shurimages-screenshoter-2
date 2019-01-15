var screenshotWindow = function(app_path, ipc, BrowserWindow, screens){
	this.file = "file://" + app_path + "/assets/templates/capture.html";
	this.events = [];
	
	this.bindings = function(){
		var _this = this;
		
		//Receive alive and send ready when all screens are alive.
		ipc.on('alive', function(event, data){
			for(var i = 0;  i < _this.windows.length; i++){
				if(_this.windows[i].id == data){
					_this.windows[i].event = event;
				}
			}
		});
		
		ipc.on('quit', function(event, data){
			console.log("quit request");
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
		w.id = screens[i].id;
		w.loadURL(this.file + "#" + w.id);
		this.windows.push(w);
		break;
	}
};
module.exports = screenshotWindow;