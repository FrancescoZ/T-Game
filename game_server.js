
var game_server = module.exports = { 
	games : [], 
	game_count:0, 
	removedPlayer:[],
    colors:['#e60000','#009900','#3385ff','#ff9900','#c61aff'],
	isGame: function(id) {
	    return (this.games[id]);
	},
	findGame:function(id,maxGamer,type){
		if (this.isGame(id))
			return this.isGame(id);
		for (var game in this.games){
			if (game.maxGamer===maxGamer && game.type===type && game.players.length<maxGamer)
				return game;
		}
		this.games[id]=this.createGame(id,maxGamer,type);
		
		return this.games[id];
	},
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
		return game;
	},
	addPlayer:function(username,id,mail){
		if (!this.isGame(id))
			return;
		if (this.games[id].players.length==this.games[id].maxGamer)
			return;
		var player={
			username:username,
			mail:mail,
			color:this.colors[this.games[id].players.length],
			index:this.games[id].players.length+1
		};
		this.games[id].players.push(player);
		return player;
	},
	removePlayer:function(id,color){
		if (!this.isGame(id))
			return;
		this.removedPlayer.push({
			id:id,
			user:this.games[id].players[color]
		});
		this.games[id].players.splice(this.games[id].players.indexOf(this.games[id].players[color]),1);
	},
	playerMoved:function(id,square){
		if (!this.isGame(id))
			return;
		this.games[id].timer=0;
		if (square==0)
			if (++this.games[id].activePlayer>=this.games[id].players.length)
				this.games[id].activePlayer=0;
		
	},
	removeGame:function(id){
		if (!this.isGame(id))
			return;
		this.games.splice(this.games.indexOf(this.games[id]),1);
		for (var i=0;i<this.removedPlayer.length;i++)
			if (this.removedPlayer[i].id==id){
				this.removedPlayer.splice(this.removedPlayer[i],1);
				i--;
			}
	},
	getPlayer:function(id,color){
		if (!this.isGame(id))
			return;
		for (var player in this.games[id].players)
			if (player.color==color)
				return player;
	}

}
