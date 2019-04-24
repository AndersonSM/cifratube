/**
 * @author Anderson Menezes
 */


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const songsSchema = Schema({
    markers: {
        type: Schema.Types.Mixed
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: Schema.Types.String,
        required: true
    },
    artist: {
        type: Schema.Types.String,
        required: true
    },
    videoTitle: {
        type: Schema.Types.String,
        required: true
    },
    videoUrl: {
        type: Schema.Types.String,
        required: true
    },
    videoId: {
        type: Schema.Types.String,
        required: true
    },
    createdDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    views: {
        type: Schema.Types.Number,
        default: 0
    },
}, {collection : 'songs'});

module.exports = mongoose.model("Songs", songsSchema);