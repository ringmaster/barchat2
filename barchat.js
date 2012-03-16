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

//app.get('/', routes.index);
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
      session.rooms = ['4f6383b97b6b58273f88ca51'];
      doc.sessions.push(session)
      doc.save();
      res.json({'uid': doc._id, 'nickname': doc.nickname, 'token': session._id, 'session': session});
    }
  });
});

app.get("/api/v1.0/getSession", function(req, res) {
  var session_id = req.query.token;
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
  var session_id = req.query.token;
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
  var session_id = req.query.token;
  userFromToken(
    session_id, 
    function(user){
      console.log(user.username, session_id, user.sessions.id(session_id).ping);
      // db.users.update({'sessions.token': 'a1506f3509d289bd82a8d19af97cd3cd'}, {$addToSet: {'sessions.$.rooms': 'room1'}})
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
  var session_id = req.query.token;
  console.log(session_id);
  userFromToken(
    session_id, 
    function(user){
      user.sessions.id(session_id).rooms.push(req.query.room);
      user.sessions.id(session_id).rooms = _.uniq(user.sessions.id(session_id).rooms);
      user.sessions.id(session_id).save();
      Rooms.find({_id: {$in: user.sessions.id(session_id).rooms}}, function (err, docs){
        console.log(user.sessions.id(session_id).rooms, err, docs);
        res.json(docs);
      });
    },
    function(error){
      res.json(error);
    }
  );
});

app.get("/api/v1.0/sendMessage", function(req, res) {
  Users.findOne({'sessions.token': req.query.token}, function(err, doc){
    if(doc == null) {
      res.json({err: 1, errMsg: 'Inavlid Token'});
    }
    else {
      for(var index in doc.sessions) {
        if(doc.sessions[index].token == req.query.token) {
          session = index;
          break;
        }
      }
      doc.sessions[index].ping = new Date();
      doc.sessions[index].rooms.push(req.query.room);
      doc.save();
    }
  });
});

app.get("/api/v1.0/partRoom", function(req, res) {});
app.get("/api/v1.0/listUsers", function(req, res) {});
app.get("/api/v1.0/listUsers", function(req, res) {});


app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
