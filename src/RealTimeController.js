/**
 * @module RealTimeController
 * @see
 * ![alt text](./UML/RealTimeController.svg "Funcionamento")
 *
 */

/** JQuery */
global.$ = $;
/** @external  browser-serialport */
var browserserialport = require('browser-serialport');
var SerialPort = browserserialport.SerialPort;
var Plataforma = require('./Data.js');

/**  @member {SerialPort}  Plataforma*/
var calc = new Plataforma(184.5, 167);

/**  @member {calc}  port*/
var port;

/**  @member {string}  port*/
var acc = '';

/**  @member {2dContext}  ctx*/
var ctx = $('#canvas')[0].getContext('2d');

/**  @member {boolean}  isConnected*/
var isConnected = false;



////////////////////////////////
/// UI
///////////////////////////////

function btConnecting() {
	console.log('Conectando...');
	$('#label').switchClass('yellow green red', 'blue');
	$('#status').switchClass('yellow green red', 'blue');
	$('#labeltxt').text('Conectando');
	$('#statustxt').text('...');
	$('#bt').addClass('disabled');
}

function btDisconnected() {
	console.log('desconectado!');
	$('#label').switchClass('blue green red', 'yellow');
	$('#status').switchClass('blue green red', 'yellow');
	$('#labeltxt').text('Conectar');
	$('#statustxt').text('desconectado');
	$('#bt').removeClass('disabled');
	isConnected = false;
}

function btConnected(freq) {
	if (isConnected === false) {
		$('#label').switchClass('blue yellow red', 'green');
		$('#status').switchClass('blue yellow red', 'green');
		$('#labeltxt').text('Conectado');
		$('#bt').addClass('disabled');
		isConnected = true;
	}
	$('#statustxt').text(freq);
}

function btERR(err) {
	console.log('ERRO! ' + err);
	$('#label').switchClass('blue yellow green', 'red');
	$('#status').switchClass('blue yellow green', 'red');
	$('#labeltxt').text('Reset');
	$('#statustxt').text(err);
	$('#bt').removeClass('disabled');
	isConnected = false;
}

/**
 * Plota um ponto na tela representando uma leitura do COP
 * @arg {Number} tgx - Coordenada X do COP
 * @arg {Number} tgy - Coordenada Y do COP
 * @returns {null}
 */
function update(tgx, tgy) {
	// fade effect
	ctx.globalAlpha = 0.05;
	ctx.fillStyle = '#f4f4f4';
	ctx.fillRect(0, 0, 738, 668);
	ctx.globalAlpha = 1;
	ctx.fillStyle = '#000000';
	ctx.beginPath();
	ctx.arc((tgx + calc.a) * 2, (tgy + calc.b) * 2, 4, 0, Math.PI * 2);
	ctx.fill();
}

/**
 * Coleta dados emitidos pela plataforma
 * @param {char[]} dados - stream de dados em utf8
 */
function coleta(dados) {
	acc += dados.toString('utf8');
	var linhas = acc.split('#');
	acc = linhas.pop();
	linhas.forEach(function(part) {
		var result = calc.RTCOP(part);
		btConnected(Math.floor(1 / (result.t / 1000)) + ' Hz');
		update(result.x, result.y);
	});
}

/**
 * Connecta com a plataforma
 * @param {string} name - come da porta serial em que a Plataforma se encontra
 */
function connect(name) {

	port = new SerialPort(name, {
		baudrate: 57600
	}, false);
	port.open(function(error) {
		if (error) {
			btERR(error);
		} else {
			port.on('data', function(data) {
				coleta(data);
				//console.log('data received: ' + data);
			});
			port.on('close', function(data) {
				port = null;
				btDisconnected();
			});
			port.on('err', function(data) {
				btERR(data);
			});
		}
	});
}

/**
 * Reseta, e procura pela plataforma
 */
function findPlat() {
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
}

$('#bt').click(findPlat);
$(window).unload(function() {
	port.close();
});
