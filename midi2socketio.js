var midi = require('midi');

var input = new midi.input();

//input.getPortCount();
//input.getPortName(0);

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(4126);

function handler (req, res) {
	fs.readFile(__dirname + '/map.html',
		function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}

			res.writeHead(200);
			res.end(data);
		});
}
/*
var server = http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<html><head></head><body><p>testtest</p></body></html>');
	res.end();
});
server.listen(4126);

var io = socket.listen(server);
*/
var state, value;
var MSB=0, LSB=[];
var x=0, y=0, z=0;
input.on('message', function(deltaTime, message) {
	// ノブをいじった信号
	if(message[0]==176 && message[1]==99){
		if(message[2]==0){ // knob X
			state = 'X';
		}
		if(message[2]==2){ // knob Y
			state = 'Y';
		}
		if(message[2]==4){ // knob Z
			state = 'Z';
		}
	}
	// MSBがきましたよ
	else if(message[0]==176 && message[1]==6){
		MSB = message[2]; // MSBを保存(必ずこのあとにLSBが来る)
	}
	// LSBがきましたよ
	else if(message[0]==176 && message[1]==38){
		LSB = message[2];
		switch(state){
			case 'X':
				var temp = MSB*128 + LSB;
				/*if(temp > (3*128 + 127)){
					temp = 3*128 + 127;
				}
				value = Math.round(temp / (3*128 + 127) * 127)*2;
				*/
				value = (temp-500)/5000;
				break;
			case 'Y':
				//value = Math.round(LSB / 100 * 127)*2;
				if(MSB){
					value = LSB - 28;
				} else {
					value = 100 + LSB;
				}
				value = (value-200)/1000;
				break;
			case 'Z':
				//value = Math.round(LSB / 100 * 127)*2;
				value = LSB/100*20;
				break;
			default:
				break;
		}
		io.sockets.emit('message', { state: state, value: value });
	} else {
		// なにもしない
	}

	//console.log('m:' + message + ' d:' + deltaTime);
}); 

input.openPort(0);

