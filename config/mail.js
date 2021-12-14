//Sending otp for forgot password authentication

require('dotenv').config();
const nodemailer = require('nodemailer');
function sendEmail(to, otp){
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hutp431@gmail.com',
            pass: 'Hutp431@123'
        }
    });

    let str1 = 'your otp :';
    let str2 = otp;
    str1 += str2;
    str1 += '\notp valid till 2 mins';
    let mailOptions = {
        from: 'hutp431@gmail.com',
        to: to,
        subject: 'Reset Password',
        text: str1
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendEmail;





















// var app_root = __dirname,
//     path = require('path'),
//     fs = require('fs'),
//     _ = require('lodash'),
//     templatesDir = path.resolve(app_root, '..', 'email_templates'),
//     htmlToText   = require('html-to-text'),
//     cheerio = require('cheerio');
// //Sendgrid
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_KEY);
// //Export
// module.exports = {
//     sendOneMail: function(templateName, content, cb){
//         //Interpolate UnderscoreJS settings provided by Lodash to behave like Handlebar templates
//         _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
//         //Read template file
//         fs.readFile(templatesDir + '/' + templateName + '.html', {encoding: 'utf8'}, function (err, fileContent) {
//             if (err) return cb(err);
//             var compiled = _.template(fileContent);
//             var htmlContent = compiled({resetUrl: content.resetUrl, pageUrl: content.pageUrl, email: content.email, fromName: content.fromName, title: content.title, summary: content.summary, firstName: content.firstName, comment: content.comment, redirectURL: content.redirectURL}),
//                 textContent;
//             //Remove img and footer. Get a plain text version of email.
//             $ = cheerio.load(htmlContent);
//             $('img, .footer').remove();
//             textContent = htmlToText.fromString($.html(), {
//                 tables: ['#textContent']
//             });
//             //Setup e-mail data with unicode symbols
//             var mailOptions = {
//                 from: 'FramerSpace <no-reply@framerspace.com>', // sender address
//                 to: content.email, // list of receivers
//                 subject: content.subject, // Subject line
//                 text: textContent, // plaintext body
//                 html: htmlContent // html body
//             };
//             //Send mail
//             sgMail.send(mailOptions, function(error, responseStatus){
//                 if(error){
//                     return cb(error);
//                 } else {
//                     return cb(null, responseStatus);
//                 }
//             });
//         });
//     }
// };
