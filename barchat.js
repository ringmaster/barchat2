var $ = require('jqNode').$;

$('/test').get(function(request, response, data) {
	$.write('hello');
});

$('/').get(function(request, response, data) {
	$.writeFile($.config.docroot + '/index.html');
});


$.start({port: 8080, docroot: __dirname + '/htdocs', debug: true});

