// This file handles the configuration of the app.
// It is required by app.js

var express = require('express');
var path = require ('path');

module.exports = function(app, io){

	// l'extension de default
	app.set('view engine', 'html');

	// pour distribuir de fiche different au html css et js
	app.engine('html', require('ejs').renderFile);

	// Dit à express ou trouver les pages
	app.set('views', __dirname + '/views');

	//Touts qui est dans le dossier public est avaiable par tout le monde
	app.use(express.static(path.join(__dirname + '/public')));


};
