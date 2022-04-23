var piblaster = require('pi-blaster.js');
const ws = require('ws');
const express = require('express');

const app = express();

app.use(express.static(__dirname)); //Serves resources from ui folder  

var motor_pwm_pin = 17;
var pwm_motor_init = 0.16;                           // neutral position
var pwm_motor_min = pwm_motor_init / 2;              // max backward capacity
var pwm_motor_max = pwm_motor_init + pwm_motor_min;  // max forward capacity

var pwm_motor_off = 0.0;
var pwm_motor_min_limit = 0.1; // move backward slower than possible
var pwm_motor_max_limit = 0.2; // move forward slower than possible

var speed = 0;                                   // neutral position
var default_speed_step_width = 1;
var speed_num_steps = 20;
var speed_min = (-1) * speed_num_steps / 2;      // max steps backward
var speed_max = speed_num_steps / 2;             // max steps forward

function speed2pwm(s) { 
    pwm = pwm_motor_min + ((pwm_motor_max - pwm_motor_min) * ((s + speed_max) / speed_num_steps));

    pwm = Math.min(pwm, pwm_motor_max_limit);
    pwm = Math.max(pwm, pwm_motor_min_limit);

    console.log('speed pwm: ' + pwm);
    return pwm;
}

var servo_pwm_pin = 4;
var pwm_servo_min = 0.05;
//var pwm_servo_neutral = 0.1;
var pwm_servo_max = 0.15;

var angle = 0;
//var default_angle_step_width = 15;
var angle_min = -90;
var angle_max = 90;

function angle2pwm(a) {
    pwm = pwm_servo_min + (pwm_servo_max - pwm_servo_min) * (a + 45) / 90;
    
    console.log('angle pwm:' + pwm);
    return pwm;
}

function turnAngleByDegree(step_width) {
    setAngle(angle + step_width)
}

function setAngle(new_angle) {
    angle = new_angle;
    angle = Math.min(angle, angle_max);
    angle = Math.max(angle, angle_min);
    
    console.log('move angle: ' + angle);

    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
}

// headless websocket server that prints any messages that come in.
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
    socket.on('message', (message, isBinary) => {
        let payload = isBinary ? message : message.toString();
        let input = JSON.parse(payload);

        console.log(input);

        // if (input.key === 'P') {
        //     socket.send('P received');
        //     setAngle(-45);
        // }
        
        // if (input.key === 'O') {
        //     socket.send('O received');
        //     setAngle(45);
        // }
        
        // if (input.key === 'I') {
        //     socket.send('I received');
        //     setAngle(0);
        // }

        if (input.axis === 0) {
            setAngle(input.value * 90);
        }

    });
});

// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(3000, '127.0.0.1', () => {
    console.log('Server is up.')
});
server.on('upgrade', (request, socket, head) => {
    console.log('WS connection is up.')
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});  

/*
// Main POST control

app.post('/start', function (req, res) {
    start();
    res.end();
});

app.post('/stop', function (req, res) {
    stop();
    res.end();
});

app.post('/forward', function (req, res) {
    changeVelocityByStep(default_speed_step_width)
    res.end();
});

app.post('/backward', function (req, res) {
    changeVelocityByStep((-1) * default_speed_step_width)
    res.end();
});

app.post('/left', function (req, res) {
    turnAngleByDegree((-1) * default_angle_step_width);
    res.end();
});

app.post('/right', function (req, res) {
    turnAngleByDegree(default_angle_step_width);
    res.end();
});

function start() {
    console.log('start');

    speed = 0;
    piblaster.setPwm(motor_pwm_pin, pwm_motor_init);
}

function stop() {
    console.log('stop');
    
    speed = 0;
    piblaster.setPwm(motor_pwm_pin, pwm_motor_off);
    
    angle = 0;
    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
}

function changeVelocityByStep(step_width) {
    setSpeed(speed + step_width);
}

function setSpeed(new_speed) {
    var prev_speed = speed;
    speed = new_speed;
    speed = Math.min(speed, speed_max);
    speed = Math.max(speed, speed_min);

    console.log('set speed: ' + speed);

    piblaster.setPwm(motor_pwm_pin, speed2pwm(speed));

    // Double-click procedure for moving backward.
    // Can also be done manually, depending on your preference and need
    if (prev_speed >= 0 && new_speed < 0) {
        runDoubleClickProcedure();
    }
}

async function runDoubleClickProcedure() {
    console.log('Run double-click procedure automatically');
    await sleep(200);
    piblaster.setPwm(motor_pwm_pin, speed2pwm(0));
    await sleep(200);
    piblaster.setPwm(motor_pwm_pin, speed2pwm(speed));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function turnAngleByDegree(step_width) {
    setAngle(angle + step_width)
}

function setAngle(new_angle) {
    angle = new_angle;
    angle = Math.min(angle, angle_max);
    angle = Math.max(angle, angle_min);
    
    console.log('move angle: ' + angle);

    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
}

// User hits Ctrl+C
process.on('SIGINT', function() {
    stop();
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    
    return process.exit();
});

var normalized_min = -1;
var normalized_max = 1;
var ws_port=3002;
var user_id;
const ws = require("ws");
const wss = new ws.Server({
    server: server,
    port: ws_port
});

wss.on("connection", function (ws) {

    console.log("Websocket connection opened");

    var timestamp = new Date().getTime();
    user_id = timestamp;

    ws.send(JSON.stringify({msgType:"onOpenConnection", msg:{ connectionId: user_id }}));

    ws.on("message", function (data, flags) {
        var client_message = data.toString() + "";
        console.log("Websocket received a message: " + client_message + " (" + typeof(client_message) + ")");

        if (!(client_message === 'undefined')) {
            if (client_message.indexOf("start") == 0) {
                start();
            }
            else if (client_message.indexOf("stop") == 0) {
                stop();
            }
            else if (client_message.indexOf("angle:") == 0) {
                var angle_str = client_message.split(":")[1].trim();
                console.log("normalized angle: " + angle_str);
                normalized_angle = parseFloat(angle_str);
                if(isNormalizationCorrect(normalized_angle)) {
                    var angle = denormalize(normalized_angle, angle_min, angle_max);
                    setAngle(angle);
                }
            } 
            else if (client_message.indexOf("speed:") == 0){
                var speed_str = client_message.split(":")[1].trim();
                console.log("normalized speed: " + speed_str);
                normalized_speed = parseFloat(speed_str);
                if(isNormalizationCorrect(normalized_speed)) {
                    var speed = denormalize(normalized_speed, angle_min, angle_max);
                    setSpeed(speed)
                }
            }
        }

        ws.send(JSON.stringify({ msg:{ connectionId: user_id } }));
    });

    ws.on("close", function () {
        console.log("Websocket connection closing");
        stop();
    });
});
console.log("Websocket server created");

function denormalize(normalized, min, max) {
    return (normalized * ((Math.abs(max) + Math.abs(min)) / 2));
}

function isNormalizationCorrect(normalized_value) {
    if (normalized_value >= normalized_min && normalized_value <= normalized_max) {
        return true;
    }

    return false;
}
*/
