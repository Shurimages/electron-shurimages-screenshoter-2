var API = function(fetch, crypto, FormData, apikey, apiuri, lang){
	this.apikey = apikey;
	this.apiuri = apiuri;
	this.lang = lang;
	
	this.get_last_version = function(callback_success, callback_error){
		fetch(this.apiuri + "/"+ this.lang +"/"+ this.apikey+"/version.json")
		.then(function(response){
			return response.json();
		})
		.catch(function(err){
			callback_error(err);
		})
		.then(function(json){
			if(json.code == 200){
				callback_success(json.msg);
			}else{
				callback_error(json);
			}
		});
	};
	
	this.validate_session = function(id, token, callback_success, callback_error){
		fetch(this.apiuri + "/"+ this.lang +"/"+ this.apikey+"/"+ id +"/"+ token +"/session.json")
		.then(function(response){
			return response.json();
		})
		.catch(function(err){
			callback_error(err);
		})
		.then(function(json){
			if(json.code == 200){
				callback_success();
			}else{
				callback_error();
			}
		});
	};

	this.login = function(username, password, remember, callback_success, callback_error){
		var encryptedPassword = crypto.createHash('sha1').update(
			crypto.createHash('md5').update(password).digest("hex")
		).digest("hex");

		var data = new FormData();
		data.append("username", username);
		data.append("password", encryptedPassword);
		
		fetch(this.apiuri + "/"+ this.lang +"/"+ this.apikey+"/login.json", { method: 'POST', body: data })
		.then(function(response){
			return response.json();
		})
		.catch(function(err){
			callback_error(err, true);
		})
		.then(function(json){
			if(json.code == 200){
				callback_success(json.userid, json.token, remember);
			}else{
				callback_error(json.msg, false);
			}
		});
		
	};
	
	this.upload = function(imgpath, id, token, callback_success, callback_error){
		var fs = require('fs'),
			data = new FormData();
		data.append("pic", fs.createReadStream(imgpath));
	
		fetch(this.apiuri + "/"+ this.lang +"/"+ this.apikey+"/"+ id +"/"+ token +"/uploadimage.json", {
			method: 'POST',
			body: data
		})
		.then(function(response){
			return response.json();
		})
		.catch(function(err){
			callback_error(err);
		})
		.then(function(json){
			if(json.code == 200){
				callback_success(json);
			}else{
				callback_error(json.msg);
			}
		});
	};
	

};
module.exports = API;
/**
app.api.login = function(username, password, remember){
	var encryptedPassword = crypto.createHash('sha1').update(
		crypto.createHash('md5').update(password).digest("hex")
	).digest("hex");

	var data = new FormData();
	data.append("username", username);
	data.append("password", encryptedPassword);
		
	fetch(app.apiuri+"/"+app.userdata.lang+"/"+app.apikey+"/login.json", { method: 'POST', body: data })
	.then(res => res.json())
	.then(json => {
		if(json.code == 200){
			app.login(json.userid, json.token, remember);
		}else{
			app.libs.Login.error(json.msg);
		}
	})
	.catch(err => app.raiseError(app.errors.API_CONNECTION_RESPONSE_ERROR));
}


app.api.upload = function(){
	var data = new FormData();
	data.append("pic", fs.createReadStream(app.screenshot.path));

	fetch(app.apiuri+"/"+app.userdata.lang+"/"+app.apikey+"/"+app.userdata.userid+"/"+app.userdata.token+"/uploadimage.json", { method: 'POST', body: data })
    .then(res => res.json())
    .then(json => app.uploadFinished(json))
	.catch(err => app.raiseError(app.errors.API_CONNECTION_RESPONSE_ERROR));
}
**/