//le cote client a ete programme differament, pour montre les differentes faison d'utiliser le javascript 
//cette partie s'occupe prevalentement de la comunication avec le serveur et de l'utilisation de socket.
//dans ce js on utilisera aussi le framework jQuery
$(function(){
	//prende l'id a partir de l'url
	var id = Number(window.location.pathname.match(/\/([^/]*)$/)[1]);
	//je me connect au socket
	var socket = io();
	//variable utiliser dans le code, on les initialise ici pour etre sur qui il soit fait quand on les utilise
	var name = "",
		email = "",
		color = "",
		index="",
		board="",
		waitingGame=false,
		playing=false,
		isEnd=false,
		myTurn=false,
		maxGamer=2,
		active=false,
		gamers=[];
	//on cree aussi les variables qui utilisent jQuery pour rendre le code plus lisible 
	var yourName = $("#userName"),
		yourEmail = $("#userEmail"),
		loginForm = $(".loginForm"),
		logSec=$("#logSec"),
		secWait=$("#secWait"),
		secGame=$("#secGame"),
		numberPlayer=$('#playernum'),
		selectType=$("#matchType"),
		secTimer=$('#timerDiv'),
		timer=$('#timeTxt'),
		againBtn=$('#playAgain'),
		winnerName=$('#userWinnerName'),
		notAllow=$('#secNotAllow'),
		endForm=$('.overlay'),
		firstWait=$('#secWaitFirst');

	//fonctionne de base pour verifie si le client peut utiliser HTML 5 autrement le jeu ne marche pas.
	//on a utiliser non seulement le canvas qui appartienne a l'HTML5 mais aussi le localStorage qui nous permet de stocker de donne pour chaque fenetre 
	//ouverte sur l'application
	supports_html5_storage=function() {
	    try {
	        return 'localStorage' in window && window.localStorage !== null;
	    } catch (e) {
	        return false;
	    }
	}

	//les fonctionnes qui suivent s'occupent de gerer tout la partie d'affichage des differentes section car on a decide de implementer tout le jeu
	//dans une page unique et on a donc diffente secion qui montre le different partie 
	//login,wait,double session,game.
	//de plus on gerer aussi le timer 
	startWaiting=function(){
		//section waiting autres utilisateurs
		waitingGame=true;
		logSec.fadeOut(1200);
		secWait.fadeIn(1200);
	}
	stopWaiting=function(){
		//on commence a joue
		playing=true;
		waitingGame=false
		secWait.fadeOut(1200);
		secGame.fadeIn(1200);
	}
	showTimer=function(count){
		timer.text(count);
		//en changant la clas du timer on peut avoir le nombre affiche un peu plus grand par rapport à l'ecriture your turn
		secTimer.attr('class', 'timer');
		secTimer.fadeIn(200);
	}
	stopTimer=function(){
		//la fonctionne de jQuery "fadeOut" permet de cacher un element avec une jolie animation 
		secTimer.fadeOut(200);
		//on reset le timer local a zero
		timer.text('0');
	}
	notAllowDouble=function(){
		logSec.fadeOut();
		secGame.fadeOut();
		secWait.fadeOut();
		notAllow.fadeIn();
		active=true;
	}
	//controlle que l'utilissateur ne soit pas connecté avec deux different fenetre, maintenant est bloque sur chrome pour permettre le test
	checkOtherSessionActive=function(){
		if (supports_html5_storage())
			return (localStorage.getItem('active')!='false' && localStorage.getItem('id')==id);
		return false;
	}
	//Sachant si le client a deja joue on affiche le type et les donnes, si au contraire il a appuie sur un lien il ne peut pas changer le type du jeu
	//car il a ete invite en un jeu deja cree
	setNewGame=function(change,nUser,typeGame,username,mail){
		if (nUser){
			if (!change)
				numberPlayer.attr('disabled', 'disabled');
			numberPlayer.val(nUser);
		}
		if (typeGame){
			if (!change)
				selectType.attr('disabled', 'disabled');
			selectType.val(typeGame);
		}
		if (username){
			yourName.val(username);
			//yourName.attr('disabled', 'disabled');
		}
		if (mail){
			yourEmail.val(mail);
			//yourEmail.attr('disabled', 'disabled');
		}
		logSec.fadeIn(1200);
	}
	//controlle le donne et lance le signal
	login=function(username,userEmail,id,type,socket,maxGmr){
		if(username.length < 1){
			showMessage("error","Please enter a nick name longer than 1 character!",logSec);
			return;
		}
		if(!isValid(userEmail)) {
			showMessage("error","Please enter a valid email!",logSec);
			return
		}
		else {
			// call the server-side function 'login' and send user's parameters
			socket.emit('login', {user: username, email: userEmail,matchType:type,maxGamer:maxGmr, id: id});
		}
	}	//le jeu est fini il faut donc afficher un popUp qui indique qui a gagne
	endGame=function(winner,again,notShow){
		//button qui refresh la page
		againBtn.on('click',function(){
			location.replace('');
		});
		//on reset le donne enregister pendant le jeu
		localStorage.setItem('id',-1);
		localStorage.removeItem('color');
		localStorage.setItem('active',false);
		winnerName.html(winner);
		//popUp, le popUp est gere principalment grace au CSS et donc il est necessaire seulment de l'afficher
		if (!notShow)
			endForm.fadeToggle("fast");
	}
	//on regarde si le client a abbandone un match et si doit se reconnecte, si il y a un id enregiste alors il s'est deconnecte et peut se reconnecter
	//si il n'y a pas d'id ou il est egal a -1 alors il a deja joue donc on lui selectionnera deja les carateristique que il avait choisit la dernier 
	//fois. Si il n'y a rien on a un nouveau utilisateur
	checkOldPlayer=function(){
		if(supports_html5_storage())
			//il y a id qui se trouve aussi dans l'url, donc on veut se reconnecter
			if (localStorage.getItem('id')==id)
				return {
					id:localStorage.getItem('id'),
					color:localStorage.getItem('color'),
					index:localStorage.getItem('index'),
					type:localStorage.getItem('type'),
					username:localStorage.getItem('username'),
					email:localStorage.getItem('email'),
					maxGamer:localStorage.getItem('max')
				};
			//utilisateur qui a deja joue
			else if ((localStorage.getItem('id')==-1 || localStorage.getItem('id')!=id) && localStorage.getItem('username'))
				return {
					type:localStorage.getItem('type'),
					username:localStorage.getItem('username'),
					email:localStorage.getItem('email'),
					maxGamer:localStorage.getItem('max')
				};
		return;
	}
	//chaque fois que on fait le login on enregiste les donnes pour pouvoir ensuite le considerer comme un vieu player
	saveLogin=function(username,userEmail,id,type,maxGmr,index,color){
		if (!supports_html5_storage())
			return;
		localStorage.setItem('id',id);
		localStorage.setItem('username',username);
		localStorage.setItem('email',userEmail);
		localStorage.setItem('type',type);
		localStorage.setItem('max',maxGmr);
		localStorage.setItem('color',color);
		localStorage.setItem('index',index);
		localStorage.setItem('active',true);
	}
	//detecte le click, envoie un signal au serveur mais seulement si l'utilisateur a touche sur une ligne (on fait analiser le coordonnes pour la
	//partie game) 
	clickTouch=function(e){ 
		//prende le coordonnes du point clicke
        var coor = board.CANVAS.relMouseCoords(e);
        //si le jeu n'est pas fini et si c'est le turn du client 
        if (!board.isFinished && myTurn) {
            var result=board.move(coor);
            //un fois analyser si elles correspondent a une ligne on regarde combien de carre ont ete colore et si il y a un gagnat
            //on envoi ensuite un signal au serveur
            if (!result.moved)
            	return;
            updateScoreBoard(color,index);
            socket.emit('played', {
            	coor:coor,
            	color:color,
            	id:id,
            	index:index,
            	squareClicked:result.squareN
            });
            myTurn=false;
            //si il y a un gagnant on lance un signal pour finir le jeu
            var winner=board.checkWinner();
            if (winner)
            	socket.emit('gameEnd',{
            		id:id,
            		winnerColor:winner
            	});
		}
	}
	
	//on affiche le resultat dans la liste de joueurs sur la droite, ici aussi on utilise CSS et une nouvelle propriete cree au faire et au mesure
	updateScoreBoard=function(color,i){
		$('#badge'+i).attr('data-badge', board.getScore(color));
	}
	initScoreBoard=function(players){
		for(var i=0;i<players.length;i++){
			$('#badge'+(i+1)).fadeIn(1200);
			$('#badge'+(i+1)).attr('data-badge', 0);
			$('#name'+(i+1)).text(players[i].username);
		}
	}

	// on regarde si l'id existe 
	socket.on('connect', function(){
		if (waitingGame || playing || isEnd)
			return;
		//avant de fermer la page on lance l'event leaving pour comuniquer a tout le monde que on laisse le match REMARQUE: l'evenemment est appele 
		//aussi quand on refresh la page
		window.addEventListener("beforeunload", function (e) {
  			if (playing)
  				socket.emit("leaving",{
					id:id,
					color:color,
					index:index
				});
  			//on n'a plus de fenetre ouverte donc on doit modifier le paramenters enregistres
  			if (!active)
				localStorage.setItem('active',false);
		});
		//on control si il y a des autres fenetres ouvertes
		if (checkOtherSessionActive())
			return notAllowDouble();
		//on controle si il l'utilisateur s'est deja connecté
		var user=checkOldPlayer();
		//on controlle si il veut se reconnecte ou pas
		if (user)
			if (user.color)
				socket.emit('reconnected',user);
		//on attende une reponse du serveur pour savoir si l'id existe et on a ete invite ou si on peut choisir
		if ((user && !user.color) || !user){
			firstWait.show();
			socket.emit('load', id);
		}
		$('.sec').hide();
	});
	//le serveur nous donne le nombre d'utilisateurs qui sont active sur ce jeu, si il est plus grand que zero on ne peut pas choisir le
	//type de grille et le nombre de player
	socket.on('roomDetail',function(data){
		firstWait.hide();
		if (waitingGame)
			return;
		var usr=checkOldPlayer();
		if (data.number>0){
			if (usr && usr.username)
				setNewGame(false,data.nusers,data.type,usr.username,usr.email);
			else
				setNewGame(false,data.nusers,data.type);
			//pour chaque utilisateur on ajoute une boule qui tourne, comme cela on peut montrer combien de joueur sont en attent 
			for (var i=0;i<data.number;i++)
				$(".bokeh").append('<li></li>');
			//on affiche le nombre et le link si on veut inviter quelqun
			$("#numPlayerInfo").text(i);
			$("#linkGame").html(window.location.hostname+"/home/"+id);
			
		}
		else
			if (usr && usr.username)
				setNewGame(true,usr.maxGamer,usr.type,usr.username,usr.email);
			else
				setNewGame(true);
		//une fois que le form est complet on envoie le donnes au serveur
		loginForm.on('submit', function(e){
				e.preventDefault();
				e.preventDefault();
				name = $.trim(yourName.val());
				email = yourEmail.val();
				gameType=selectType.val();
				maxGamer=numberPlayer.val();
				login(name,email,id,gameType,socket,maxGamer);
				return false;
			});
	});
	//la fonctionne du timer sert non seulement pour le jeu mais aussi pour savior plus facilment si un joueur est connecte
	socket.on('timer',function(data){
		if (!myTurn && data.id==id)
			showTimer(data.second);
	})
	//une fois que le serveur nous accepte on enregistre les donnes et on attente les autres
	socket.on('loggedin', function(data){
		color = data.color;
		index=data.index;
		saveLogin(data.username,data.mail,id,data.type,data.max,index,color);
		waitingGame=true;
		id=data.id
		startWaiting();
	});
	//chaque fois que on quelqun se connect on ajoute une boule et on refresh l'interface pour comuniquer a l'utilisateur que un autre s'est connecte
	socket.on('peopleloggedin',function(data){
		gamers.push({name:data.username,color:data.color});
		if (gamers.length<=maxGamer){
			$(".bokeh").append('<li></li>');
			$("#numPlayerInfo").text(gamers.length);
			$("#linkGame").html(window.location.hostname+"/home/"+id);
		}
		if (waitingGame && gamers.length==maxGamer)
			showMessage("StartingGame",secWait);
	});
	//le match peu commencer
	socket.on('startGame', function(data){
		console.log(data);
		if(data.boolean && data.id == id) {
			// Initialize Game
			stopWaiting();
			//initialise le jeu et on affiche la grille
		    board = new Board("game", data.type, data.type,color);
		    board.draw();
		   	initScoreBoard(data.users);
		    //Add event listeners for click or touch
		    window.addEventListener("click", clickTouch, false);
		    window.addEventListener("touchstart", clickTouch, false);
		}
	});
	//un autre joueur a touche une ligne
	socket.on('moved',function(data){
		if (data.color!=color){
			//on ajoute les modification et on refresh le score
			board.move(data.coor,data.color);
			updateScoreBoard(data.color,data.index);
		}
	});
	//chaque fois on control si c'est le turn du client et si c'est le cas on change l'interface
	socket.on('turn',function(data){
		console.log(data);
		if(data.boolean && data.id == id && data.color==color) {
			myTurn=true;
			stopTimer();
			secTimer.fadeIn(500);
			timer.text('Your turn');
			secTimer.attr('class', 'notimer');
		}
		else
			showTimer();
	});
	socket.on('end',function(data){
		if (data.id==id)
			endGame(data.winner,data.again);
	});
	//quand un joueur se deconnecte on cache son nom de la liste
	socket.on('leave',function(data){
		$('#badge'+(data.index+1)).fadeOut();
	});

	// si on se reconnecte on initialise a nouvea et on execute touts les mouvement faits jusqu'a ce turn la.
	socket.on('resume',function(data){
		//badge
		//newgame
		stopWaiting();
		board = new Board("game", data.type, data.type,color);
		board.draw();
	   	initScoreBoard(data.players);
	    //Add event listeners for click or touch
	    window.addEventListener("click", clickTouch, false);
	    window.addEventListener("touchstart", clickTouch, false);
	    //on fait a nouveau les mouvements
		for (var i=0;i<data.clickedObject.length;i++){
			board.move(data.clickedObject[i].coor,data.clickedObject[i].color);
			updateScoreBoard(data.clickedObject[i].color,data.clickedObject[i].index);
		}
	});

	//quand un vieu joueur returne on affiche a nouveau son nom
	socket.on('gamerReconnected',function(data){
		$('#badge'+(data.index+1)).fadeIn();
	});
	//le jeu auquel on voulait se connecte n'existe plus
	socket.on('noMoreGame',function(data){
		endGame('','',true);
		location.replace('');
	});

});

//controle grace a un regrex si le donné mail est valide
function isValid(thatemail) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(thatemail);
}

//a implementer ensuit pour pouvoir afficher les error de login et des messages entre joueurs
function showMessage(status,data){
	return ;
}

