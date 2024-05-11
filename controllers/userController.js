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
    } catch (err) {
        next(err);
    }
}

exports.updatePassword = async (req, res, next) => {
    console.log(req)
    if (!req.body.currentPassword || !req.body.newPassword || !req.body.confirmNewPassword) {
        return next(new AppError('Current password, new password and confirm new password are mandatory to be supplied!', 400));
    }

    try {
        const user = await User.findById({ _id: req.user._id }).select('+password');

        if (!await user.checkPassword(req.body.currentPassword, user.password)) {
            return next(new AppError('Current password is incorrect!', 400));
        }

        if (req.body.newPassword !== req.body.confirmNewPassword) {
            return next(new AppError('New password and confirm new password do not match!', 400));
        }

        // Update the password in database
        user.password = req.body.newPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated!'
        })
    } catch (err) {
        console.log(err);
    }
}

exports.deleteUser = async (req, res, next) => {
    if (!req.body.userEmail) {
        return next(new AppError('Please supply the email of user to be deleted!', 400));
    }

    // FIND THE USER IN DATABASE
    const userToDelete = await User.findOne({ email: req.body.userEmail });
    if (!userToDelete) {
        return next(new AppError('User does not exist!', 400));
    }

    // CHECK IF NON ADMIN USER IS DELETING A LIBRARIAN OR ADMIN
    if( (userToDelete.role === 'admin' || userToDelete.role === 'librarian') && req.user.role !== 'admin') {
        return next(new AppError('Only an admin can delete an admin or a librarian account!', 403));
    }

    // CHECK IF USER IS DELETING ITSELF
    if( userToDelete.email === req.user.email ) {
        return next(new AppError('You cannot delete your account yourself!', 403));
    }

    // CHECK IF BOOKS ARE ASSIGNED TO USER
    if(userToDelete.assignedBooks.length != 0) {
        return next(new AppError('User can only be deleted if he/she has no assigned books!', 400));
    }

    await User.findOneAndDelete( { email: userToDelete.email } );
    res.status(200).json({
        status: 'success',
        message: 'User deleted!'
    })

}