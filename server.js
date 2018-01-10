// This file is required by app.js.
// Il est necessaire pour pouvoir ensuite l'utiliser dans app
module.exports = function(app,io){

	//on utilisera l'engine de jeu pour gerer les joueurs et les differents jeux
	var game_server=require("./game_server.js");

	//si on demande la page home on lui donne un ID unique et on donne la page home.html
	app.get('/home',function(req,res){
		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));
	    res.redirect('/home/'+id);
	});
	app.get('/', function(req, res){
		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));
		// Redirect to the random room	
	    res.redirect('/home/'+id);
	});
	app.get('/home/:id', function(req,res){
		//express nous permet de ne pas appeler tout les fiches inclue
		res.render('home');
	});

	//on cree une connection avec le client
	var game = io.on('connection', function (socket) {
		//quand le client emit le signal 'load' on lui repode avec:
		//le nombre de joueurs si on trouve un jeu qui responde a sa demande
		//0 qui signifie que il vien de creer un nouveau jeu dans la liste
		socket.on('load',function(data){
			//data contiene l'identifiant genere au debut à la ligne 16, il identifie le jeu donc, si isGame n'est pas undefined il contiendra le jeu
			//avec id==data
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

		//l'utilisateur comprende tout seul qui il s'est deconnecte et il demande donc de retourne a jouer si il y a encore de match
		socket.on('reconnected',function(data){
			//ce control est capital autrement il generait une exception du à l'utilisation d'un undefined 
			var gameSearched = game_server.isGame(data.id);
			if (!gameSearched)
				//le jeu est deja termine
				return socket.emit('noMoreGame',{});
			//on rajoute le client a la chambre et on lui donne la liste de mouvement faits a partirt du debut du match
			if (gameSearched && gameSearched.players.length<data.maxGamer) {
				//on comunique à l'engine que il y a un vieu joueur car il l'avait deja ajouter à la liste de joueurs deconnecte
				var player=game_server.addOld(data.id,data.index,data.color);
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
		

		//quand on fait un login on cherche de trouver le jeu recherche:
		//soit par ID
		//soit par nombre de joueurs et nombre de ligne 
		//si on le trouve on donne le nouveau id au client et on lui change de chambre sur le socket
		//si on ne le trouve pas on cree un nouveau jeu avec le carateristique demande. 
		//Donc le jeu peut etre trouve par son ID ou par ses carateristiques
		socket.on('login', function(data) {
			var gameSearched = game_server.findGame(data.id,data.maxGamer,data.matchType);
			//si on a trouve le jeu et il y a encore des places on ajoute le client a la chambre
			if (gameSearched.players.length<gameSearched.maxGamer) {
				console.log('server:');
				console.log(gameSearched);
				
				var player=game_server.addPlayer(data.user,gameSearched.id,data.email);
			
				console.log('player:');
				console.log(player);
				socket.join(gameSearched.id);
				//on comunique au joueur son nouveau ID et toutes les information necesaire pour pouvoir crer la grille 
				socket.emit('loggedin',{
					username:player.username,
					color:player.color,
					index:player.index,
					type:gameSearched.type,
					max:gameSearched.maxGamer,
					mail:player.mail,
					id:gameSearched.id
				});
				//on comunique aussi aux autres joueurs que il y a un autre joueur, on donne aussi sa couleur et son nom
				game.in(gameSearched.id).emit('peopleloggedin', {
						username:player.username,
						color:player.color,
						index:player.index,
						id:gameSearched.id
					});
				//si le nombre de joueur corresponde a le max chercher alors on peut commencer a jouer
				if (gameSearched.players.length ==gameSearched.maxGamer) {
					//d'ici la comunication du server sera faite vers tout le client qui sont dans une chambre 
					game.in(gameSearched.id).emit('startGame', {
						boolean: true,
						id: gameSearched.id,
						type:gameSearched.type,
						users:gameSearched.players
					});
					//on gere aussi le turn, pour la precision est l'objet gamer qui s'occupe de changer le turn 
					game.in(gameSearched.id).emit('turn',{
						color:gameSearched.players[gameSearched.activePlayer].color,
						index:gameSearched.players[gameSearched.activePlayer].index,
						boolean: true,
						id: gameSearched.id
					});
					//chaque second on envoie un signal a tout le monde pour crer un timer
					var interval=function(){
						var timer = game_server.findGame(gameSearched.id,data.maxGamer,data.matchType).timer++;
						game.in(gameSearched.id).emit("timer",{
							id:gameSearched.id,
							second:timer});
					};
					setInterval(interval,1000);
				}
			}
			else {
				socket.emit('wait', {boolean: true});
			}
		});

		//le client comunique au serveur qui il le player a touche une ligne et aussi combien de carre il a colore, cela nous permet de 
		//gerer le turn de fason efficace et aussi de comuniquer aux autres ce qui c'est passe
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

		// a la fin du match le joueur qui joue son turn comunique au server gameEnd et le serveur efface le jeu de sa liste et comunique a tout le 
		//qui a gagne 
		socket.on('gameEnd',function(data){
			var gameSearched=game_server.findGame(data.id);
			if (!gameSearched)
				return;
			//on trouve le nom du gagnant 
			var pl=game_server.getPlayer(data.id,data.winnerColor);
			//on comunique a tous la nouvelle 
			game.in(data.id).emit('end',{
				winner:data.username,
				winnerId:data.index,
				id:data.id,
				again:gameSearched.players.length>1
			});
			//on enleve le jeu dans la liste de jeu active
			game_server.removeGame(data.id);
		});

		// Quand quelq'un laisse le jeu il y a  deux possibilite:
		//soit  il reste que un joueur et il devienne donc le gagnant et donc on return a la methode gameEnd
		//soit il reste plusieurs joueurs donc le jeu continue sachant que le player qui a laisse peut retourne 
		socket.on('leaving', function(data) {
			if (!game_server.isGame(data.id))
				return;
			var gameSearched = game_server.findGame(data.id);
			//si c'etait le joueur active on pass le turne 
			if (data.index-1==gameSearched.activePlayer)
				game_server.playerMoved(data.id,data.color);
			//si le joueur n'etait pas sur la liste on fait rien 
			if (!game_server.removePlayer(data.id,data.color))
				return;
			//on decide si continuer ou non
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



