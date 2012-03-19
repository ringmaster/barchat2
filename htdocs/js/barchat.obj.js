Barchat = new Object();
Barchat.servers = {};
Barchat.presencefn = null;
Barchat.presenceInterval = null;

Barchat.Server = function(server) {
	this.server_url = server;
	this.token = false;
	this.latest = 0;
}

Barchat.Server.prototype.connect = function(username, password, register) {
	var server = this;
	if(server.token) {
		$(server).trigger('error', ['Already connected!']);
		return;
	}
	if(register) {
		url = server.server_url + '/registerUser';
	}
	else {
		url = server.server_url + '/getUserToken';
	}
	$.ajax({
		url: url, 
		data: {'username': username, 'password': password}, 
		type: 'POST',
		dataType: 'jsonp',
		success: function(response){
				if(response.err) {
					$(server).trigger('error', [response.errMsg]);
				}
				else {
					server.doConnect(response);
				}
			},
		error: function(jqXHR, textStatus, errorThrown) {
				$(server).trigger('error', [textStatus]);
			}
	});
}

Barchat.Server.prototype.disconnect = function() {
	window.clearInterval(server.pollHandle);
	$(server).trigger('disconnected', [server.username + ' is now disconnected from ' + server.server]);
}

Barchat.Server.prototype.doConnect = function(response) {
	var server = this;
	server.token = response.token;
	server.username = response.username;
	server.nickname = response.nickname;

	$.get(server.server_url +'/getMyRooms', {}, function(data){
		server.rooms = data;
		_.each(server.rooms, function(room) {
			$(server).trigger('join', [server.server_url, room]);
		});
	}, 'jsonp');

	server.pollHandle = window.setInterval(function(){server.getMessages();}, 2000);
	$(server).trigger('connected', [server.username + ' is now connected to ' + server.server_url, response]);
}

Barchat.Server.prototype.getMessages = function() {
	var server = this;
	$.get(server.server_url + '/getMessages', {timestamp: server.latest}, function(data){
		$(server).trigger('message', [data]);
		if(data.length > 0) {
			server.latest = _.reduce(data, function(memo, msg){
				if(msg.timestamp != undefined) {
					return Math.max(memo, msg.timestamp);
				}
			}, server.latest);
		}
	}, 'jsonp');
}

Barchat.Server.prototype.sendMessage = function(room, message) {
	var server = this;
	$.post(
		server.server_url + '/sendMessage',
		{room: room, raw: message},
		// @todo Add send failure handler
		function(){
			server.getMessages();
		}
	);
}

Barchat.Server.prototype.getPresence = function(server_url, room) {
	$.get(
		server_url + '/getPresence',
		{room: room},
		function(data){
			$(server).trigger('presence', [data]);
		}
	);
}

Barchat.create = function(server, callback) {
	if(this.servers[server] == undefined) {
		this.servers[server] = new Barchat.Server(server);
		this.servers[server].ownerDocument = document;
		this.servers[server].parent = document;
		if(callback != undefined) {
			callback(this.servers[server]);
		}
	}
	return this.servers[server];
}

Barchat.sendMessage = function(server, room, message) {
	server = this.servers[server];
	return server.sendMessage(room, message);
}

Barchat.serverByToken = function(token) {
	server = _.find(this.servers, function(server){
		server.token == token;
	});
	return server;
}

Barchat.presenceQueue = function(server_url, room) {
	server = this.servers[server_url];
	if(!server) {
		console.log('No server defined', server_url, this.servers);
		return;
	}
	Barchat.presencefn = server.getPresence;
	if(Barchat.presenceInterval) {
		window.clearInterval(Barchat.presenceInterval);
	}
	Barchat.presenceInterval = window.setInterval(function(){
		Barchat.presencefn(server_url, room);
	}, 5000);
	Barchat.presencefn(server_url, room);
}


