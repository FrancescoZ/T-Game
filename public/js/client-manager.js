
$(function(){



	var id = Number(window.location.pathname.match(/\/([^/]*)$/)[1]);
	// connect to the socket
	var socket = io();
	// variables which hold the data for each person
	var name = "",
		email = "",
		color = "",
		board="",
		waitingGame=false,
		myTurn=false,
		maxGamer=2,
		gamers=[];

	var yourName = $("#userName"),
		yourEmail = $("#userEmail"),
		loginForm = $(".loginForm"),
		logSec=$("#logSec"),
		secWait=$("#secWait"),
		secGame=$("#secGame"),
		numberPlayer=$('#playernum'),
		selectType=$("#matchType");

	startWaiting=function(){
		logSec.hide();
		secWait.show('slow');
	}
	stopWaiting=function(){
		secWait.hide();
		secGame.show('slow');
	}
	showMessage=function(message,section){
	}
	clickTouch=function(e) {
		        var coor = board.CANVAS.relMouseCoords(e);
		        if (!board.isFinished && myTurn) {
		            var idClicked=board.move(coor);
		            socket.emit('played', {
		            	coor:coor,
		            	color:color,
		            	id:id
		            });
		            myTurn=false;
		            if (board.checkWinner())
		            	theWinnerIs();
		        }
	}
	newGame=function(nUser,typeGame){
		if (nUser){
			numberPlayer.attr('disabled', 'disabled');
			numberPlayer.val(nUser);
		}
		if (typeGame){
			selectType.attr('disabled', 'disabled');
			selectType.val(typeGame);
		}
		logSec.show( "slow");
	}
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
	}

	// on connection to server get the id of person's room
	socket.on('connect', function(){
		if (waitingGame)
			return;
		socket.emit('load', id);
		$('.sec').hide();
	});
	//get information about the room, if it's already open or not
	socket.on('roomDetail',function(data){
		if (waitingGame)
			return;
		console.log('roomDetail received');
		console.log(data);
		if (data.number===0)
			newGame();
		else{
			newGame(data.nusers,data.type);
			for (var i=0;i<data.number;i++)
				$(".bokeh").append('<li></li>');
			$("#numPlayerInfo").text(i);
			$("#linkGame").attr("http://localhost:8080/home/"+id);
		}
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
	socket.on('watchDog',function(){
		socket.emit('answers',{status:'connected'});
	})
	socket.on('loggedin', function(data){
		color = data;
		waitingGame=true;
		startWaiting();
	});
	socket.on('peopleingame', function(data){
		/*console.log("Received signal peopleingame");
		console.log(data);
		if(data.number > 0 && data.number<maxGamer){
			showMessage("login");
			loginForm.on('submit', function(e){
				e.preventDefault();
				name = $.trim(yourName.val());
				email = yourEmail.val();
				gameType=selectType.val();
				login(name,email,id,gameType,socket);
			});

		}
		else if(data.number===maxGamer) {
			showMessage("login");
			loginForm.on('submit', function(e){
				e.preventDefault();
				name = $.trim(yourName.val());
				email = yourEmail.val();
				gameType=selectType.val();
				login(name,email,id,gameType,socket);
				showMessage("AttentFinished");
			});
		}
		else {
			showMessage("tooManyPeople");
		}*/
	});
	socket.on('peopleloggedin',function(data){
		gamers.push({name:data.username,color:data.color});
		if (gamers.length<=maxGamer){
			$(".bokeh").append('<li></li>');
			$("#numPlayerInfo").text(gamers.length);
			$("#linkGame").attr("http://localhost:8080/home/"+id);
		}
		if (waitingGame && gamers.length==maxGamer)
			showMessage("StartingGame",secWait);
	});
	socket.on('startGame', function(data){
		console.log(data);
		if(data.boolean && data.id == id) {
			// Initialize Game
			stopWaiting();
		    board = new Board("game", data.type, data.type,color);
		    board.draw();
		    board.updateScoreBoard();
		    //Add event listeners for click or touch
		    window.addEventListener("click", clickTouch, false);
		    window.addEventListener("touchstart", clickTouch, false);
		}
	});
	socket.on('moved',function(data){
		if (data.color!=color)
			board.move(data.coor,data.color);
	})
	socket.on('turn',function(data){
		console.log(data);
		if(data.boolean && data.id == id && data.color==color) 
			myTurn=true;
	});
});

function theWinnerIs(){}

function scrollToBottom(){
	$("html, body").animate({ scrollTop: $(document).height()-$(window).height() },1000);
}

function isValid(thatemail) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(thatemail);
}

function showMessage(status,data){

	return ;
	if(status === "connected"){

		section.children().css('display', 'none');
		onConnect.fadeIn(1200);
	}

	else if(status === "inviteSomebody"){

		// Set the invite link content
		$("#link").text(window.location.href);

		onConnect.fadeOut(1200, function(){
			inviteSomebody.fadeIn(1200);
		});
	}

	else if(status === "personinchat"){

		onConnect.css("display", "none");
		personInside.fadeIn(1200);

		chatNickname.text(data.user);
		ownerImage.attr("src",data.avatar);
	}

	else if(status === "youStartedChatWithNoMessages") {

		left.fadeOut(1200, function() {
			inviteSomebody.fadeOut(1200,function(){
				noMessages.fadeIn(1200);
				footer.fadeIn(1200);
			});
		});

		friend = data.users[1];
		noMessagesImage.attr("src",data.avatars[1]);
	}

	else if(status === "heStartedChatWithNoMessages") {

		personInside.fadeOut(1200,function(){
			noMessages.fadeIn(1200);
			footer.fadeIn(1200);
		});

		friend = data.users[0];
		noMessagesImage.attr("src",data.avatars[0]);
	}

	else if(status === "chatStarted"){

		section.children().css('display','none');
		chatScreen.css('display','block');
	}

	else if(status === "somebodyLeft"){

		leftImage.attr("src",data.avatar);
		leftNickname.text(data.user);

		section.children().css('display','none');
		footer.css('display', 'none');
		left.fadeIn(1200);
	}

	else if(status === "tooManyPeople") {

		section.children().css('display', 'none');
		tooManyPeople.fadeIn(1200);
	}
}

