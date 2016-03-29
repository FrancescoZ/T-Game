
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
		for (var i=0;i<this.games.length;i++){
			if (this.games[i] && this.games[i].maxGamer==maxGamer && this.games[i].type==type && this.games[i].players.length<maxGamer)
				return this.games[i];
		}
		this.games[id]=this.createGame(id,maxGamer,type);
		console.log('Game found');
		console.log(this.games[id]);
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
		console.log("Game created:");
		console.log(game);
		return game;
	},
	addPlayer:function(username,id,mail){
		if (!this.isGame(id))
			return;
		console.log('look');
		console.log(this.games[id]);
		if (this.games[id].players.length>=this.games[id].maxGamer)
			return;
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
	addOld:function(id,index,color){
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
	removePlayer:function(id,color){
		if (!this.isGame(id))
			return false;
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
	playerMoved:function(id,square,coor){
		if (!this.isGame(id))
			return;
		
		this.games[id].timer=0;
		if (coor)
			this.games[id].clickedObject.push({
				coor:coor,
				index:this.games[id].players[this.games[id].activePlayer].index,
				color:this.games[id].players[this.games[id].activePlayer].color
			});
		if (square==0)
			if (++this.games[id].activePlayer>=this.games[id].players.length)
				this.games[id].activePlayer=0;
		console.log('Click by:');
	},
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
