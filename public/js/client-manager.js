
import * from gamer


$(function(){



	var id = Number(window.location.pathname.match(/\/([^/]*)$/)[1]);
	// connect to the socket
	var socket = io();
	// variables which hold the data for each person
	var name = "",
		email = "",
		color = "",
		board="",
		myTurn=false;
		gamers=[];

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
		if(data.number === 0){
			showMessage("login");
			loginForm.on('submit', function(e){
				e.preventDefault();
				name = $.trim(yourName.val());
				email = yourEmail.val();
				login(name,email,id,"waitingSomeone");
			});
		}
		else if(data.number >= 1) {
			showMessage("personinchat",data);
			loginForm.on('submit', function(e){
				e.preventDefault();
				name = $.trim(yourName.val());
				email = yourEmail.val();
				login(name,email,id);

			});
		}
		else {
			showMessage("tooManyPeople");
		}
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
function login(username,userEmail,id,message){
	if(username.length < 1){
		showMessage("error","Please enter a nick name longer than 1 character!");
		return;
	}
	if(!isValid(userEmail)) {
		showMessage("error","Please enter a valid email!");
	}
	else {
		showMessage(message);
		// call the server-side function 'login' and send user's parameters
		socket.emit('login', {user: name, email: email, id: id});
	}

}
