/**
 * loggedIn
 *
 * @description :: Middleware to check if user is authorized with JSON web token
 */

const User = require('../models/users');
const RestHelper = require('../helpers/rest-helper');
const JWT = require('../helpers/JWT');

function verifyJWToken (req, res, next) {
    var token;

    if (req.headers && req.headers.authorization) {
        // Pega o token do request header (Bearer {token})
        token = req.headers.authorization.split(' ')[1];
    } else {
        return RestHelper.sendJsonResponse(res, 401, {err: 'Authorization header not found.'});
    }

    JWT.verify(token, function (err, validToken) {
        // Se o token não for válido
        if (err) return RestHelper.sendJsonResponse(res, 401, {err: 'Invalid token.'});
        User.findOne({_id: validToken._id}, '', {lean: true}).then(function(user){
            if(user){
                req.user = user;
                next();
            } else {
                return RestHelper.sendJsonResponse(res, 401, {err: 'User no longer exists.'});
            }
        }).catch(function(err){
            return RestHelper.sendJsonResponse(res, 500, err);
        });
    });
}

module.exports = {
    verifyJWToken: verifyJWToken
};