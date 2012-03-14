var BarchatUI = new Object();
BarchatUI.addRoom = function(room_id, room_name) {
	$('#roomtabs').append(ich.room_tab({room_id: room_id, room_name: room_name}));
	$('#rooms').append(ich.room_contents({room_id: room_id, room_name: room_name}));
};
BarchatUI.removeRoom = function(room_id) {
	$('.roomtab[data-room="' + room_id + '"]').remove();
	$('.room[data-room="' + room_id + '"]').remove();
}
BarchatUI.msgRoom = function(room_id, msgdatas) {
	stage = $('.room[data-room="' + room_id + '"]');
	for(var i in msgdatas) {
		msgdate = new Date(msgdatas[i].timestamp);
		msgdatas[i].msgdate = msgdate.toString('ddd HH:mm');
		stage.append(ich.message(msgdatas[i]));
	}
}
BarchatUI.getInsertionPoint = function(stage, d) {
	msgs = $('.message', stage);
	if(msgs.length == 0) return null;

	i = Math.floor(msgs.length/2);

	cmsg = $(msgs[i]);
	if(new Date(cmsg.data('timestamp')).isAfter(d) ) {
		i = Math.floor(i/2);
	}
	if(new Date(cmsg.data('timestamp')).isBefore(d) ) {
		i = Math.floor((msgs.length-i)/2);
	}
}

$(function(){
	// Initialize room sample content
	var users = [{username: 'billj', avatar: 'avatar.png', user_id: 1},{username: 'sueh', avatar: 'avatar2.png', user_id: 2}];
	var s = 4;
	for(var z = 1; z<=3; z++) {
		c = function(){
			var element = z;
			BarchatUI.addRoom('room' + element, 'Room ' + element);
			s++;
			$.getJSON('http://json-lipsum.appspot.com/?amount=' + s + '&start=no&lang=en&callback=?', function(results) {
				for(var p in results.lipsum) {
					BarchatUI.msgRoom('room' + element, [{user: users[Math.floor(Math.random() * users.length)], msg: results.lipsum[p], timestamp: new Date().getTime()}]);
				}
			});
		}
		c();
	}

	// Initialize user sample content
	$('#statusbar').append(ich.placard_group({name: 'users_online', title: 'online', placards: [{avatar: 'avatar.png', nickname: 'Bill Jennings'}]}));
	$('#statusbar').append(ich.placard_group({name: 'users_services', title: 'services', placards: [{avatar: 'github.png', nickname: 'GitHub'}]}));
	$('#statusbar').append(ich.placard_group({name: 'users_offline', title: 'offline', placards: [{avatar: 'avatar2.png', nickname: 'Sue Heron'}]}));

	// textinput filtering
	$('#textinput').bind('paste', function(e){
		window.setTimeout(function(){
			$('#textinput').html($('#textinput').text());
		}, 0);
	})


	$('#loginform').submit(function(){
		// @todo login with abstraction:
		// var result = Servers.login($('#server').val(), $('#username').val(), $('#password').val());
		// if(result.success) {humane.info('Logged in as ' + result.nickname + '.');} else {humane.error(result.errMsg);}
		$('#loginform').attr('action', $('#server').val());
		$.post(
			$('#loginform').attr('action'), 
			$('#loginform').serialize(), 
			function(response){
				if(response.err) {
					humane.error(response.errMsg);
				}
				else {
					humane.info('Logged in as ' + response.nickname + '.');
				}
			},
			'jsonp'
		);
		return false;
	});


	$('#roomtabs a').live('click', function(){
		$('.room,#roomtabs li').removeClass('active');
		$('.room[data-room="' + $(this).parents('li').data('room') + '"]').addClass('active');
		$(this).parents('li').addClass('active');
		return false;
	});

	// window.setInterval(function(){
	// 	$.get('/api/v1.0/getMessages', 'foo=1', function(data){
	// 		console.log(data);
	// 	}, 'jsonp');
	// }, 2000);

});
