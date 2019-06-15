const Songs = require('../models/songs');
const RestHelper = require('../helpers/rest-helper');

async function getLatestSongs(req, res) {
    if (req.query.search) return getSongsByTitleOrArtist(req, res);

    var songs = await Songs.find({}).populate('author').sort({createdDate: -1}).limit(25).exec();
    if (songs)
        RestHelper.sendJsonResponse(res, 200, songs);
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get songs.");
}

async function getSongById(req, res) {
    var song = await Songs.findOne({_id: req.params.id}).populate('author').exec();
    if (song) {
        RestHelper.sendJsonResponse(res, 200, song);
        song.views++;
        song.save();
    }
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get song.");
}

async function getSongsByUser(req, res) {
    var songs = await Songs.find({userId: req.params.id}).populate('author').exec();
    if (songs)
        RestHelper.sendJsonResponse(res, 200, songs);
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get songs.");
}

async function getSongsByTitleOrArtist(req, res) {
    var songs = await Songs.find(
        {$or:
            [
                {title: new RegExp(req.query.search, 'i')},
                {artist: new RegExp(req.query.search, 'i')}
            ]
        }).populate('author').exec();
    if (songs)
        RestHelper.sendJsonResponse(res, 200, songs);
    else
        RestHelper.sendErrorResponse(res, 500, "Couldn't get songs.");
}

async function createSong(req, res) {
    if (req.body._id || req.body.id) {
        RestHelper.sendErrorResponse(res, 400, "Can't create new song with id.");
        return;
    }

    var song = new Songs(req.body);

    song.createdDate = new Date();
    song.userId = req.user._id;
    try {
        song = await song.save();
        song.populate('author', function (err) {
            RestHelper.sendJsonResponse(res, 200, song);
        });
    } catch (err) {
        RestHelper.sendErrorResponse(res, 500, err.stack);
    }
}

async function updateSong(req, res) {
    var song = new Songs(req.body);
    song.isNew = false;
    if (!req.params.id || !song || !song._id || req.params.id !== song._id.toString()) {
        RestHelper.sendErrorResponse(res, 400, 'Invalid data.');
        return;
    }

    if (song.author._id.toString() !== req.user._id.toString()) {
        RestHelper.sendErrorResponse(res, 403, 'Unauthorized.');
        return;
    }

    delete song.views;
    try {
        song = await song.save();
        song.populate('author', function (err) {
            RestHelper.sendJsonResponse(res, 200, song);
        });
    } catch (err) {
        RestHelper.sendErrorResponse(res, 500, err.stack);
    }
}

module.exports = {
    getLatestSongs: getLatestSongs,
    getSongById: getSongById,
    getSongsByUser: getSongsByUser,
    createSong: createSong,
    updateSong: updateSong
};