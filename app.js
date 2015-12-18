var express = require('express');
var app = express();
var jade = require('jade');
var io = require('socket.io');



// Set jade as render engine
app.set('view engine', 'jade');

// Expose Public Folder
app.use('/public', express.static(__dirname + '/public'));

// Create Index route
app.get('/', function (req, res) {
    res.render('index');
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