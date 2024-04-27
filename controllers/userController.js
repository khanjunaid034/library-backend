const mongoose = require('mongoose');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError')



exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: "success",
            data: {
                users
            }
        })
    } catch(err) {
        next(err);
    }
}