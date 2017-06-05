'use strict';

const NUMBER_OF_LEDS = 32;

var strip = require('rpi-ws281x-native');
strip.init(NUMBER_OF_LEDS);
strip.setBrightness(25); // A value between 0 and 255

var Protocol = require('azure-iot-device-amqp').Amqp;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;

//leds physical setup is 4 rows, 8 columns each. Array holds RGB color of each led.
var leds = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
];

//There is a slight chance to have two processes trying to deal with leds - one from message and one from idle animation. That's probably uncool.
var animationInProgress= false;

//array with same size as leds, to be used for randomizing
var ids = Array.from({
    length: 32
}, (x, i) => i++);

//randomize ids
var random_indexes = shuffle(ids);

//render startup pattern
var checker = Array.from({
    length: 32
}, (x, i) => {return i%2===0? Math.floor(Math.random() * 0xffffff) : 0});
strip.render(checker);

const connectionString =process.env.RPZW_IOTHUB_CONNECTION_STRING;

var client = Client.fromConnectionString(connectionString, Protocol);

var connectCallback = function (err) {
    if (err) {
        leds.fill(0, 0, 15);
        leds.fill(0xff0000, 16, 31);
        strip.render(leds);
        console.error('Could not connect: ' + err.message);
    } else {
        console.log('Client connected');

        client.on('message', function (msg) {
            console.log('Id: ' + msg.messageId + ' Body: ' + msg.getData().toString('utf-8'));
            animationInProgress= true;
            var messageData = msg.getData().toString('utf-8');

            //reset leds by setting color to 0 (i.e. off)
            leds.fill(0);
            strip.render(leds);

            var i = 0;
            
            random_indexes = shuffle(ids);

            var timer = setInterval(function () {
                leds[random_indexes[i]] = getColorForStatus(messageData);
                strip.render(leds);

                if (i === NUMBER_OF_LEDS) {
                    client.complete(msg, printResultFor('completed'));
                    animationInProgress =false;
                    clearInterval(timer);
                }

                i = i + 1;
            }, 10);
        });

        client.on('error', function (err) {
            leds.fill(0, 0, 23);
            leds.fill(0xff0000, 24, 31);
            strip.render(leds);
            console.error(err.message);
        });

        client.on('disconnect', function () {
            client.removeAllListeners();
            client.open(connectCallback);
        });
    }
};

client.open(connectCallback);
console.log('started');

//idle animation
var idleAnimation = setInterval(function () {
                if (!animationInProgress) {
                    leds.fill(0);
                    leds[Math.floor(Math.random() * 31)] = Math.floor(Math.random() * 0xffffff);
                    strip.render(leds);
                }
            }, 10000);



// Helper function to print results in the console
function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

//randomize array
function shuffle(array) {
    let currentIndex = array.length,
        temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

//simple mapping between status and led color
function getColorForStatus(status) {
    status = status.toLowerCase();
    
    var color = 0xffff00;

    if (status === 'start') {
        color = Math.floor(Math.random() * 0xffffff);
    } else if (status === 'success') {
        color = 0x00ff00;
    } else if (status === 'fail') {
        color = 0xff0000
    }

    return color;
}