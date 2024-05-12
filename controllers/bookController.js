const Book = require('./../models/bookModel');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const AWS = require('aws-sdk');
const fs = require('fs')
const hashGen = require('hash-generator');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');

AWS.config.update({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_KEY,
    region: 'ap-south-1',
})

const s3 = new AWS.S3();


exports.addBook = async (req, res, next) => {

    const currentYear = new Date().getFullYear();
    if (req.body.published > currentYear) {
        return next(new AppError('Book publish year cannot be greater than current year!', 400));
    }
    
    const file = req.file;
    const uniqueFileName = `${hashGen(12)}.${file.originalname.split('.').pop()}`;

    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
        Bucket: 'mern-play/book-images',
        Key: uniqueFileName,
        Body: fileStream
    }

    let data;
    try {
        data = await s3.upload(uploadParams).promise();
        fs.unlinkSync(file.path);
    } catch (err) {
        fs.unlinkSync(file.path);
        return next(err);
    }

    try {
        const book = await Book.create({ ...req.body, imageUrl: data.Location });
        res.status(201).json({
            status: 'success',
            data: {
                book
            }
        })
    } catch (err) {
        next(err);
    }
}

exports.allBooks = async (req, res, next) => {
    try {
        const books = await Book.find().select('-_id -__v');
        res.status(200).json({
            status: 'success',
            data: {
                books
            }
        })
    } catch (err) {
        next(err);
    }
}

exports.assignBook = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!req.body.code || !req.body.email) {
            return next(new AppError('Book code or user e-mail not supplied!', 400));
        }
        req.body.code = req.body.code.toUpperCase();

        const book = await Book.findOne({ code: req.body.code });
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError('User not found with that e-mail!', 404));
        }
        if (!book) {
            return next(new AppError('No book found with given book code!', 404));
        }
        if (user.assignedBooks.includes(req.body.code)) {
            return next(new AppError('User already has one unit of the same book!', 400));
        }
        if (book.unitsAvailable < 1) {
            return next(new AppError('Out of stock!', 404));
        }

        user.assignedBooks.push(book.code);


        await Promise.all([
            User.findOneAndUpdate(
                { email: user.email }, 
                { $push: { assignedBooks: book.code } },
                { session }
            ),
            Book.findOneAndUpdate(
                { code: book.code, unitsAvailable: { $gt: 0 } },
                { $inc: { unitsAvailable: -1 } },
                { session }
            )
        ])

          await session.commitTransaction();
        
        res.status(200).json({
            status: 'success',
            message: 'Book assigned'
        })
    } catch (err) {
        await session.abortTransaction();
        next(err);
    }
    finally {
        session.endSession();
    }
}

exports.returnBook = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    // check if book code and user email is supplied
    if (!req.body.code || !req.body.email) {
        return next(new AppError('Book code or user e-mail not supplied!', 400));
    }
    req.body.code = req.body.code.toUpperCase();

    try {
        // check if user exists in database
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError('User not found with that e-mail!', 404));
        }

        // check if supplied book exists
        const book = await Book.findOne({ code: req.body.code });
        if (!book) {
            return next(new AppError('No book found with given book code!', 404));
        }


        // check if supplied book is assigned to user
        if (!user.assignedBooks.includes(req.body.code)) {
            return next(new AppError('Given book is not assigned to this user.', 400));
        }

     
        await Promise.all([
            User.findOneAndUpdate(
                { email: user.email },
                { $pull: { assignedBooks: book.code } },
                { session }
            ),
            Book.findOneAndUpdate(
                { code: book.code },
                { $inc: { unitsAvailable: 1 } },
                { session }
            )
        ])

          await session.commitTransaction();

        res.status(200).json({
            status: 'success',
            message: 'Book returned'
        })
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
}


exports.deleteBook = async (req, res, next) => {
    console.log(req.params.code)
    try {
        const book = await Book.findOne({ code: req.params.code });

        // check if book exists
        if (!book) {
            return next(new AppError('No book found for given code!', 404));
        }

        // delete book from all users using pull and then delete the book
        await User.updateMany({ assignedBooks: book.code }, { $pull: { assignedBooks: book.code } });
        await Book.deleteOne({ code: book.code });
        res.status(204).json({
            status: 'success',
            message: 'Book deleted'
        })
    } catch (err) {
        next(err);
    }
}


exports.holdBook = async (req, res, next) => {

    try {
        const book = await Book.findOne({ code: req.body.code });
        if (!book) {
            return next(new AppError('No book found with given code!', 404));
        }

        const user = await User.findOne({ email: req.user.email });

        if (book.holds.includes(user.id)) {
            return next(new AppError('You have already placed a hold on this book!', 400));
        }

        if (book.unitsAvailable > 0) {
            return next(new AppError(`${book.unitsAvailable} units are available for this book, you cannot place a hold.`, 400))
        }

        if (user.assignedBooks.includes(book.code)) {
            return next(new AppError(`You already have this book assigned to you!`, 400))
        }

        book.holds.push(user.id);
        user.holds.push(book.code);

        await Book.updateOne({ code: book.code }, { holds: book.holds }, { new: true, runValidators: true });
        await User.updateOne({ email: user.email }, { holds: book.code }, { new: true, runValidators: true });

        res.status(200).json({
            status: 'success',
            message: `${book.code} is now held by ${user.email}`
        })
    } catch (err) {
        next(err);
    }
}

// SEARCH BOOK METHODS

// SEARCH BY BOOK TITLE

exports.searchByTitle = async (req, res, next) => {
    if (!req.params.searchTerm) {
        return res.status(200).json({
            status: 'success',
            data:
                []
        })
    }

    try {
        const books = await Book.find({ title: { $regex: req.params.searchTerm.toString(), $options: 'i' } }).select('-_id -__v');
        res.status(200).json({
            status: 'success',
            data: {
                books
            }
        })
    } catch (err) {
        next(err);
    }
}