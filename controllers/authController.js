const transporter = require('./../utils/sendEmail');
const { isJWT } = require('validator');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');


async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: 'LMS Admin <name>',
        to: email,
        subject: 'Your password reset OTP',
        text: `Dear User,\n\nYou password reset OTP is ${otp}, valid for 15 minutes.\n\nThank you!`
    }

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.log(err);
    }
}

function generateOTP() {
    return crypto.randomBytes(3).toString('hex'); // Generates a 6-character OTP
}

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    res.cookie('jwt', token);
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.createUser = async (req, res, next) => {
    try {
        if (!req.body.email || !req.body.password || !req.body.confirmPassword || !req.body.name || !req.body.role) {
            return next(new AppError('Please fill in all the details!', 400));
        }

        if ((req.body.role === 'librarian' || req.body.role === 'admin') && req.user.role !== 'admin') {
            return next(new AppError('Only an admin can create new admin or librarian accounts!', 403));
        }

        const user = await User.create({ email: req.body.email, name: req.body.name, password: req.body.password, confirmPassword: req.body.confirmPassword, role: req.body.role });
        res.status(201).json({
            status: 'success',
            user
        })
    }
    catch (err) {
        console.log(err)
        next(err);
    }
}

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('Email or password not supplied!', 400));
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.checkPassword(password, user.password))) {
            return next(new AppError('Incorrect Email or Password!', 401));
        }

        createSendToken(user, 200, req, res);

    } catch (err) {
        next(`error: ${err.message}`);
    }
}

exports.protect = async (req, res, next) => {
    // check if token is supplied

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in, please login!', 401));
    }

    // verify the token
    let decoded
    try {
        decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
        return next(new AppError('Issue with token, please sign in again!', 400));
    }

    // check is user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exists', 404));
    }

    req.user = currentUser;
    next();
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!(roles.includes(req.user.role))) {
            return next(new AppError('You are not authorized to perform this action!', 401))
        }
        next();
    }
}

// function to send password reset OTP
exports.getOTP = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('User not found!', 404));
        }

        user.otp = generateOTP();
        user.otpExpiration = Date.now() + 15 * 60 * 1000;
        await user.save();
        await sendOTPEmail(user.email, user.otp);

        res.status(200).json({
            status: 'success',
            message: 'OTP sent via e-mail'
        })

    } catch (err) {
        next(err);
    }
}


// function to use the OTP and reset the password

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, password, confirmPassword, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('User not found!', 404));
        }

        if (user.otp !== otp || Date.now() > user.otpExpiration) {
            return next(new AppError('Invalid or expired OTP!', 400));
        }

        user.password = password;
        user.confirmPassword = confirmPassword;
        user.otp = undefined;
        user.otpExpiration = undefined;

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password reset successful!'
        })

    } catch (err) {
        next(err);
    }
}