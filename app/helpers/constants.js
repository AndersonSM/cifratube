/**
 * @author Anderson Menezes
 */

module.exports = {
    // TODO: change prd url
    'database': process.env.environment === 'production' ? 'prd url' :
        'mongodb://localhost:27017/tcc'
};

