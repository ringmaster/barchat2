Barchat = new Object();
Barchat.servers = {};

Barchat.Server = function(server) {
	this.server = server;
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
		server.server, 
		'username=' + username + '&password=' + password, 
		function(response){
			if(response.err) {
				$(server).trigger('error', [response.errMsg]);
			}
			else {
				server.token = response.token;
				server.username = username;

				$.get('/api/v1.0/listRooms', {token: server.token}, function(data){
					server.rooms = data;
					for(var room in server.rooms) {
						$(server).trigger('join', [server.rooms[room]]);
					}
					console.log(data);
				}, 'jsonp');

				server.pollHandle = window.setInterval(function(){
					$.get('/api/v1.0/getMessages', {token: server.token, timestamp: server.latest}, function(data){
						for(var msg in data) {
							if(data[msg].timestamp != undefined) {
								server.latest = data[msg].timestamp;
							}
						}
						$(server).trigger('message', [data]);
						console.log(data);
					}, 'jsonp');
				}, 2000);
				$(server).trigger('connected', [server.username + ' is now connected to ' + server.server, response]);
			}
		},
		'jsonp'
	);
}

Barchat.Server.prototype.disconnect = function() {
	window.clearInterval(server.pollHandle);
	$(server).trigger('disconnected', [server.username + ' is now disconnected from ' + server.server]);
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
