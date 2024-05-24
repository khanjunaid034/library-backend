const multer = require('multer');
const fs = require('fs');
const express = require('express');
const authController = require('./../controllers/authController');
const bookController = require('./../controllers/bookController');

const router = express.Router();

const upload = multer({dest: 'uploads/'})

router.route('/')
.post(authController.protect, authController.restrictTo('librarian', 'admin'), upload.single('file'), bookController.addBook)
.get(bookController.allBooks)

router.route('/paginatedBooks')
.get(bookController.paginatedBooks)

router.route('/assign')
.patch(authController.protect, authController.restrictTo('librarian', 'admin'), bookController.assignBook)

router.route('/return')
.patch(authController.protect, authController.restrictTo('librarian', 'admin'), bookController.returnBook)

router.route('/:code')
.delete(authController.protect, authController.restrictTo('librarian', 'admin'), bookController.deleteBook)

router.route('/hold')
.patch(authController.protect, bookController.holdBook)

router.route('/searchByTitle/:searchTerm')
.get(bookController.searchByTitle);

module.exports = router;