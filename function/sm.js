'use strict';

var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

var connectionString = process.env.RPZW_IOTHUB_CONNECTION_STRING;
var targetDevice = process.env.RPZW_TARGET_DEVICE;

var client = Client.fromConnectionString(connectionString);
var data = "{}";

client.open(function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Client connected');

    data = JSON.stringify({
      status: 'success'
    });

    var message = new Message(data);
    console.log('Sending message: ' + message.getData());
    client.send(targetDevice, message, printResultFor('send'));
  }
});

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    } else {
      console.log(op + ' status: ' + res.constructor.name);
    }
  };
}