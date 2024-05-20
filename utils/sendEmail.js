const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');

const envPath = path.resolve(__dirname, './../config.env');
dotenv.config({path: envPath});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'powermasteraws@gmail.com',
        pass: process.env.GMAIL_PASSWORD,
    }
})


module.exports = transporter;