const { isJWT } = require('validator');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');


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
        const user = await User.create(req.body);
        createSendToken(user, 201, req, res);
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