$(function(){
	// Initialize room sample content
	var s = 4;
	$('#room1,#room2,#room3').each(function(){
		var element = $(this);
		s++;
		$.getJSON('http://json-lipsum.appspot.com/?amount=' + s + '&start=no&lang=en&callback=?', function(results) {
			for(var p in results.lipsum) {
				$(element).append('<p>' + results.lipsum[p] + '</p>');
			}
		});
	});

	// Initialize user sample content
	$('#statusbar').append(ich.placard_group({name: 'online', placards: [{avatar: 'avatar.png', nickname: 'Bill Jennings'}]}));
	$('#statusbar').append(ich.placard_group({name: 'services', placards: [{avatar: 'github.png', nickname: 'GitHub'}]}));
	$('#statusbar').append(ich.placard_group({name: 'offline', placards: [{avatar: 'avatar2.png', nickname: 'Sue Heron'}]}));


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


	$('#roomtabs a').click(function(){
		$('.room,#roomtabs li').removeClass('active');
		$($(this).attr('href')).addClass('active');
		$(this).parents('li').addClass('active');
		return false;
	});

	window.setInterval(function(){
		$.get('/api/v1.0/getMessages', 'foo=1', function(data){
			console.log(data);
		}, 'jsonp');
	}, 2000);

});
