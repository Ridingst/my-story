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
var async = require('async');

var jobs, projects, cv, cvurl;

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
    res.status(500).send("Error 500");
  }
}

// Routes
/*app.route('/').get(function(req, res) {
  var j = prismic.withContext(req,res);
  var p = prismic.withContext(req,res);
  var jobs, projects;
  j.query(prismic.Predicates.at('document.type', 'job'),
    { orderings :'[my.job.order desc]' },
  function (err, pagecontent) {
    if(err) return handleError(err, req, res);
    jobs = pagecontent.results;
  });
  p.query(prismic.Predicates.at('document.type', 'project'),
    { orderings :'[my.project.order desc]' },
  function (err, pagecontent) {
    if(err) return handleError(err, req, res);
    projects = pagecontent.results;
    res.render('index', {
      jobcontent: jobs,
      projectcontent: projects
    });
  });

});
*/

var resolver = function (ctx, doc, isBroken) {
  if (isBroken) return '#broken';
  return "/testing_url/" + doc.id + "/" + doc.slug + ( ctx.maybeRef ? '?ref=' + ctx.maybeRef : '' );
};

app.route('/').get(function(req, res) {
    console.log('get request received');
    async.parallel([
            //Load jobs
            function(callback) {
                console.log('loading jobs')
                var j = prismic.withContext(req,res);
                
                j.query(prismic.Predicates.at('document.type', 'job'),
                    { orderings :'[my.job.order desc]' },
                  function (err, pagecontent) {
                    if(err) return handleError(err, req, res);
                    jobs = pagecontent.results;
                    console.log('jobs received from prismic');
                    callback();
                  });
            },
            //Load cv
            function(callback) {
                console.log('loading cv')
                var c = prismic.withContext(req,res);
                c.getByUID('cv', 'cv', 
                  function (err, pagecontent) {
                    if(err) return handleError(err, req, res);
                    cv = pagecontent;
                    cvurl = pagecontent.fragments['cv.cv'].value.file.url
                    callback();
                  });
            },
            //Load projects
            function(callback) {
                console.log('loading projects')
                var p = prismic.withContext(req,res);

                p.query(prismic.Predicates.at('document.type', 'project'),
                    { orderings :'[my.project.order desc]' },
                  function (err, pagecontent) {
                    if(err) return handleError(err, req, res);
                    projects = pagecontent.results;
                    console.log('projects received from prismic');
                    callback();
                  });

            }
        ], function(err) { //This function gets called after the tasks have called their "task callbacks"
            console.log('rendering index page');
            res.render('index', { jobcontent: jobs, projectcontent: projects, cvcontent: cv, cvurl: cvurl });
        });
});



// Spark the HTTP Server up
var server = app.listen(8001, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening on port: %s', port);
});

// Add Socket.io server
// -- Added some standard functions (remove later)
// -- Hardcoded url whilst running on local, change to server.address().address when deploying.
io.listen(server);

	var listener = io.listen(server);
	listener.sockets.on('connection', function(socket){
		socket.emit('message', {'message': 'hello socket'});
        socket.emit('url', {'url': 'http://192.168.1.5:' + server.address().port});

        socket.on('new-room', function (data){
            console.log('new room registered: ' + data.room);
            console.log(data);
            socket.join(data.room);
        });

    	socket.on('slide-changed', function (data){
    		console.log('slide change issued')
    		listener.in(data.room).emit('navigate', { hash: data.hash });
    	});
	});