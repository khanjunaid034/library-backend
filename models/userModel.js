const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name']
    },

    email: {
        type: String,
        validate: [validator.isEmail, 'Please provide a valid e-mail'],
        required: [true, 'A user must have an email'],
        unique: true,
        lowercase: true,
    },

    role: {
        type: String,
        enum: ['admin', 'librarian', 'patron'],
        default: 'patron'
    },

    password: {
        type: String,
        minlength: 8,
        select: false
    },

    confirmPassword: {
        type: String,
        validate: {
            validator: function(el) {
                return el === this.password
            },
            message: 'Passwords are not same'
        }
    },

    passwordChangedAt: Date,
    
    assignedBooks: {
        type: [String]
    },

    holds: {
        type: [String]
    }
})

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 2000;
    next();
})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
})

// methods

userSchema.methods.checkPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

const User = mongoose.model('User', userSchema);
module.exports = User;