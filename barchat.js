var express = require('express')
  , routes = require('./routes')
  , mongoose = require("mongoose")
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  , _ = require("underscore")
  , ObjectId = require('mongoose').Types.ObjectId;

var app = module.exports = express.createServer();

// App Configuration
app.configure(function(){
	app.set("view engine", "html");
  app.set('view options', {layout: false});
  // make a custom html template
  app.register('.html', {
    compile: function(str, options){
      return function(locals){
        str = str.replace(/\{\{\$(\w+)\}\}/g, function(str, $1){return options[$1]});
        return str;
      };
    }
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
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

var RoomsSchema = new Schema({
  title: String,
  properties: {},
  permissions: []
});

var SessionsSchema = new Schema({
  token: String,
  ping: Date,
  rooms: [String]
});

var UsersSchema = new Schema({
  username: String,
  password: String,
  nickname: String,
  avatar: String,
  sessions: [SessionsSchema]
});

var MessagesSchema = new Schema({
  user: {type: {}, index: true},
  room: {type: String, index: true},
  raw: String,
  msg: String,
  timestamp: {type: Number, index: true},
  toUserId: String
});

mongoose.connect('mongodb://localhost/barchat');
var Users = mongoose.model('Users', UsersSchema);
var Messages = mongoose.model('Messages', MessagesSchema);
var Sessions = mongoose.model('Sessions', SessionsSchema);
var Rooms = mongoose.model('Rooms', SessionsSchema);

// Utility

var userFromToken = function(token, success, failure) {
  var query = {'sessions._id': token};
  Users.findOne(query, function(err, doc){
    if(doc == null) {
      failure({err: 1, errMsg: 'Inavlid Token'});
    }
    else {
      doc.sessions.id(token).ping = new Date();
      doc.save();

      success(doc);
    }
  });

}

// Routes

app.get('/', function(req,res) {
  res.render('index.html', {host: req.headers.host});
});

app.post("/api/v1.0/getUserToken", function(req, res) {
  Users.findOne({username: req.body.username, password: crypto.createHash('md5').update(req.body.password).digest("hex")}, function(err, doc){
    if(doc == null) {
      res.json({err: 1, errMsg: 'Inavlid Username/Password'});
    }
    else {
      session = new Sessions();
      session.ping = new Date();
      Rooms.find({'properties.default': 1}, function(err, rooms){
        session.rooms = _.map(rooms, function(room){return room._id;});
        doc.sessions.push(session)
        doc.save();
        res.cookie('session', session._id);
        res.json({'uid': doc._id, 'nickname': doc.nickname, 'token': session._id, 'session': session});
      })
    }
  });
});

app.get("/api/v1.0/getSession", function(req, res) {
  var session_id = req.cookies.session;
  userFromToken(
    session_id, 
    function(user){
      res.json(user.sessions.id(session_id));
    },
    function(error){
      res.json(error);
    })
});


app.get("/api/v1.0/getMyRooms", function(req, res) {
  var session_id = req.cookies.session;
  userFromToken(
    session_id, 
    function(user){
      Rooms.find({_id: {$in: user.sessions.id(session_id).rooms}}, function (err, docs){
        res.json(docs);
      });
    },
    function(error){
      res.json(error);
    })
});

app.get("/api/v1.0/getMessages", function(req, res) {
  var session_id = req.cookies.session;
  userFromToken(
    session_id, 
    function(user){
      console.log(user.username, session_id, user.sessions.id(session_id).ping);
      var room_ids = _.map(user.sessions.id(session_id).rooms, function(room){return ObjectId(room)});
      Messages.find({room: {$in: room_ids}, timestamp: {$gt: parseInt(req.query.timestamp)}}, function(err, docs){
        res.json(docs);
      });
    },
    function(error){
      res.json(error);
    })
});

app.get("/api/v1.0/joinRoom", function(req, res) {
  var session_id = req.cookies.session;
  userFromToken(
    session_id, 
    function(user){
      console.log(user.username, session_id, user.sessions.id(session_id).ping, 'join', req.query.room);
      user.sessions.id(session_id).rooms.push(req.query.room);
      user.sessions.id(session_id).rooms = _.uniq(user.sessions.id(session_id).rooms);
      user.sessions.id(session_id).save();
      Rooms.find({_id: {$in: user.sessions.id(session_id).rooms}}, function (err, docs){
        res.json(docs);
      });
    },
    function(error){
      res.json(error);
    }
  );
});

app.post("/api/v1.0/sendMessage", function(req, res) {
  var session_id = req.cookies.session;
  userFromToken(
    session_id, 
    function(user){
      console.log(user.username, user, session_id, user.sessions.id(session_id).ping, 'sendMessage', req.body.room);
      message = new Messages();

console.log(user.avatar, typeof(user.avatar));

      message.user = {'username': user.username, 'avatar': user.avatar, 'user_id': user._id};
      message.raw = req.body.raw,
      message.msg = req.body.raw;
      message.room = req.body.room;
      message.timestamp = new Date().getTime();
      message.toUserId = null;
      message.save();

      res.json(message);
    },
    function(error){
      res.json(error);
    }
  );
});

app.get("/api/v1.0/partRoom", function(req, res) {});
app.get("/api/v1.0/listUsers", function(req, res) {});
app.get("/api/v1.0/registerUser", function(req, res) {});


app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
