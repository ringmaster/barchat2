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
	_.each(msgdatas, function(msgdata){
		stage = $('.room[data-room="' + msgdata.room + '"]');
		msgdate = new Date(msgdata.timestamp);
		msgdata.msgdate = msgdate.toString('ddd h:mmtt');

		var ip = BarchatUI.getInsertionPoint(stage, msgdate.getTime());

		if(ip) {
			ip.before(ich.message(msgdata));
		}
		else {
			lastuser = $('.message:last', stage).data('user');
			if(lastuser == msgdata.user.user_id) {
				$('.message:last .message_texts', stage).append(ich.message_text(msgdata));
			}
			else {
				stage.append(ich.message(msgdata));
			}
		}
	})
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
BarchatUI.setActiveRoom = function(server_id, room_id) {
	$('.room,#roomtabs li').removeClass('active');
	$('.room[data-room="' + room_id + '"]').addClass('active');
	$('#roomtabs li[data-room="' + room_id + '"]').addClass('active');
	$('#statusbar').css('opacity', 0.4);
	Barchat.presenceQueue(server_id, room_id);
}

BarchatUI.doLogin = function(register){
	// @todo get an actual server label
	server = Barchat.create($('#server').val(), function(server){
		$(server).bind({
			error: function(e, errMsg){humane.error(errMsg)},
			connected: function(e, connMsg, response){humane.info(connMsg)},
			message: function(e, messages){BarchatUI.msgRoom(messages);window.scrollBy(0, 100000000000000000);$("#statusbar").focus();},
			join: function(e, server, room){BarchatUI.addRoom(server, room._id, room.title);BarchatUI.setActiveRoom(server, room._id);},
			presence: function(e, users){BarchatUI.showUsers(users);}
		});
	});
	server.connect($('#username').val(), $('#password').val(), register);
	return false;
}

BarchatUI.showUsers = function(users) {
	$('#statusbar').html(ich.placard_group({name: 'users_inroom', title: 'inroom', placards: users}));
	$('#statusbar').css('opacity', 1);
}

$(function(){
	// textinput filtering
	$('#textinput').bind('paste', function(e){
		window.setTimeout(function(){
			$('#textinput').html($('#textinput').text());
		}, 0);
	})

	$('#login').click(function(){BarchatUI.doLogin();});
	$('#register').click(function(){BarchatUI.doLogin(true);});
	$('#loginform').submit(function(){return false;})

	$('#roomtabs a').live('click', function(){
		BarchatUI.setActiveRoom($(this).parents('li').data('server'), $(this).parents('li').data('room'));
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
