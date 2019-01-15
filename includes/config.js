const electron = require('electron');
const path = require('path');
const os = require('os');

electron.fs = require('fs');

electron.shurimages.config = {}
electron.shurimages.config.version = "1.0.0";
electron.shurimages.config.app_path = electron.app.getAppPath();
electron.shurimages.config.home_path = path.join(os.homedir(), '.shurimages/');
electron.shurimages.config.config_file = path.join(electron.shurimages.config.home_path , 'config.json');
electron.shurimages.config.links = {
	register: "https://shurimages.com/register/",
	recover: "https://shurimages.com/login/recover/"
	
}
if(!electron.fs.existsSync(electron.shurimages.config.home_path)){
	electron.fs.mkdirSync(electron.shurimages.config.home_path);
}