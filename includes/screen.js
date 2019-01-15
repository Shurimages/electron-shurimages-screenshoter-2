var Screen = function(screen){
	
	this.getCurrent = function(){
		return this.current;
	}
	
	/** Initialization **/
	this.current = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
	this.displays = screen.getAllDisplays();
};
module.exports = Screen;