const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const globalErrorHandler = require('./controllers/globalErrorController');
const userRouter = require('./routers/userRouter');
const bookRouter = require('./routers/bookRouter');
const cookieParser = require('cookie-parser')
const app = express();

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