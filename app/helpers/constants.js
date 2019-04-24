/**
 * @author Anderson Menezes
 */

module.exports = {
    'database': process.env.ENVIRONMENT === 'production' ? process.env.DB_CONNECTION_STRING :
        'mongodb://localhost:27017/tcc'
};

