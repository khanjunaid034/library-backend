const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.route('/')
.post(authController.createUser)
.get(authController.protect, authController.restrictTo('librarian', 'admin'), userController.getUsers);

router.route('/login')
.post(authController.login);

module.exports = router;