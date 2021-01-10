var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    piblaster = require('pi-blaster.js'),
    ip = require("ip");

app.use(express.static(__dirname + '/'));
app.set('view engine', 'html');

var app_port=8082;
app.get('/', function(req, res) {
    res.render(__dirname + '/index.html', {localip:ip.address()});
});
app.listen(app_port);

console.log('Web server listening, visit http://' + ip.address() + ':' + app_port);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main POST control

var motor_pwm_pin = 17;
var pwm_motor_init = 0.16;                           // neutral position
var pwm_motor_min = pwm_motor_init / 2;              // max backward capacity
var pwm_motor_max = pwm_motor_init + pwm_motor_min;  // max forward capacity

var pwm_motor_off = 0.0;
var pwm_motor_min_limit = 0.1; // move backward slower than possible
var pwm_motor_max_limit = 0.2; // move forward slower than possible

function speed2pwm(s) { 
    pwm = pwm_motor_min + ((pwm_motor_max-pwm_motor_min) * ((s+speed_max) / speed_num_steps));
    console.log('pwm calc: ' + pwm);

    pwm = Math.min(pwm, pwm_motor_max_limit);
    pwm = Math.max(pwm, pwm_motor_min_limit);

    console.log('pwm: ' + pwm);

    return pwm;
}

var speed = 0;                               // neutral position
var speed_step_width = 1;
var speed_num_steps = 20;
var speed_min = (-1) * speed_num_steps/2;      // max steps backward
var speed_max = speed_num_steps/2;             // max steps forward

async function runDoubleClickProcedure() {
    console.log('Run double-click procedure automatically');
    await sleep(200);
    piblaster.setPwm(motor_pwm_pin, speed2pwm(0));
    await sleep(200);
    piblaster.setPwm(motor_pwm_pin, speed2pwm(speed));
}

app.post('/backward', function (req, res) {
    var prev_speed = speed;
    speed = speed-speed_step_width;
    
    speed = Math.min(speed, speed_max);
    speed = Math.max(speed, speed_min);

    console.log('press backward: ' + speed);
    
    piblaster.setPwm(motor_pwm_pin, speed2pwm(speed));

    // Double-click procedure.
    // Can also be done manually, depending on your preference and need
    if (prev_speed == 0) {
      runDoubleClickProcedure();
    }

    res.end();
});

app.post('/forward', function (req, res) {
    speed = speed + speed_step_width;

    speed = Math.min(speed, speed_max);
    speed = Math.max(speed, speed_min);

    console.log('press forward: ' + speed);

    piblaster.setPwm(motor_pwm_pin, speed2pwm(speed));
    res.end();
});

var servo_pwm_pin = 18;
var pwm_servo_min = 0.05;
var pwm_servo_neutral = 0.1;
var pwm_servo_max = 0.15;

var angle_max = 45;
var angle_min = -45;

function angle2pwm(a) {
    pwm = pwm_servo_min + (pwm_servo_max-pwm_servo_min) * (a+45) / 90;
    //console.log('set pwm:' + pwm);
    return pwm;
}

var angle = 0;
var angle_step_width = 15;
app.post('/right', function (req, res) {
    angle = angle+angle_step_width;

    angle = Math.min(angle, angle_max);
    angle = Math.max(angle, angle_min);
    
    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
    console.log('press right: ' + angle);
    res.end();
});

app.post('/left', function (req, res) {
    angle = angle - angle_step_width;

    angle = Math.min(angle, angle_max);
    angle = Math.max(angle, angle_min);
    
    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
    console.log('press left: '+ angle);
    res.end();
});

app.post('/start', function (req, res) {
    speed = 0;
    console.log('start');
    piblaster.setPwm(motor_pwm_pin, pwm_motor_init);
    res.end();
});

app.post('/stop', function (req, res) {
    console.log('stop');
    
    speed = 0;
    piblaster.setPwm(motor_pwm_pin, pwm_motor_off);
    
    angle = 0;
    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
    res.end();
});

// If we lose comms, set the servos to neutral
function emergencyStop() {
    speed = 0;
    piblaster.setPwm(motor_pwm_pin, pwm_motor_off);
    
    angle = 0;
    piblaster.setPwm(servo_pwm_pin, angle2pwm(angle));
    
    console.log('### EMERGENCY STOP - signal lost or shutting down');
}

// User hits Ctrl+C
process.on('SIGINT', function() {
    emergencyStop();
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    
    return process.exit();
});
