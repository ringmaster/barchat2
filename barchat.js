var express = require('express')
  , routes = require('./routes')
  , mongoose = require("mongoose")
  , Schema = mongoose.Schema
  , crypto = require('crypto');

var app = module.exports = express.createServer();

// App Configuration
app.configure(function(){
	app.set("view engine", "html");
  app.set('view options', {layout: false});
  // make a custom html template
  app.register('.html', {
    compile: function(str, options){
      return function(locals){
        return str;
      };
    }
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/htdocs'));
  app.enable("jsonp callback");
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Database

var SessionsSchema = new Schema({
  token: String,
  ping: Date,
  rooms: [String]
});

var UsersSchema = new Schema({
  username: String,
  password: String,
  nickname: String,
  sessions: [SessionsSchema]
});

var MessagesSchema = new Schema({
  userId: String,
  raw: String,
  display: String,
  posted: Date,
  toUserId: String
});

mongoose.connect('mongodb://localhost/barchat');
var Users = mongoose.model('Users', UsersSchema);
var Messages = mongoose.model('Messages', MessagesSchema);

// Routes

//app.get('/', routes.index);
app.get('/', function(req,res) {
  res.render('index.html');
});

app.post("/api/v1.0/getUserToken", function(req, res) {
  Users.findOne({username: req.body.username, password: crypto.createHash('md5').update(req.body.password).digest("hex")}, function(err, doc){
    if(doc == null) {
      res.json({err: 1, errMsg: 'Inavlid Username/Password'});
    }
    else {
      token = crypto.createHash('md5').update(Math.random().toString()).digest("hex");
      doc.sessions.push({token: token, ping: new Date});
      doc.save();
      res.json({'uid': doc._id, 'token': token, 'usernamez': doc.username, 'nickname': doc.nickname});
    }
  });
});

app.get("/api/v1.0/getMessages", function(req, res) {
  Messages.find({}, function(err, docs){
    res.json('ok');
  });
});


app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
