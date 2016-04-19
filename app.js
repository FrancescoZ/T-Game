//pour pouvoir lancer l'application il faut appeler ce ficher
//on utilise le module express et socketIO (voir le rapport pour connaitre les raisons)
var express = require('express'),
	app = express();

//pour pouvoir lancer l'app sur un serveur inligne
var port = process.env.app_port || 8080;

//initialisation du module socketIO
var io = require('socket.io').listen(app.listen(port));

// Le configuration et les autre gestion du server
require('./config')(app, io);
//l'engine qui gere la connetion au socket
require('./server')(app, io);

console.log('Your application is running');