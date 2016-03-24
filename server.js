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
				socket.emit('loggedin',{
					color:player.color,
					index:player.index
				});
				game.in(data.id).emit('peopleloggedin', {
						username:player.username,
						color:player.color,
						index:player.index,
						id:gameSearched.id
					});
				if (gameSearched.players.length ==data.maxGamer) {
					// Send the startGame event to all the people in the
					// room, along with a list of people that are in it.
					game.in(data.id).emit('startGame', {
						boolean: true,
						id: data.id,
						type:gameSearched.type,
						users:gameSearched.players
					});
					game.in(data.id).emit('turn',{
						color:gameSearched.players[gameSearched.activePlayer].color,
						index:gameSearched.players[gameSearched.activePlayer].index,
						boolean: true,
						id: data.id
					});
					var interval=function(){
						var timer = game_server.findGame(data.id,data.maxGamer,data.matchType).timer++;
						game.in(data.id).emit("timer",{
							id:data.id,
							second:timer});
						if (timer>40){
							game_server.playerMoved(data.id);
							game.in(data.id).emit('turn',{
								color:gameSearched.players[gameSearched.activePlayer].color,
								index:gameSearched.players[gameSearched.activePlayer].index,
								boolean: true,
								id: data.id
							});
							clearInterval(interval);
							setInterval(interval,1000);
						}
					};
					setInterval(interval,1000);


				}
			}
			else {
				socket.emit('wait', {boolean: true});
			}
		});

		socket.on('played',function(data){
			var gameSearched = game_server.findGame(data.id);
			game.in(data.id).emit('moved',data);
			if (data.squareClicked==0)
				game_server.playerMoved(data.id);
			game.in(data.id).emit('turn',{
				color:gameSearched.players[gameSearched.activePlayer].color,
				boolean: true,
				index:gameSearched.players[gameSearched.activePlayer].index,
				id: data.id
			});
		});

		// Somebody left the chat
		socket.on('disconnect', function(data) {
			if (!game_server.isGame(data.id))
				return;
			var gameSearched = game_server.findGame(data.id);
			game_server.removePlayer(data.id,data.color);
			game.in(data.id).emit('leave',data);
		});			
	});
};



