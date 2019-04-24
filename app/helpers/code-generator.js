/**
 * @author Anderson Menezes
 */

module.exports = function (length) {
    var code = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        code += possible.charAt(Math.floor(Math.random() * possible.length));

    return code;
};
