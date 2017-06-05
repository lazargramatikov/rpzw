'use strict';

var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

var connectionString = process.env.RPZW_IOTHUB_CONNECTION_STRING;
var targetDevice = process.env.RPZW_TARGET_DEVICE;

var client = Client.fromConnectionString(connectionString);
var data = "{}";

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log(req.body);

    if (req.query.status || (req.body && req.body.status)) {
        client.open(function (err) {
            if (err) {
                context.log('Could not connect: ' + err.message);
            } else {
                context.log('Client connected');

                data = JSON.stringify({
                    status: 'success'
                });

                var message = new Message(data);
                context.log('Sending message: ' + message.getData());
                client.send(targetDevice, message, printResultFor('send'));
            }
        });

        context.res = {
            status: 200 /* Defaults to 200 */
        };
    } else {
        context.res = {
            status: 400,
            body: "Please pass status on the query string or in the request body"
        };
    }
    context.done();
};

function printResultFor(op) {
    return function printResult(err, res) {
        if (err) {
            console.log(op + ' error: ' + err.toString());
        } else {
            console.log(op + ' status: ' + res.constructor.name);
        }
    };
}