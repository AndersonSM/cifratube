/**
 * @author Anderson Menezes
 */

const express = require('express');

const rootRouter = express.Router();
const users = require('./routes/users');
const easy = require('./routes/easy');
const auth = require('./routes/auth');
const songs = require('./routes/songs');

rootRouter.use('/users', users);
rootRouter.use('/easy', easy);
rootRouter.use('/', auth);
rootRouter.use('/', songs);

module.exports = rootRouter;
