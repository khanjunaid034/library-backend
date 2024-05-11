const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.route('/')
.post(authController.protect, authController.restrictTo('librarian', 'admin'), authController.createUser)
.get(authController.protect, authController.restrictTo('librarian', 'admin'), userController.getUsers)

router.route('/deleteUser')
.post(authController.protect, authController.restrictTo('librarian', 'admin'), userController.deleteUser);

router.route('/login')
.post(authController.login);

router.route('/updatePassword')
.patch(authController.protect, userController.updatePassword);

module.exports = router;