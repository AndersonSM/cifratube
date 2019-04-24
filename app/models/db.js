/**
 * @author Anderson Menezes
 */

const mongoose = require('mongoose');
const constants = require('../helpers/constants');

mongoose.connect(constants.database);

// Listen for Mongoose connection events and output statuses to console
mongoose.connection.on('connected', function () {
    console.log('Mongoose connected to ' + constants.database);
});

mongoose.connection.on('error', function (err) {
    console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose disconnected');
});


const gracefulShutdown = function (msg, callback) {
    mongoose.connection.close(function () {
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};

// Listen for SIGUSR2, which is what nodemon uses
process.once('SIGURS2', function () {
    gracefulShutdown('nodemon restart', function () {
        process.kill(process.pid, 'SIGURS2');
    });
});

//Listen for SIGINT emitted on application termination
process.on('SIGINT', function () {
    gracefulShutdown('app termination', function () {
        process.exit(0);
    });
});

// Listen for SIGTERM emitted when Heroku shuts down process
// TODO: search for a more generic process to listen
// author: Ruan Eloy - date: 01/11/17
process.on('SIGTERM', function () {
    gracefulShutdown('Heroku app shutdown', function () {
        process.exit(0);
    });
});

// Models
require('./users');
require('./songs');