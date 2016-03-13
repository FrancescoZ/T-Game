// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into color images:

var gravatar = require('gravatar');

var colors=['','','','',''];

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	app.get('/', function(req, res){
		// Render views/home.html
		console.log('An user asked for index');
		res.render('home');
		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));
		// Redirect to the random room
		res.redirect('/home/'+id);
	});
	app.get('/home/:id', function(req,res){
		res.render('/home/');
	});

	// Initialize a new socket.io application, named 'game'
	var game = io.on('connection', function (socket) {
		// When the client emits the 'load' event, reply with the 
		// number of people in this gamge room

		socket.on('load',function(data){
			var room = findClientsSocket(io,data);
			if(room.length === 0 ) {

				socket.emit('peopleingame', {number: 0});
			}
			else if(room.length >= 1) {
				usrs=[];
				clrs=[];
				for (r in room){
					usrs.push(r.username);
					clrs.push(r.color);
				}

				socket.emit('peopleingame', {
					number: 1,
					user: usrs,
					color: clrs,
					id: data
				});
			}
		});

		// When the client emits 'login', save his name and color,
		// and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.id);
			// Only five people per room are allowed
			if (room.length < 5) {

				// Use the socket object to store data. Each client gets
				// their own unique socket object

				socket.username = data.user;
				socket.room = data.id;
				socket.color = colors[id%5];

				// Tell the person what he should use for an color
				socket.emit('colorGamer', socket.color);


				// Add the client to the room
				socket.join(data.id);

				if (room.length >= 1) {

					var usernames = [],
						avatars = [];

					for(r in room){
						usernames.push(r.username);
						avatars.push(r.color);
					}

					usernames.push(socket.username);			
					avatars.push(socket.color);

					// Send the startChat event to all the people in the
					// room, along with a list of people that are in it.

					game.in(data.id).emit('startGame', {
						boolean: true,
						id: data.id,
						users: usernames,
						avatars: avatars
					});
				}
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			// Notify the other person in the chat room
			// that his partner has left

			socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username,
				color: this.color
			});

			//if (this.room.length<=1){
			//}

		});

		socket.on('move', function(data){
			socket.broadcast.to(socket.room).emit('otherMove', {idLine: data.moveId, user: data.user, color: data.color});
		});

		// Handle the sending of messages
		socket.on('msg', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
		});
			
	});
};

function findClientsSocket(io,roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}


