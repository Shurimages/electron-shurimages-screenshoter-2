(function($){
	const id = location.href.split('#').pop(),
		electron = require('electron'),
		ipc = electron.ipcRenderer,
		fs = require('fs'),
		os = require('os'),
		path = require('path'),
		audio = new Audio('../audio/upload.mp3');

	ipc.send('alive', id);
	
	var Point = function(x,y){
		this.x = x;
		this.y = y;
	};
	var Square = function(start, end){
		this.start = new Point(
			Math.min(start.x, end.x),
			Math.min(start.y, end.y)
		);
		this.end = new Point(
			this.start.x + Math.abs(start.x - end.x),
			this.start.y + Math.abs(start.y - end.y)
		);
	}

	var Controller = function(){
		this.min_area = 100; // min a 10x10 image (or equivalent)
		this.ui = null;
		this.capturing = false;
		this.start = {x: 0, y:0};
		this.end = {x: 0, y:0};
		
		this.onmousedown = function(point){
			if(!this.capturing)
				this.start_capturing(point);
		};
		this.onmouseup = function(point){
			if(this.capturing)
				this.finish_capturing(point);
		};
		this.onmousemove = function(point){
			if(this.capturing)
				this.update_end(point);
		};
		this.onmouseout = function(point){
			if(this.capturing)
				this.update_end(point);
		}
		this.onrightclick = function(point){
			if(this.capturing)
				this.stop_capturing();
			else
				this.quit_capturing();
		}
		
		this.update_ui = function(){
			this.ui.update(new Square(this.start, this.end));
		}
		
		this.start_capturing = function(point){
			this.capturing = true;
			this.start = point;
		}
		
		this.update_end = function(point){
			this.end = point;
			this.update_ui();
		}

		this.get_screen = function(){
			var screens = electron.screen.getAllDisplays();
			console.log(screens, id);
			for(var i = 0; i < screens.length; i++){
				console.log(screens[i].id, id);
				if(screens[i].id == id){
					return screens[i];
				}
			}
		}

		this.get_data = function(){
			return {
				x: Math.min(this.start.x, this.end.x),
				y:  Math.min(this.start.y, this.end.y),
				width: Math.abs(this.start.x-this.end.x),
				height: Math.abs(this.start.y-this.end.y)
			};
		}
		
		this.finish_capturing = function(point){
			this.capturing = false;
			this.end = point;
			if(this.validate()){
				audio.currentTime = 0;
				audio.play();
				this.take_screenshot();
			}
		}

		this.take_screenshot = function(){
			var screen = this.get_screen(),
				maxDimension = Math.max(screen.size.width, screen.size.height),
				imageSize = {
					width: maxDimension * window.devicePixelRatio,
					height: maxDimension * window.devicePixelRatio
				},
				data = this.get_data();
			
			electron.desktopCapturer.getSources({types: ['screen'], thumbnailSize: imageSize}, function(err, sources){
				sources.forEach(function(source){
					console.log(source);
					if(source.display_id == screen.id){
						var img_path = path.join(os.homedir(), '.shurimages/screenshot.jpg');
						fs.writeFileSync(img_path, source.thumbnail.crop(data).toJPEG(50));
						ipc.send("captured", {
							'path': img_path,
							'id': id,
							'width': data.width,
							'height': data.height
						});
					}
				});

			});
		}
		
		this.stop_capturing = function(){
			this.capturing = false;
			this.start = {x: 0, y:0};
			this.end = {x: 0, y:0};
			this.update_ui();
		}
		
		this.quit_capturing = function(){
			ipc.send("quit");
		}
		
		this.validate = function(){
			var width = Math.abs(this.start.x - this.end.x),
				height = Math.abs(this.start.y - this.end.y);
			console.log(width, height, width*height, this.min_area);
			return width*height >= this.min_area;
		}
	};
	
	var UI = function(controller){
		this.controller = controller;
		this.controller.ui = this;
		this.width = window.outerWidth;
		this.height = window.outerHeight;
			
		this.update = function(square){
			$('.size').html((square.end.x - square.start.x) +"x"+ (square.end.y - square.start.y));
			$('.size').css({
				"left": square.start.x + "px",
				"top": (square.start.y < 20) ? square.end.y : (square.start.y - 16) + "px"
			});
			$('.zone').css({
				"top": (square.start.y - 1) + "px",
				"left": (square.start.x -1) + "px",
				"width": (square.end.x - square.start.x) + "px",
				"height": (square.end.y - square.start.y) + "px"
			});
			$('.capture.capture1').css({
				"top": "0px", 
				"left": "0px", 
				"right": "0px", 
				"height": square.start.y + "px"
			});
			$('.capture.capture2').css({
				"top": square.start.y + "px",
				"width": square.start.x + "px",
				"left": "0px",
				"height": (square.end.y - square.start.y) + "px"
			});
			$('.capture.capture3').css({
				"top": square.start.y + "px",
				"left": square.end.x + "px",
				"right": "0px",
				"height": (square.end.y - square.start.y) + "px"
			});
			$('.capture.capture4').css({
				"top": square.end.y + "px", 
				"left": "0px", 
				"right": "0px", 
				"bottom": "0px"
			});
		};
		
		this.onmousedown = function(e){
			if(e.which == 1){
				controller.onmousedown(new Point(e.pageX, e.pageY));
			}
		};

		this.onmouseup = function(e){
			if(e.which == 1){
				controller.onmouseup(new Point(e.pageX, e.pageY));
			}else{
				controller.onrightclick(new Point(e.pageX, e.pageY));
			}
		};

		this.onmousemove = function(e){
			controller.onmousemove(new Point(e.pageX, e.pageY));
		};

		this.onmouseout = function(e){
			controller.onmouseout(new Point(e.pageX, e.pageY));
		};

		this.prevent = function(e){
			e.preventDefault();
			e.stopPropagation();
			return false;
		};
	};
	
	//Init
	var ui = new UI(new Controller());
	$('.event').on("mousedown", ui.onmousedown);
	$('.event').on("mouseup", ui.onmouseup);
	$('.event').on("mousemove", ui.onmousemove);
	$('.event').on("drag", ui.prevent);
	$('.event').on("dragstart", ui.prevent);
	$('.event').on("dragend", ui.prevent);
	$( window ).on("mouseout", ui.onmouseout);
})(jQuery);