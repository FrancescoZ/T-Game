
var game_server = module.exports = { 
	games : {}, 
	game_count:0, 
    colors:['#e60000','#009900','#3385ff','#ff9900','#c61aff'],
	isGame: function(id) {
	    return (this.games[id]);
	},
	findGame:function(id,maxGamer,type){
		if (this.isGame(id))
			return this.isGame(id);
		for (var game in this.games)
			if (game.maxGamer===maxGamer && game.type===type && games.players.lenght<maxGamer)
				return game;
		this.games[id]=this.createGame(id,maxGamer,type);
		
		return this.games[id];
	},
	createGame:function(id,maxGamer,type){
		var game={
			id:id,
			maxGamer:maxGamer,
			type:type,
			players:[],
			clickedObject:[]
		}
		return game;
	},
	addPlayer:function(username,id){
		if (!this.isGame(id))
			return;
		if (this.games[id].players.lenght==this.games[id].maxGamer)
			return;
		var player={
			username:username,
			color:this.colors[this.games[id].players.lenght]
		};
		this.games[id].players.push(player);
		return player;
	}
}
