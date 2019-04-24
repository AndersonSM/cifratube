/**
 * AuthController
 *
 * Autenticação de usuário
 * return: User e token de autenticação
 *
 */

const User = require('../models/users');
const RestHelper = require('../helpers/rest-helper');
const JWT = require('../helpers/JWT');

function login (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var rememberMe = req.body.rememberMe;

    if (!email || !password) {
        return RestHelper.sendJsonResponse(res, 400, {err: 'Login and password are necessary'});
    }

    User.findOne({email: email}, )
        .select('+password')
        .then(function (user) {
            if (!user) {
                return RestHelper.sendJsonResponse(res, 401, {err: 'Invalid email or password.'});
            }

            user.comparePassword(password, function (err, valid) {
                if (err) {
                    return RestHelper.sendJsonResponse(res, 500, err);
                }
                if (!valid) {
                    return RestHelper.sendJsonResponse(res, 401, {err: 'Invalid email or password.'});
                } else {
                    var userObj = user.toObject();
                    var token = JWT.issue(userObj, rememberMe);
                    RestHelper.sendJsonResponse(res, 200, { user: userObj, token: token });
                }
            });
        })
        .catch(function (err) {
            RestHelper.sendJsonResponse(res, 500, err);
        });
}

function getAccount (req, res) {
    return RestHelper.sendJsonResponse(res, 200, req.user);
}

module.exports = {
    login: login,
    getAccount: getAccount
};