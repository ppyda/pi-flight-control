"use scrict";

const Gpio = require('pigpio').Gpio;
const ws = require('ws');
const express = require('express');

const app = express();

app.use(express.static(__dirname)); //Serves resources from ui folder  

function ServoSG90 (oGpio, iAngleRange) {
    this._oGpio = oGpio;
    this.iAngleRange = 45;
    this.iNeutralAngleOffset = 0;
    this.iMinimumAngle = -1 * iAngleRange;
    this.iMaximumAngle =  1 * iAngleRange;
    this.MINIMUM_PWM = 500;
    this.MAXIMUM_PWM = 2500;
    this.NEUTRAL_PWM = 1500;
}

ServoSG90.prototype._convertAngleToPwm = function(iAngle) {
    let iPwm = Math.round(this.MINIMUM_PWM + (this.MAXIMUM_PWM - this.MINIMUM_PWM) * (iAngle + this.iAngleRange) / (this.iMaximumAngle - this.iMinimumAngle));
    //console.log('angle pwm:' + iPwm);
    return iPwm;
}

ServoSG90.prototype.setAngle = function (iAngle, self) {
    //iAngle = iAngle + this.iNeutralAngleOffset;
    let iAngleRanged = iAngle * self.iAngleRange;
    iAngle = Math.min(iAngle, self.MAXIUMUM_ANGLE);
    iAngle = Math.max(iAngle, self.MINIMUM_ANGLE);
    
    console.log('ANGLE: ' + iAngle);

    //this._oGpio.servoWrite(this._convertAngleToPwm(iAngle));
}

/*class ServoSG90 {

    MINIMUM_PWM = 500;
    MAXIMUM_PWM = 2500;
    NEUTRAL_PWM = 1500;

    constructor (oGpio, iAngleRange) {
        this._oGpio = oGpio;
        this.iAngleRange = iAngleRange;
        this.iNeutralAngleOffset = 0;
        this.iMinimumAngle = -1 * iAngleRange;
        this.iMaximumAngle =  1 * iAngleRange;
    }

    get getNeutralAngleOffset() {
        return this.iNeutralAngleOffset;
    }

    set setNeutralAngleOffset(iOffset) {
        iOffset = Math.min(iOffset, 15);
        iOffset = Math.max(iOffset, -15);
        this.iNeutralAngleOffset = iOffset;
    }

    _convertAngleToPwm = function(iAngle) {
        let iPwm = Math.round(this.MINIMUM_PWM + (this.MAXIMUM_PWM - this.MINIMUM_PWM) * (iAngle + this.iAngleRange) / (this.iMaximumAngle - this.iMinimumAngle));
        //console.log('angle pwm:' + iPwm);
        return iPwm;
    }

    setAngle = (iAngle) => {
        iAngle = iAngle + this.iNeutralAngleOffset;
        iAngle = Math.min(iAngle, this.MAXIUMUM_ANGLE);
        iAngle = Math.max(iAngle, this.MINIMUM_ANGLE);
        
        console.log('ANGLE: ' + iAngle);

        //this._oGpio.servoWrite(this._convertAngleToPwm(iAngle));
    }
}

/**
 * DJI 2312A
 */
class Motor {

    MINIMUM_PWM_TROTTLE = 700;
    MAXIMUM_PWM_TROTTLE = 2000;

    constructor (oGpio) {
        this._oGpio = oGpio;
    }

    calibrateESC = () => {
        console.log('Plug out the battery...');
        setTimeout(() => console.log('Starting ESC calibration...'), 900);

        // Max throttle 
        //setTimeout(() => this._oGpio.servoWrite(2000), 1000);
        setTimeout(() => console.log('Plug in the battery now.'), 1010);

        // Min throttle 
        //setTimeout(() => this._oGpio.servoWrite(700), 4000);

        // Stop throttle 
        //setTimeout(() => this._oGpio.servoWrite(0), 7000);

        // Stop throttle 
        //setTimeout(() => this._oGpio.servoWrite(700), 10000);

        // Max throttle 
        // setTimeout(() => this._oGpio.servoWrite(2000), 11000);
        //setTimeout(() => console.log('ESC armed'), 11000);
 
        //this._oGpio.servoWrite(iThrottle);
    }

    setSpeed = (iSpeed) => {
        let iThrottle = iSpeed;
        iThrottle = Math.min(iSpeed, 1.0);
        iThrottle = Math.max(iSpeed, 0.0);

        iThrottle = Math.round(this.MINIMUM_PWM_TROTTLE + (this.MAXIMUM_PWM_TROTTLE - this.MINIMUM_PWM_TROTTLE) * iThrottle );
        
        console.log('THROTTLE: ' + iThrottle);

        //this._oGpio.servoWrite(iThrottle);
    }
}

const GPIO_OPTIONS = {mode: Gpio.OUTPUT};

let oLeftWingElevatorServo = new ServoSG90(new Gpio(22, GPIO_OPTIONS), 20);
let oRightWingElevatorServo = new ServoSG90(new Gpio(23, GPIO_OPTIONS), 20);
let oStabilisatorElevatorServo = new ServoSG90(new Gpio(24, GPIO_OPTIONS), 40);
//let oAirBrakeServo = new ServoSG90(new Gpio(4, GPIO_OPTIONS));

let oMotorCW = new Motor(new Gpio(17, GPIO_OPTIONS));
let oMotorCCW = new Motor(new Gpio(18, GPIO_OPTIONS))






// headless websocket server that prints any messages that come in.
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
    socket.on('message', (message, isBinary) => {
        let payload = isBinary ? message : message.toString();
        let input = JSON.parse(payload);

        console.log(input);

        if (input.key === 'p') {
            socket.send('P received');
            //setAngle(-90);
            
        }
        
        if (input.key === 'o') {
            socket.send('O received');
            //setAngle(0);
        }
        
        if (input.key === 'i') {
            socket.send('i received');
            //setAngle(90);
        }

        if (input.axis === 0) {
            oLeftWingElevatorServo.setAngle(parseFloat(input.value), oLeftWingElevatorServo);
            oRightWingElevatorServo.setAngle(parseFloat(input.value), oRightWingElevatorServo);
        }

        if (input.axis === 1) {
            oStabilisatorElevatorServo.setAngle(parseFloat(input.value));
        }

        if (input.axis === 6) {
            oMotorCW.setSpeed( 1 - parseFloat(input.value));
            oMotorCCW.setSpeed( 1 - parseFloat(input.value));
        }

    });
});

// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(3000, 'raspberrypi.fritz.box', () => {
    console.log('Server is up.')
});
server.on('upgrade', (request, socket, head) => {
    console.log('WS connection is up.')
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});  