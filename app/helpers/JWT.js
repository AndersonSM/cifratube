/**
 * jwToken
 *
 * @author Anderson Menezes
 * @description :: JSON Webtoken Service
 */

var jwt = require('jsonwebtoken'),
    tokenSecret = 'cifratubetcc';

// Gera um token a partir do payload
function issue (payload, rememberMe) {
    return jwt.sign(
        payload,
        tokenSecret, // Token secret usado pra assinar do lado do server
        // options
        {
            expiresIn: rememberMe ? '365d' : '1d' // Tempo para o token expirar
        }
    );
}

// Verifica o token no request
function verify (token, callback) {
    return jwt.verify(
        token, // O token a ser verificado
        tokenSecret, // Mesmo token usado pra assinar
        {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
        callback //Repassa erros pro callback ou o token decodificado
    );
}

module.exports = {
    issue: issue,
    verify: verify
};