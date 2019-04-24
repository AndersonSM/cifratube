/**
 * @author Anderson Menezes
 */
var express = require('express');
var usersRouter = express.Router();
var usersController = require('../../controllers/users');
var loggedInMW = require('../../middlewares/loggedIn');

usersRouter.post('/register', usersController.registerUser);
usersRouter.put('/:id', loggedInMW.verifyJWToken, usersController.updateUser);

module.exports = usersRouter;
