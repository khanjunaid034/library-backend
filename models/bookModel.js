const mongoose = require('mongoose');
const validator = require('validator');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A book must have a title.'],
    },
    code: {
        type: String,
        required: [true, 'A book must have a Unique ID code.'],
        unique: true,
        uppercase: true,
        maxlength: 5,
        minlength: 5
    },
    published: {
        type: Number,
        required: [true, 'A book must have a published year.']
    },
    authors: {
        type: [String],
        required: [true, 'A book must have author(s).']
    },
    unitsAvailable: {
        type: Number,
        required: [true, 'A book must have a number of availabe units.']
    },
    unitsTotal: {
        type: Number,
        required: [true, 'A book must have a number of total units.']
    },

    holds: {
        type: [mongoose.Schema.ObjectId],
        ref: 'User'
    },
    imageUrl: {
        type: String
    }
})

// bookSchema.pre(/^find/, function(next){
//     this.populate('holds');
//     next();
// })

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;