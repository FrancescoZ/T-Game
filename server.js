// This file is required by app.js. It sets up event listeners




// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	var game_server=require("./game_server.js");


	app.get('/', function(req, res){
		// Render views/home.html
		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));
		// Redirect to the random room	
	    res.redirect('/home/'+id);
	});
	app.get('/home/:id', function(req,res){
		res.render('home');
	});

	// Initialize a new socket.io application, named 'game'
	var game = io.on('connection', function (socket) {
		// When the client emits the 'load' event, reply with the 
		// number of people in this gamge room
		socket.on('load',function(data){
			var gameSearched = game_server.isGame(data);
			if(!gameSearched) 
				socket.emit('roomDetail', {number: 0});
			else if(gameSearched.players.length>0) 
				socket.emit('roomDetail', {
					number: gameSearched.players.length,
					nusers: gameSearched.maxGamer,
					type: gameSearched.type
				});
		});

		// When the client emits 'login', save his name and color,
		// and add them to the room
		socket.on('login', function(data) {
			var gameSearched = game_server.findGame(data.id,data.maxGamer,data.matchType);
			// Only five people per room are allowed
			if (gameSearched.players.length<data.maxGamer) {
				// Use the socket object to store data. Each client gets
				// their own unique socket object
				
				var player=game_server.addPlayer(data.user,gameSearched.id);
				// Add the client to the room
				socket.join(data.id);
				socket.emit('loggedin',player.color);
				game.in(data.id).emit('peopleloggedin', {
						username:player.username,
						color:player.color,
						id:gameSearched.id
					});
				console.log(gameSearched.players.length+' '+data.maxGamer);
				if (gameSearched.players.length ==data.maxGamer) {
					console.log('dentro');
					// Send the startGame event to all the people in the
					// room, along with a list of people that are in it.
					game.in(data.id).emit('startGame', {
						boolean: true,
						id: data.id,
						users:gameSearched.players,
						type:gameSearched.type
					});
				}
			}
			else {
				socket.emit('wait', {boolean: true});
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
			
		});

		// Handle the sending of messages
		socket.on('msg', function(data){

		});
			
	});
};



