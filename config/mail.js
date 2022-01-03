const nodemailer = require('nodemailer');
require('dotenv').config();
module.exports ={

        mailer:function (email, otp){
            console.log('mailer', email, otp)
            // console.log('email', process.env.USER_EMAIL);
            // console.log('password', process.env.USER_PASSWORD)
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                port: 587,
                secure: true,
                auth: {
                    user: 'pizzademoapp@gmail.com',
                    pass: 'pizzademoapp@123'
                }
            });
            
            var mailOptions = {
                from: 'pizzademoapp@gmail.com',
                to: email,
                subject: 'One Time Password',
                text: 'This One Time Password is valid for 5 minutes :'+otp
            };

            transporter.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log('error')
                    console.log(error);
                }else{
                    console.log(response);
                }
            });
    }


}