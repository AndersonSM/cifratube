/**
 * @author Anderson Menezes
 */

const User = require('../models/users');
const RestHelper = require('../helpers/rest-helper');
const PasswordHelper = require('../helpers/password-helper');

async function registerUser(req, res) {
    var user = req.body;

    if (!user.password || user.password.trim().length < 6 || !user.email) {
        RestHelper.sendJsonResponse(res, 400, {message: 'Invalid user body.'});
        return;
    }

    user = await PasswordHelper.encryptPassword(req.body);
    if (user) {
        create(user);
    } else {
        RestHelper.sendJsonResponse(res, 500, {message: 'Error while encrypting password.'});
    }

    function create(user) {
        User.create(user).then(function (user) {
            RestHelper.sendJsonResponse(res, 200, user);
        }).catch(function (err) {
            RestHelper.sendJsonResponse(res, 500, err);
        })
    }
}

async function updateUser(req, res) {
    var userId = req.params.id;

    if (req.user._id.toString() !== userId) {
        RestHelper.sendErrorResponse(res, 403, 'Unauthorized.')
        return;
    }

    if (req.body.password) {
        var user = await PasswordHelper.encryptPassword(req.body);
        if (user) {
            update(user);
        } else {
            RestHelper.sendJsonResponse(res, 500, {message: 'Error while encrypting password.'});
        }
    } else {
        update(req.body);
    }

    function update(user) {
        User.update({_id: userId}, {$set : user}).then(function (user) {
            RestHelper.sendJsonResponse(res, 200, user);
        }).catch(function (err) {
            RestHelper.sendJsonResponse(res, 500, err);
        })
    }
}

module.exports = {
    registerUser : registerUser,
    updateUser : updateUser,
};
