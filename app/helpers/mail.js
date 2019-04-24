/**
 * @author Anderson Menezes
 */

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'escolandoapp@gmail.com',
        pass: 'escolando123'
    }
});

exports.send = function (destination, subject, message) {
    var mailOptions = {
        from: 'escolandoapp@gmail.com',
        to: destination,
        subject: subject,
        html: message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};