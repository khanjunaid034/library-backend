const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'powermasteraws@gmail.com',
        pass: 'wjvagylaexhgkncl'
    }
})


module.exports = transporter;