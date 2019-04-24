const Songs = require('../models/songs');
const RestHelper = require('../helpers/rest-helper');

async function getLatestSongs(req, res) {
    var songs = await Songs.find({}).sort({createdDate: -1}).limit(25).exec();
    if (songs)
        RestHelper.sendJsonResponse(res, 200, songs);
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get songs.");
}

async function getSongById(req, res) {
    var songs = await Songs.findOne({_id: req.params.id});
    if (songs) {
        RestHelper.sendJsonResponse(res, 200, songs);
        songs.views++;
        songs.save();
    }
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get songs.");
}

async function getSongsByUser(req, res) {
    var songs = await Songs.find({userId: req.params.id});
    if (songs)
        RestHelper.sendJsonResponse(res, 200, songs);
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get songs.");
}

async function createSong(req, res) {
    var songs = new Songs(req.body);

    if (songs._id || songs.id) {
        RestHelper.sendErrorResponse(res, 400, "Can't create new songs with id.");
        return;
    }

    songs.createdDate = new Date();
    songs.userId = req.user._id;
    try {
        songs = await songs.save();
    } catch (err) {
        RestHelper.sendErrorResponse(res, 500, err.stack);
        return;
    }
    RestHelper.sendJsonResponse(res, 200, songs);
}

async function updateSong(req, res) {
    var songs = await Songs.findOne({_id: req.params.id});
    if (!songs) {
        RestHelper.sendErrorResponse(res, 400, 'Song not found.');
        return;
    }

    if (songs.authorId !== req.user._id.toString()) {
        RestHelper.sendErrorResponse(res, 403, 'Unauthorized.');
        return;
    }

    try {
        songs = await songs.save();
    } catch (err) {
        RestHelper.sendErrorResponse(res, 500, err.stack);
    }
    RestHelper.sendJsonResponse(res, 200, songs);
}

module.exports = {
    getLatestSongs: getLatestSongs,
    getSongById: getSongById,
    getSongsByUser: getSongsByUser,
    createSong: createSong,
    updateSong: updateSong
};