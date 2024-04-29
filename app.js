const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const globalErrorHandler = require('./controllers/globalErrorController');
const userRouter = require('./routers/userRouter');
const bookRouter = require('./routers/bookRouter');
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();

app.use(mongoSanitize()); // to protect from NoSQL query injection attack
app.use(xss()); // to protect from injection of HTML code into database



app.use(cookieParser());

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));
app.use('/api/v1/library/users', userRouter);
app.use('/api/v1/library/books', bookRouter);
app.get('*', (req, res, next) => {
    console.log(req.cookies);
})

app.use(globalErrorHandler);

module.exports = app;