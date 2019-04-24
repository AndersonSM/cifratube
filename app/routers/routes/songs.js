var express = require('express');
var songsRouter = express.Router();
var songsController = require('../../controllers/songs');
var loggedInMW = require('../../middlewares/loggedIn');

songsRouter.get('/songs', songsController.getLatestSongs);
songsRouter.get('/songs/:id', songsController.getSongById);
songsRouter.get('/users/:id/songs', songsController.getSongsByUser);
songsRouter.post('/songs', loggedInMW.verifyJWToken, songsController.createSong);
songsRouter.put('/songs/:id', loggedInMW.verifyJWToken, songsController.updateSong);

module.exports = songsRouter;