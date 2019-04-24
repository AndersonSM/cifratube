/**
 * @author Anderson Menezes
 */

const bcrypt = require('bcryptjs');

exports.encryptPassword = async function (user) {
    return new Promise((resolve, reject) => {
        if (!user.password) return resolve(null);

        bcrypt.genSalt(10, function (err, salt) {
            if (err) return resolve(null);
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return resolve(null);
                user.password = hash;
                return resolve(user);
            })
        });
    });
};