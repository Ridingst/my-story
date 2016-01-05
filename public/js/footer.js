	$(window).load(function() {
	// Full list of configuration options available at:
	// https://github.com/hakimel/reveal.js#configuration
	Reveal.initialize({
		controls: true,
		progress: true,
		history: true,
		center: true,

		transition: 'convex', // none/fade/slide/convex/concave/zoom

		// Optional reveal.js plugins
		dependencies: [
			{ src: 'public/js/classList.js', condition: function() { return !document.body.classList; } },
			{ src: 'public/plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
			{ src: 'public/plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
			{ src: 'public/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
			{ src: 'public/plugin/zoom-js/zoom.js', async: true },
			{ src: 'public/plugin/notes/notes.js', async: true }
		]
	});

var room = getUrlParameter('room')
if (room == undefined){
	//create new ns and qrcode
	room = Math.round(Math.random()*1000000);
	var qrURL = AddUrlParameter(window.location.href, 'room', room);
	var qrcode = new QRCode(document.getElementById("qrcode"));
	qrcode.makeCode(qrURL);
} else {
	ga('send', {
		  hitType: 'event',
	  eventCategory: 'session',
	  eventAction: 'joined',
	  eventLabel: room
	});
};
console.log('room: ' + room)

var socket = io.connect();
socket.on('message', function(data){
	console.log(data.message);
});

// Register room id
$( document ).ready(function() {
	socket.emit('new-room', {
		'room': room,
	});
});

var ignore= false;

$(window).on('hashchange', function(){

	// Notify other clients that we have navigated to a new slide
	// by sending the "slide-changed" message to socket.io

	if(ignore){
		// You will learn more about "ignore" in a bit
		return;
	}
	console.log('slide change initiated: ' + window.location.hash)
	var hash = window.location.hash;

	socket.emit('slide-changed', {
		hash: hash,
		'room': room,
	});
	ga('send', {
		  hitType: 'event',
	  eventCategory: 'navigation',
	  eventAction: 'hashchange',
	  eventLabel: hash
	});
});

socket.on('navigate', function(data){

		// Another device has changed its slide. Change it in this browser, too:

		window.location.hash = data.hash;
		console.log('External Naviagton Received: ' + data.hash)

		// The "ignore" variable stops the hash change from
		// triggering our hashchange handler above and sending
		// us into a never-ending cycle.

		ignore = true;

		setInterval(function () {
			ignore = false;
		},100);

	});

$(".se-pre-con").fadeOut("slow");
});
