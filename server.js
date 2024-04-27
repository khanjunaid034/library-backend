const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(()=> {console.log('DB Connected!')});

const PORT = process.env.PORT || 7000;

app.listen(PORT, err => {
    if(err)
        console.log(err);
    console.log(`Server started on port ${PORT}`);
})