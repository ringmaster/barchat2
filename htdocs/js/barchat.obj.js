Barchat = new Object();
Barchat.servers = {};

Barchat.Server = function(server) {
	this.server_url = server;
	this.token = false;
	this.latest = 0;
}

Barchat.Server.prototype.connect = function(username, password) {
	var server = this;
	if(server.token) {
		$(server).trigger('error', ['Already connected!']);
		return;
	}
	$.post(
		server.server_url + '/getUserToken', 
		{'username': username, 'password': password}, 
		function(response){
			if(response.err) {
				$(server).trigger('error', [response.errMsg]);
			}
			else {
				server.token = response.token;
				server.username = username;

				$.get(server.server_url +'/getMyRooms', {}, function(data){
					server.rooms = data;
					_.each(server.rooms, function(room) {
						$(server).trigger('join', [server.server_url, room]);
					});
				}, 'jsonp');

				server.pollHandle = window.setInterval(function(){server.getMessages();}, 2000);
				$(server).trigger('connected', [server.username + ' is now connected to ' + server.server_url, response]);
			}
		},
		'jsonp'
	);
}

Barchat.Server.prototype.disconnect = function() {
	window.clearInterval(server.pollHandle);
	$(server).trigger('disconnected', [server.username + ' is now disconnected from ' + server.server]);
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
		console.log(data);
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