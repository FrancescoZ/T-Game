//la choix du module exports a ete commente dans le fiche server.js
//ce js s'occupe de gerer toutes les differentes partie du jeu cote serveur 
var game_server = module.exports = { 
	//liste des jeux actives
	games : [], 
	game_count:0, 
	//player qui ont laisse le match
	removedPlayer:[],
	//colors des players
    colors:['#e60000','#009900','#3385ff','#ff9900','#c61aff'],
    //la fonctionne reconnait si le jeu existe grace a une propriete de javascript qui permet de traiter les vectors comme une dictionaire
	isGame: function(id) {
	    return (this.games[id]);
	},
	//il trouve le jeu en fonction de son id ou ses caracteristique: nombre de joueurs, type de grille. Si le jeu n'existe pas il s'occupe de le crer
	findGame:function(id,maxGamer,type){
		//on regarde si un jeu avec ce id existe
		if (this.isGame(id))
			return this.isGame(id);
		//on cherche le jeu par ses carateristique
		for (var i=0;i<this.games.length;i++){
			if (this.games[i] && this.games[i].maxGamer==maxGamer && this.games[i].type==type && this.games[i].players.length<maxGamer)
				return this.games[i];
		}
		//si on n'a rien trouve alors on cree le jeu
		this.games[id]=this.createGame(id,maxGamer,type);
		console.log('Game found');
		console.log(this.games[id]);
		return this.games[id];
	},
	//initialise le jeu de base
	createGame:function(id,maxGamer,type){
		var game={
			id:id,
			maxGamer:maxGamer,
			type:type,
			players:[],
			clickedObject:[],
			activePlayer:0,
			timer:0
		}
		console.log("Game created:");
		console.log(game);
		return game;
	},
	//la fonctionne ajoute un player a la liste de joueurs du jeu indique avec id, la variable email est stocke pour de futur utilisation
	addPlayer:function(username,id,mail){
		if (!this.isGame(id))
			return;
		console.log('look');
		console.log(this.games[id]);
		if (this.games[id].players.length>=this.games[id].maxGamer)
			return;
		//ls couleur du player est donne selon le nombre d'arrive, c'est a dire que le jouer 1 aura toujour la couleur color[0]
		var player={
			username:username,
			mail:mail,
			color:this.colors[this.games[id].players.length],
			index:this.games[id].players.length+1
		};
		this.games[id].players.push(player);
		console.log("New player");
		console.log(player);
		return player;
	},
	//on ajoute un vieu player qui s'etait deconnecte
	addOld:function(id,index,color){
		//on retourne le jouer si on le trouve dans la liste des players deconnecte
		for (var i=0;i<this.removedPlayer.length;i++){
			if(this.removedPlayer[i].id==id && this.removedPlayer[i].user.index==index && this.removedPlayer[i].user.color==color){
				this.removedPlayer[i].user.index=this.games[id].players.length;
				this.games[id].players.push(this.removedPlayer[i].user);
				var pl=this.removedPlayer[i].user;
				this.removedPlayer.splice(this.removedPlayer[i],1);
				console.log('Old player join:');
				console.log(pl);
				return pl;
			}
		}
	},
	//un joueur a laise le match donc on l'enleve du game et on le stock dans un liste de player deconnecte
	removePlayer:function(id,color){
		if (!this.isGame(id))
			return false;
		//le player dans un macth est identifie par sa couleur 
		for (var i=0;i<this.games[id].players.length;i++){
			if (this.games[id].players[i].color==color){
				this.removedPlayer.push({
					id:id,
					user:this.games[id].players[i]
				});
				console.log('Removed player');
				console.log(this.games[id].players[i]);
				this.games[id].players.splice(this.games[id].players.indexOf(this.games[id].players[i]),1);
				return true;
			}
		}
		return false;
	},
	//le player a touche une ligne donc on stock la position touche pour pouvoir en suit envoie la liste de mouvement si quelqun se reconnect 
	playerMoved:function(id,square,coor){
		if (!this.isGame(id))
			return;
		//on reset le timer 
		this.games[id].timer=0;
		//on stock le coordonnes clické
		if (coor)
			this.games[id].clickedObject.push({
				coor:coor,
				index:this.games[id].players[this.games[id].activePlayer].index,
				color:this.games[id].players[this.games[id].activePlayer].color
			});
		//si il a pas colore de carre on passe au suivant si non on le laisse jouer a nouveau
		if (square==0)
			if (++this.games[id].activePlayer>=this.games[id].players.length)
				this.games[id].activePlayer=0;
		console.log('Click by:');
	},
	//le jeu est fini, on efface tout les jouer et le jouer deconnecte
	removeGame:function(id){
		if (!this.isGame(id))
			return;
		console.log("Game removed:");
		console.log(this.games[id]);
		this.games.splice(this.games.indexOf(this.games[id]),1);
		for (var i=0;i<this.removedPlayer.length;i++)
			if (this.removedPlayer[i].id==id){
				this.removedPlayer.splice(this.removedPlayer[i],1);
				i--;
			}
	},
	//recherche du player par color
	getPlayer:function(id,color){
		if (!this.isGame(id))
			return;
		console.log('Find player:');
		console.log(color);
		for (var i=0;i<this.games[id].players.length;i++)
			if (this.games[id].players[i].color==color)
				return this.games[id].players[i];
	}

}
