// This file is required by app.js. It sets up event listeners




// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	var game_server=require("./game_server.js");

	app.get('/home',function(req,res){
		// Render views/home.html
		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));
		// Redirect to the random room	
	    res.redirect('/home/'+id);
	});
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

		socket.on('reconnected',function(data){
			var gameSearched = game_server.isGame(data.id);
			if (!gameSearched)
				return socket.emit('noMoreGame',{});
			if (gameSearched && gameSearched.players.length<data.maxGamer) {
				var player=game_server.addOld(data.id,data.index,data.color);
				// Add the client to the room
				socket.join(data.id);
				socket.emit('resume',gameSearched);
				game.in(data.id).emit('gamerReconnected', {
						username:player.username,
						color:player.color,
						index:player.index,
						id:gameSearched.id
					});
			}
			
		});
		// When the client emits 'login', save his name and color,
		// and add them to the room
		socket.on('login', function(data) {
			var gameSearched = game_server.findGame(data.id,data.maxGamer,data.matchType);
			// Only five people per room are allowed
			if (gameSearched.players.length<gameSearched.maxGamer) {
				// Use the socket object to store data. Each client gets
				// their own unique socket object
				console.log('server:');
				console.log(gameSearched);
				
				var player=game_server.addPlayer(data.user,gameSearched.id,data.email);
				// Add the client to the room
			
				console.log('player:');
				console.log(player);
				socket.join(gameSearched.id);
				socket.emit('loggedin',{
					username:player.username,
					color:player.color,
					index:player.index,
					type:gameSearched.type,
					max:gameSearched.maxGamer,
					mail:player.mail,
					id:gameSearched.id
				});
				game.in(gameSearched.id).emit('peopleloggedin', {
						username:player.username,
						color:player.color,
						index:player.index,
						id:gameSearched.id
					});
				if (gameSearched.players.length ==gameSearched.maxGamer) {
					// Send the startGame event to all the people in the
					// room, along with a list of people that are in it.
					game.in(gameSearched.id).emit('startGame', {
						boolean: true,
						id: gameSearched.id,
						type:gameSearched.type,
						users:gameSearched.players
					});
					game.in(gameSearched.id).emit('turn',{
						color:gameSearched.players[gameSearched.activePlayer].color,
						index:gameSearched.players[gameSearched.activePlayer].index,
						boolean: true,
						id: gameSearched.id
					});
					var interval=function(){
						var timer = game_server.findGame(gameSearched.id,data.maxGamer,data.matchType).timer++;
						game.in(gameSearched.id).emit("timer",{
							id:gameSearched.id,
							second:timer});
						/*if (timer>40){
							game_server.playerMoved(data.id,0);
							game.in(data.id).emit('turn',{
								color:gameSearched.players[gameSearched.activePlayer].color,
								index:gameSearched.players[gameSearched.activePlayer].index,
								boolean: true,
								id: data.id
							});
							clearInterval(interval);
							setInterval(interval,1000);
						}*/
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
			game_server.playerMoved(data.id,data.squareClicked,data.coor);
			game.in(data.id).emit('turn',{
				color:gameSearched.players[gameSearched.activePlayer].color,
				boolean: true,
				index:gameSearched.players[gameSearched.activePlayer].index,
				id: data.id
			});
		});

		socket.on('gameEnd',function(data){
			var gameSearched=game_server.findGame(data.id);
			if (!gameSearched)
				return;
			var pl=game_server.getPlayer(data.id,data.winnerColor);
			game.in(data.id).emit('end',{
				winner:data.username,
				winnerId:data.index,
				id:data.id,
				again:gameSearched.players.length>1
			});
			game_server.removeGame(data.id);
		});

		// Somebody left the chat
		socket.on('leaving', function(data) {
			if (!game_server.isGame(data.id))
				return;
			var gameSearched = game_server.findGame(data.id);
			if (data.index-1==gameSearched.activePlayer)
				game_server.playerMoved(data.id,data.color);

			if (!game_server.removePlayer(data.id,data.color))
				return;
			
			if (gameSearched.players.length>1){
				game.in(data.id).emit('leave',data);
				return;
			}
			else if (gameSearched.players.length==1)
				game.in(data.id).emit('end',{
					winner:gameSearched.players[0].username,
					winnerId:gameSearched.players[0].index,
					id:data.id,
					again:false
				});
			game_server.removeGame(data.id);
		});			
	});
};



