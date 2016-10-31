/**
 * @module ReportController
 * @see
 * ![alt text](./UML/ReportController.svg "Funcionamento")
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

/**  @member {boolean}  recording, se o controlador esta gravando os dados*/
var recording = false;

/**  @member {boolean}  isConnected*/
var isConnected = false;

/**  @member {boolean}  result*/
var result;


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

function btConnected() {
	if (isConnected === false) {
		$('#connect').switchClass('active', 'completed');
		$('#stepduracao').switchClass('disabled', 'active');
		$('#tempoSelect').show();
		$('#statustxt').text('Conectado');
		$('#label').switchClass('blue yellow red', 'green');
		$('#status').switchClass('blue yellow red', 'green');
		$('#labeltxt').text('Conectado');
		$('#bt').addClass('disabled');
		isConnected = true;
	}
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
 * Usado por drawGraph.
 * Plota um ponto persitente no grafico
 * @arg {Number} tgx - Coordenada X do COP
 * @arg {Number} tgy - Coordenada Y do COP
 * @returns {null}
 */
function addPoint(tgx, tgy) {
	ctx.globalAlpha = 1;
	ctx.fillStyle = '#000000';
	ctx.beginPath();
	ctx.arc((tgx + calc.a) * 2, (tgy + calc.b) * 2, 4, 0, Math.PI * 2);
	ctx.fill();
}

/**
 * Plota um gráfico a partir de vetores x e y
 * @arg {Number[]} vetX - Vetor de Coordenadas X do COP
 * @arg {Number[]} vetY - Vetor de Coordenadas Y do COP
 * @returns {null}
 */
function drawGraph(vetX, vetY) {
	for (var i = 0; i < vetX.length; i++) {
		addPoint(vetX[i], vetY[i]);
	}
}

/**
 * Coleta dados emitidos pela plataforma e os adiciona em Data
 * @param {char[]} dados - stream de dados em utf8
 */
function coleta(dados) {
	btConnected();
	acc += dados.toString('utf8');
	var linhas = acc.split('#');
	acc = linhas.pop();
	linhas.forEach(function(part) {
		if (recording) {
			$('#data').text(part);
			calc.pushData(part);
		}
	});
}

/**
 * Connecta com a plataforma e registra eventos
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
	port = null;
	btConnecting();
	var found = false;
	browserserialport.list(function(err, ports) {
		var counter = 0;
		ports.forEach(function(port) {
			counter++;
			if (port.manufacturer.indexOf('Arduino') !== -1 && !found) {
				connect(port.comName);
				found = true;
			}
			if (counter === ports.length && !found) {
				btERR('Porta não encontrada!');
			}
		});
	});
}

$(window).unload(function() {
	port.close();
});

/**
 * Atuactualiza e valida input do temporizador.
 */
function ACTUpdateTime() {
	if ($('#tempo').val() >= 1) {
		$('#play').switchClass('disabled', 'green');
	} else {
		$('#play').switchClass('green', 'disabled');
	}
}

/**
 * Converte e arredonda números de mm para cm
 * @arg {Number} num - numero a ser tratado
 */
function convertNum(num, digit) {
	if (!digit) {
		digit = 10;
	}
	return Math.round(num * 10) / (10 * digit);
}

/**
 * Gera relatório
 */
function genReport() {
	$('#stepexec').switchClass('active', 'completed');
	$('#steprelatorio').switchClass('disabled', 'active');
	$('#tempoSelect').hide();
	$('#execute').hide();
	$('#relatorio').show();
	$('#dot').text(convertNum(calc.DOT) + ' cm');
	$('#desAP').text('Ântero-posterior: ' + convertNum(calc.DevAP) + ' cm');
	$('#desML').text('Médio-lateral: ' + convertNum(calc.DevML) + ' cm');
	$('#rmsAP').text('Ântero-posterior: ' + convertNum(calc.rmsAP) + ' cm');
	$('#rmsML').text('Médio-lateral: ' + convertNum(calc.rmsML) + ' cm');
	$('#freq').text(convertNum(calc.avgFrq, 1) + 'Hz');
	$('#velAP').text('Ântero-posterior: ' + convertNum(calc.VMap) + ' cm/s');
	$('#velML').text('Médio-lateral: ' + convertNum(calc.VMml) + ' cm/s');
	$('#veltot').text(convertNum(calc.VMT) + ' cm/s');
	$('#ampAP').text('Ântero-posterior: ' + convertNum(calc.ampAP) + ' cm');
	$('#ampML').text('Médio-lateral: ' + convertNum(calc.ampML) + ' cm');
	$('#area').text(convertNum(calc.area, 100) + ' cm²');
}

/**
 * Processa dados colhidos pela plataforma
 */
function processData() {
	result = calc.fullReport(); //JSON.stringify(, null, 2);
	drawGraph(result.CPx, result.CPy);
	genReport();
}

/**
 * Inicia a leitura e gravação dos dados
 * @arg {Number} temp - tempo de leitura
 */
function startReading(temp) {
	recording = true;
	var timer = null;
	var count = temp;
	var doStep = function() {
		if (count > 0) {
			clearInterval(timer);
			timer = setTimeout(callback, 1000);
			$('#progress').progress('increment');
		} else {
			console.log('ACABOU! ' + count);
			$('#status').html('Gerando relatório');
			recording = false;
			processData();
			genReport();
		}
	};
	var callback = function() {
		$('#status').html('Medindo');
		console.log(count + ' of ' + temp);
		clearInterval(timer);
		timer = null;
		count--;
		doStep();
	};
	doStep();
}

function ACTPlay() {
	$('#stepduracao').switchClass('active', 'completed');
	$('#stepexec').switchClass('disabled', 'active');
	$('#tempoSelect').hide();
	$('#execute').show();
	$('#progress')
		.progress({
			total: $('#tempo').val()
		});
	startReading($('#tempo').val());
}

$('#bt').click(findPlat);
$('#play').click(ACTPlay);
$('#tempo').on('input', ACTUpdateTime);
