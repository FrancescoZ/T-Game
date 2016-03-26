		var cnvElement=[];
		var sqrElement=[];
		var gameSquare=[];

		var users=[];
		var id;


		class ClickableArea{
			constructor(type,row,col,minX,maxX,minY,maxY){
				this.minY=minY;
				this.minX=minX;
				this.maxY=maxY;
				this.maxX=maxX;
				this.row=row;
				this.col=col;
				this.type=type;
			}
		}

		function circle(ctx,x,y,d,fill,stroke){
			ctx.beginPath();
			ctx.arc(x, y, d/2, 0, 2 * Math.PI, false);
		    if (stroke)
		    	ctx.stroke();
		    if (fill)
		    	ctx.fill();
		}

		function roundRect(ctx,row,col,type, x, y, width, height, radius, fill, stroke) {
			  if (typeof stroke == "undefined" ) {
			    stroke = true;
			  }
			  if (typeof radius === "undefined") {
			    radius = 5;
			  }
			  ctx.beginPath();
			  ctx.moveTo(x + radius, y);
			  ctx.lineTo(x + width - radius, y);
			  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			  ctx.lineTo(x + width, y + height - radius);
			  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
			  ctx.lineTo(x + radius, y + height);
			  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
			  ctx.lineTo(x, y + radius);
			  ctx.quadraticCurveTo(x, y, x + radius, y);
			  ctx.closePath();
			  if (stroke) {
			    ctx.stroke();
			  }
			  if (fill) {
			    ctx.fill();
			  }

			  /*To debug
			  ctx.fillStyle = "red";
		      ctx.font = "10pt sans-serif";
		      if (type==='s')
		      	x+=(width/2)-10;
		      ctx.fillText(row+','+col, x, y+(height/2));*/

			  return new ClickableArea(type,row,col,x,x+width,y,y+height);   
		}

		    function Board(id, c, r,clr) {
		        if (this instanceof Board) {
		            this.CANVAS = document.getElementById(id);
		            this.CTX = this.CANVAS.getContext("2d");
		            this.WIDTH = this.CANVAS.width || 0;
		            this.HEIGHT = this.CANVAS.height || 0;
		            this.COLS = c || 5;
		            this.ROWS = r || 5;
		            this.ACTIVECOLOR=clr || "#6699ff";
		            this.COLOR="#e6e6e6";
		            this.BORDERCOLOR="#FFFFFF";
		            this.TILEMARGINTOP=12;
		            this.TILEMARGINSIDE=0;
		            this.TILEWIDTH = (this.WIDTH / this.COLS)-5;
		            this.TILEHEIGHT = (this.HEIGHT / this.ROWS)-5;
		            this.moveCount = 0;
		            this.board = this.gameBoard(this.TILEWIDTH, this.COLS, this.ROWS);
		            this.CANVAS.addEventListener('selectstart', function (e) {
		                e.preventDefault();
		                return false;
		            }, false);
		            this.isFinished = false;
		            this.isStarted=false;
		            this.winner=[];
		            this.boardDisabled = false;
		        } else {
		            return new Board(id, c, r,clr);
		        }
		    }
		    Board.prototype.draw = function () {

		    	this.isStarted=true;
		    	//Init
		        var ctx = this.CTX;
		        
		        ctx.strokeStyle = this.BORDERCOLOR;
		        ctx.fillStyle=this.COLOR;

		        //ligne
		        // Draw column dividers
		        for (var i = 0; i <= this.ROWS ; i++) 
			        for (var j= 0; j <= this.COLS ; j++) 
			        	if (this.HEIGHT>(this.TILEHEIGHT*i+this.TILEMARGINTOP+this.TILEHEIGHT-10)){
					        ctx.strokeStyle = this.BORDERCOLOR;
					        ctx.fillStyle=this.COLOR;
				            cnvElement.push(
				            	roundRect(ctx,i,j,'c',
				            		this.TILEWIDTH * j+this.TILEMARGINSIDE,this.TILEHEIGHT*i+this.TILEMARGINTOP,
				            		12,this.TILEHEIGHT-10,7,true,true));
			        	}

		        //Draw horizontal dividers
		        for (var i = 0; i <= this.ROWS ; i++) 
		        	for (var j= 0; j <= this.COLS ; j++) 
		        		if (this.WIDTH>(this.TILEWIDTH * j+this.TILEMARGINSIDE+15+this.TILEWIDTH-15)){
					        ctx.strokeStyle = this.BORDERCOLOR;
					        ctx.fillStyle=this.COLOR;
			            	cnvElement.push(
			            		roundRect(ctx,i,j,'r',
			            			this.TILEWIDTH * j+this.TILEMARGINSIDE+15,this.TILEHEIGHT*i,
			            			this.TILEWIDTH-15,13,7,true,true));
		        		}
			    //square
			    for (var i = 0; i <= this.ROWS ; i++) 
			        for (var j= 0; j <= this.COLS ; j++) 
			        	if (this.WIDTH>(this.TILEWIDTH * j+this.TILEMARGINSIDE+15+this.TILEWIDTH-15) && (this.HEIGHT>(this.TILEHEIGHT*i+this.TILEMARGINTOP+this.TILEHEIGHT-10))){
					        ctx.strokeStyle = this.BORDERCOLOR;
					        ctx.fillStyle=this.COLOR;
			        	    sqrElement.push(roundRect(ctx,i,j,'s',
			            			this.TILEWIDTH * j+this.TILEMARGINSIDE+19,this.TILEHEIGHT*i+19,
			            			this.TILEWIDTH-25,this.TILEWIDTH-25,7,true,true));
			        	}
			    gameSquare=new Array(this.ROWS);
				for (var i = 0; i < this.ROWS; i++) 
					gameSquare[i] = new Array(this.COLS);
				for (var i = 0; i <this.ROWS ; i++) 
			        for (var j= 0; j <this.COLS ; j++) 
			        	gameSquare[i][j]=0;	
		    };
		    Board.prototype.gameBoard = function (t, c, r) {
		        var b = [],
		            count = 0;
		        // Create gameboard array with the following data:
		        // [x pos, y pos, tile count, empty string for move symbol (x or o)]
		        for (var y = 0; y < r; y++) {
		            for (var x = 0; x < c; x++) {
		                b.push([x * t, y * t, count++, ""]);
		            }
		        }
		        return b;
		    };
		    Board.prototype.reset = function (x) {
		        var timer = x || 4000;
		        window.setTimeout(function () {
		                window.location.reload(false);
		            }, timer);
		    };
		    Board.prototype.move = function (coor,color) {
		    	var moved=false;
		        var width = this.TILEWIDTH,
		            ctx = this.CTX;
		         if (!color)
		         	color=this.ACTIVECOLOR;
		         var squareActived=0;
		        //Loop through and find tile that click was detected on
		        for (var i = 0; i < cnvElement.length; i++)
		            if (coor.x > cnvElement[i].minX && coor.y > cnvElement[i].minY && coor.x < cnvElement[i].maxX && coor.y < cnvElement[i].maxY) {
		            		moved=true;
		            		ctx.strokeStyle = color;
					        ctx.fillStyle=color;
		                	roundRect(ctx,cnvElement[i].row,cnvElement[i].col,cnvElement[i].type,
			            			cnvElement[i].minX,cnvElement[i].minY,
			            			cnvElement[i].maxX-cnvElement[i].minX, cnvElement[i].maxY-cnvElement[i].minY,
			            			7,true,true);
		                	var row=cnvElement[i].row,col=cnvElement[i].col,type=cnvElement[i].type;
		                	cnvElement.splice(i,1);
		                	checkSquare(row,col,type);
		                	for (var k = 0; k <this.ROWS ; k++) 
						        for (var j= 0; j <this.COLS ; j++) 
						        	if (gameSquare[k][j]>=4 && !(typeof gameSquare[k][j] === 'string' || gameSquare[k][j] instanceof String)){
						        		squareActived++;
						        		ctx.strokeStyle = color;
					        			ctx.fillStyle=color;
						        		roundRect(ctx,k,j,'s',
				            				this.TILEWIDTH * j+this.TILEMARGINSIDE+19,this.TILEHEIGHT*k+19,
				            				this.TILEWIDTH-25,this.TILEWIDTH-25,7,true,true)  
				            			gameSquare[k][j]=color;
				            		}
		                	break;
		                }
		       	return {squareN:squareActived,moved:moved};
		    };
		    Board.prototype.checkWinner=function(){
	    		this.isFinished=this.checkFinish();
	    		var gamers=new Map();
	    		if (this.isFinished){
	    			for (var k = 0; k <this.ROWS ; k++) 
				        for (var j= 0; j <this.COLS ; j++) 
				        	if (typeof gameSquare[k][j] === 'string' || gameSquare[k][j] instanceof String)
				        		if (gamers.keys().indexOf(gameSquare[k][j])!=-1)
				        			gamers[gameSquare[k][j]]++;
				        		else
				        			gamers.set(gameSquare[k][j],1);
				        	else
				        		return undefined;
				    var max={name:'',value:0};
				    for (var [key, value] of gamers) 
						if (max.value<value)
							max={name:key,value:value};
					return max.name;
	    		}
	    		return undefined;
		    }
		    Board.prototype.checkFinish=function(){
    			for (var k = 0; k <this.ROWS ; k++) 
			        for (var j= 0; j <this.COLS ; j++) 
			        	if (!(typeof gameSquare[k][j] === 'string' || gameSquare[k][j] instanceof String))
			        		return false;
			    return true;
		    }
		    Board.prototype.getScore=function(color){
		    	var count=0;
		    	for (var k = 0; k <this.ROWS ; k++) 
			        for (var j= 0; j <this.COLS ; j++) 
			        	if ((typeof gameSquare[k][j] === 'string' || gameSquare[k][j] instanceof String) && gameSquare[k][j]==color)
			        		count++;
			    return count;
		    }
		   
		   	function checkSquare(row,col,type){
		   		//right square
		   		switch(type){
		   			case 'r':
		   				if (row<5 && row>=0 && col>=0 && col<5)	
		   					gameSquare[row][col]++;
		   				if (row-1>=0)
		   					gameSquare[row-1][col]++;
					break;
		   			case 'c':
		   				if (row<5 && col<5)	
		   					gameSquare[row][col]++;
		   				if (col-1>=0)
		   					gameSquare[row][col-1]++;
		   			break;
		   			case 's':
		   			break;
		   		}
		   	}

		    
	        
		

		//Get Mouse click coordinates within canvas modified to include touch events
		HTMLCanvasElement.prototype.relMouseCoords = function (event) {
		    var totalOffsetX = 0,
		        totalOffsetY = 0,
		        canvasX = 0,
		        canvasY = 0,
		        touch = event.touches,
		        currentElement = this;
		    do {
		        totalOffsetX += currentElement.offsetLeft;
		        totalOffsetY += currentElement.offsetTop;
		    }
		    while (currentElement = currentElement.offsetParent)
		    canvasX = (touch ? touch[0].pageX : event.pageX) - totalOffsetX;
		    canvasY = (touch ? touch[0].pageY : event.pageY) - totalOffsetY;
		    canvasX = Math.round(canvasX * (this.width / this.offsetWidth));
		    canvasY = Math.round(canvasY * (this.height / this.offsetHeight));
		    return {
		        x: canvasX,
		        y: canvasY
		    }
		}

		function supports_html5_storage() {
		    try {
		        return 'sessionStorage' in window && window.sessionStorage !== null;
		    } catch (e) {
		        return false;
		    }
		}