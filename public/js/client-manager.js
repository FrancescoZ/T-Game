
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
		selectType=$("#matchType");

	clickTouch=function(e) {
		        var coor = board.CANVAS.relMouseCoords(e);
		        if (!board.isFinished && myTurn) {
		            var idClicked=board.move(coor);
		            socket.emit('move', idClicked);
		            myTurn=false;
		            if (board.checkWinner())
		            	theWinnerIs();
		        }
		    }

	// on connection to server get the id of person's room
	socket.on('connect', function(){
		socket.emit('load', id);
	});
	socket.on('color', function(data){
		color = data;
	});
	socket.on('peopleingame', function(data){
		console.log("Received signal peopleingame");
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
		}
	});
	socket.on('peopleloggedin',function(data){
		gamers.push({name:data.username,color:data.color});
		if (gamers.length<=maxGamer){
			$(".bokeh ul").append('<li></li>');
			$("#numPlayerInfo").val(gamers.length);
		}
		if (waitingGame && gamers.length==maxGamer)
			showMessage("StartingGame");
	});
	socket.on('startGame', function(data){
		console.log(data);
		if(data.boolean && data.id == id) {
			// Initialize Game
		    board = new Board("game", data.row, data.col,color),
		    board.draw();
		    board.updateScoreBoard();
		    //Add event listeners for click or touch
		    window.addEventListener("click", clickTouch, false);
		    window.addEventListener("touchstart", clickTouch, false);
		}
	});
	socket.on('yourTurn',function(data){
		console.log(data);
		if(data.boolean && data.id == id) 
			myTurn=true;
	});
	socket.on('enemyTurn',function(data){
		if(data.boolean && data.id == id){
			board.move(data.coordinates,data.color);
			if (board.checkWinner())
				theWinnerIs();	
		}
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
function login(username,userEmail,id,type,socket){
	if(username.length < 1){
		showMessage("error","Please enter a nick name longer than 1 character!");
		return;
	}
	if(!isValid(userEmail)) {
		showMessage("error","Please enter a valid email!");
		return
	}
	else {
		// call the server-side function 'login' and send user's parameters
		socket.emit('login', {user: username, email: userEmail,matchType:type, id: id});
		showMessage('WaitingForAnswer');
	}
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

