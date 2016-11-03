/** JQuery */
global.$ = $; //sinto cheiro de gambiarra o.O

/** @external  browser-serialport */
var browserserialport = require('browser-serialport');
var SerialPort = browserserialport.SerialPort;

/** @module Connection */

function Connection() {

}

function reset() {

}

function getState() {

}

function connect(){

}

function disconnect() {

}

/*function findPlat() {
	console.log('batata1 findPlat()');
	port = null;
	btConnecting();
	var found = false;
	browserserialport.list(function(err, ports) {
		var counter = 0;
		console.log('batata list');
		ports.forEach(function(port) {
			counter++;
			console.log('batata c++ forEach');
			if (port.manufacturer.indexOf('Arduino') !== -1 && !found) {
				console.log('batata achou e con' + port.comName);
				connect(port.comName);
				console.log(port.comName);
				found = true;
			}
			if (counter === ports.length && !found) {
				btERR('Porta não encontrada!');
			}
		});
	});
}*/

