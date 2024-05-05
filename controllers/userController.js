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

exports.updatePassword = async (req, res, next) => {
    console.log(req)
    if(!req.body.currentPassword || !req.body.newPassword || !req.body.confirmNewPassword) {
        return next(new AppError('Current password, new password and confirm new password are mandatory to be supplied!', 400));
    }

    try {
        const user = await User.findById({_id: req.user._id}).select('+password');
        
        if(!await user.checkPassword(req.body.currentPassword, user.password)) {
            return next(new AppError('Current password is incorrect!', 400));
        }

        if( req.body.newPassword !== req.body.confirmNewPassword ) {
            return next(new AppError('New password and confirm new password do not match!', 400));
        }

        // Update the password in database
        user.password = req.body.newPassword;
        await user.save();

        res.status(200).json({
            status:'success',
            message:'Password updated!'
        })
    } catch(err) {
        console.log(err);
    }
}