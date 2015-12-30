var express = require('express');
var app = express();
var jade = require('jade');
var io = require('socket.io');
var prismic = require('express-prismic').Prismic;
var configuration = require('./prismic-configuration').Configuration;
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

prismic.init(configuration);


// Set jade as render engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser('2404'));
app.use(session({secret: '2404', saveUninitialized: true, resave: true}));

// Expose Public Folder
app.use('/public', express.static(__dirname + '/public'));

app.use(errorHandler());

function handleError(err, req, res) {
  if (err.status == 404) {
    res.status(404).send("404 not found");
  } else {
    res.status(500).send("Error 500: " + err.message);
  }
}

// Routes
app.route('/').get(function(req, res) {
  var p = prismic.withContext(req,res);
  p.getByUID('job', 'ibm', function (err, pagecontent) {
    if(err) return handleError(err, req, res);
    res.render('index', {
      pagecontent: pagecontent
    });
  });
});



// Spark the HTTP Server up
var server = app.listen(8001, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

// Add Socket.io server
// -- Added some standard functions (remove later)
// -- Hardcoded url whilst running on local, change to server.address().address when deploying.
io.listen(server);

	var listener = io.listen(server);
	listener.sockets.on('connection', function(socket){
		socket.emit('message', {'message': 'hello socket'});
        socket.emit('url', {'url': 'http://192.168.1.5:' + server.address().port});
        console.log('connection received');

        socket.on('new-room', function (data){
            console.log('new room registered: ' + data.room);
            socket.join(data.room);
        });

    	socket.on('slide-changed', function (data){
    		console.log('slide change issued')
    		listener.in(data.room).emit('navigate', { hash: data.hash });
    	});
	});