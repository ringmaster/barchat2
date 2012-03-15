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

function shuffle(o){ //v1.0, code based on Fisher-Yates 
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

$(function(){
	// Initialize room sample content
	var users = [{username: 'billj', avatar: 'avatar.png', user_id: 1},{username: 'sueh', avatar: 'avatar2.png', user_id: 2}];
	for(var z = 1; z<=3; z++) {
		c = function(){
			var element = z;
			BarchatUI.addRoom('room' + element, 'Room ' + element);

			var t=10;
			for(var m = 0; m <= 7; m++) {
				var url = "http://search.twitter.com/search.json?q=kitten&callback=?&rpp='+t+'&page=1&lang=en";
				$.getJSON(url,
					function(data){
						output = '';
						if(data.results){
							for(i=0;i<t && i<data.results.length;i++){
								var r = '';
								r += data.results[i].text;
								r = r.toUpperCase().substr(0,1) + r.toLowerCase().substr(1) + ' ';
								if(i%5 == 0 && i>0)r = '<br /><br />' + r;
								output += r;
							}
						}
						output = shuffle(output.replace(/<.+?>/ig, '').split(' ')).join(' ');
						BarchatUI.msgRoom('room' + element, [{user: users[Math.floor(Math.random() * users.length)], msg: output, timestamp: new Date().getTime()}]);
					}
				);
			}
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
