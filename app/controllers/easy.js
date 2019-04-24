/**
 * @author Anderson Menezes
 */

const RestHelper = require('../helpers/rest-helper');

function register(req, res) {
    var table = req.params.table;
    if (table === 'teacher' || table === 'student' || table === 'aux_admin') {
        var objModel = require(`../models/roles/${table}`);
    } else {
        var objModel = require(`../models/${table}`);
    }
    var newObj = req.body;

    objModel.create(newObj).then(function (obj) {
        RestHelper.sendJsonResponse(res, 200, obj);
    }).catch(function (err) {
        RestHelper.sendJsonResponse(res, 400, err);
    });
}

function getAll(req, res) {
    var table = req.params.table;
    if (table === 'teacher' || table === 'student' || table === 'aux_admin') {
        var objModel = require(`../models/roles/${table}`);
    } else {
        var objModel = require(`../models/${table}`);
    }

    objModel.find({}).then(function (objs) {
        RestHelper.sendJsonResponse(res, 200, objs);
    }).catch(function (err) {
        RestHelper.sendJsonResponse(res, 400, err);
    });
}

function query(req, res) {
    var table = req.params.table;
    var query = req.body;
    if (table === 'teacher' || table === 'student' || table === 'aux_admin') {
        var objModel = require(`../models/roles/${table}`);
    } else {
        var objModel = require(`../models/${table}`);
    }

    objModel.find(query).then(function (objs) {
        RestHelper.sendJsonResponse(res, 200, objs);
    }).catch(function (err) {
        RestHelper.sendJsonResponse(res, 400, err);
    });
}

function findOne(req, res) {
    var table = req.params.table;
    var id = req.params.id;
    if (table === 'teacher' || table === 'student' || table === 'aux_admin') {
        var objModel = require(`../models/roles/${table}`);
    } else {
        var objModel = require(`../models/${table}`);
    }

    objModel.findOne({_id: id}).then(function (obj) {
        RestHelper.sendJsonResponse(res, 200, obj);
    }).catch(function (err) {
        RestHelper.sendJsonResponse(res, 400, err);
    });
}

function update(req, res) {
    var table = req.params.table;
    var id = req.params.id;
    if (table === 'teacher' || table === 'student' || table === 'aux_admin') {
        var objModel = require(`../models/roles/${table}`);
    } else {
        var objModel = require(`../models/${table}`);
    }
    var updateObj = req.body;

    objModel.update({_id : id}, {$set : updateObj}, {multi : false}).then(function (updated) {
        RestHelper.sendJsonResponse(res, 200, updated);
    }).catch(function (err) {
        RestHelper.sendJsonResponse(res, 400, err);
    });
}

function remove(req, res) {
    var table = req.params.table;
    var id = req.params.id;
    if (table === 'teacher' || table === 'student' || table === 'aux_admin') {
        var objModel = require(`../models/roles/${table}`);
    } else {
        var objModel = require(`../models/${table}`);
    }

    objModel.deleteOne({_id: id}).then(function (result) {
        RestHelper.sendJsonResponse(res, 200, result);
    }).catch(function (err) {
        RestHelper.sendJsonResponse(res, 400, err);
    });
}

module.exports = {
    register : register,
    getAll: getAll,
    update: update,
    findOne: findOne,
    remove : remove,
    query: query
};