var Data = function(fs,configfile){
	this.fs = fs;
	this.file = configfile;

	this.remember = false;
	this.userid = null;
	this.token = null;
	this.lang = 'en';
	
	/** GET & SET **/
	this.get_value = function(param){
		return this[param];
	};
	this.set_value = function(param, value){
		this[param] = value;
	};
	
	/** Serializable **/
	this.stringify = function(){
		return JSON.stringify({
			remember: this.remember,
			userid: this.userid,
			token: this.token,
			lang: this.lang
		});
	}
	this.parse = function(string){
		try{
			var obj = JSON.parse(string);
			if(
				obj.hasOwnProperty('remember') &&
				obj.hasOwnProperty('userid') &&
				obj.hasOwnProperty('token') &&
				obj.hasOwnProperty('lang')
			){
				this.remember = obj.remember;
				this.userid = obj.userid;
				this.token = obj.token;
				this.lang = obj.lang;
				return true;
			}
			return false;
		}catch(err){
			return false;
		}
	}
	
	/** FS Related **/	
	this.load_config = function(){
		try{
			return this.parse(this.fs.readFileSync(this.file, 'utf8'));
		}catch(err){
			return false;
		}
		return false;
	};
	this.save_config = function(){
		try{
			this.fs.writeFileSync(this.file, this.stringify(), {flag:'w'});
			return true;
		}catch(err){
			return false;
		}
	};
	this.init_config = function(){
		this.save_config();
	};
	
	/** Initialization **/	
	if(!this.load_config()){
		this.init_config();
	}
};
module.exports = Data;