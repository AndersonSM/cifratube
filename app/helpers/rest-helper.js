/**
 * @author Anderson Menezes
 */

exports.sendJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

exports.sendErrorResponse = function (res, status, message) {
    res.status(status);
    res.json({err: message, code: status});
};