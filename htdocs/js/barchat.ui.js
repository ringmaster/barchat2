var BarchatUI = new Object();
BarchatUI.addRoom = function(server, room_id, room_name) {
	$('#roomtabs').append(ich.room_tab({room_id: room_id, room_name: room_name, server: server}));
	$('#rooms').append(ich.room_contents({room_id: room_id, room_name: room_name, server: server}));
};
BarchatUI.removeRoom = function(room_id) {
	$('.roomtab[data-room="' + room_id + '"]').remove();
	$('.room[data-room="' + room_id + '"]').remove();
}
BarchatUI.msgRoom = function(msgdatas) {
	for(var i in msgdatas) {
		stage = $('.room[data-room="' + msgdatas[i].room + '"]');
		msgdate = new Date(msgdatas[i].timestamp);
		msgdatas[i].msgdate = msgdate.toString('ddd h:mmtt');

		var ip = BarchatUI.getInsertionPoint(stage, msgdate.getTime());

		if(ip) {
			ip.before(ich.message(msgdatas[i]));
		}
		else {
			lastuser = $('.message:last', stage).data('user');
			if(lastuser == msgdatas[i].user.user_id) {
				$('.message:last .message_texts', stage).append(ich.message_text(msgdatas[i]));
			}
			else {
				stage.append(ich.message(msgdatas[i]));
			}
		}
	}
}
// @todo still an issue with messages having the same millisecond timestamp?
BarchatUI.getInsertionPoint = function(stage, d) {
	msgs = $('.message_text', stage);
	if(msgs.length == 0) return null;
	if($(msgs[msgs.length - 1]).data('timestamp') < d) return null;

	var older = 0;
	var newer = msgs.length - 1;

	while(newer - older > 1) {
		center = Math.floor((older+newer)/2);
		cmsg = $(msgs[center]);
		if(cmsg.data('timestamp') > d ) {
			newer = center;
		}
		if(cmsg.data('timestamp') < d ) {
			older = center;
		}
		if(cmsg.data('timestamp') == d ) {
			older = center + 1;
		}
		console.log(older, newer);
	}

	return $(msgs[newer]);
}

BarchatUI.getActiveRoom = function() {
	return {
		server: $('#roomtabs li.active').data('server'),
		room: $('#roomtabs li.active').data('room')
	};
}

function shuffle(o){ //v1.0, code based on Fisher-Yates 
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

$(function(){
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
		//var server = new Barchat.Server($('#server').val(), $('#username').val(), $('#password').val());
		// @todo get an actual server label
		server = Barchat.create($('#server').val(), function(server){
			$(server).bind({
				error: function(e, errMsg){humane.error(errMsg)},
				connected: function(e, connMsg, response){humane.info(connMsg)},
				message: function(e, messages){BarchatUI.msgRoom(messages);},
				join: function(e, server, room){BarchatUI.addRoom(server, room._id, room.title);}
			});
		});
		server.connect($('#username').val(), $('#password').val());
		return false;
	});


	$('#roomtabs a').live('click', function(){
		$('.room,#roomtabs li').removeClass('active');
		$('.room[data-room="' + $(this).parents('li').data('room') + '"]').addClass('active');
		$(this).parents('li').addClass('active');
		return false;
	});

	$('#textinput').keyup(function(e){
		// console.log(e);
		switch(e.keyCode) {
			case 13:
				var activeRoom = BarchatUI.getActiveRoom();
				Barchat.sendMessage(activeRoom.server, activeRoom.room, $('#textinput').text());
				$('#textinput').html('');
				break;
		}
	});

});
