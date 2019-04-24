/**
 * @author Anderson Menezes
 */
var express = require('express');
var authRouter = express.Router();
var authController = require('../../controllers/auth');
var loggedInMW = require('../../middlewares/loggedIn');

authRouter.post('/login', authController.login);

authRouter.get('/account', loggedInMW.verifyJWToken);
authRouter.get('/account', authController.getAccount);

module.exports = authRouter;
