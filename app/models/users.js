/**
 * @author Anderson Menezes
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        select: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    createdDate: {
        type: Date,
        required: true,
        default: new Date()
    }
}, { collection: 'user',
    toObject: {
        transform: function (doc, ret) {
            delete ret.id;
            delete ret.password;
        },
        getters: true
    }
});

userSchema.methods.comparePassword = function (password, next) {
    var user = this;
    bcrypt.compare(password, user.password, function(err, match){
        if(err) {
            next(err);
            return;
        }

        if(match){
            next(null, true);
        } else {
            next(err);
        }
    });
};

module.exports = mongoose.model("User", userSchema);
