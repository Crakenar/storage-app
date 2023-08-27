const express = require('express');
const mysql = require('mysql')
require('dotenv').config();
const multer = require('multer');

const upload = multer({ dest: 'uploads/'});
const app = express();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

connection.connect();

const PORT = process.env.NODE_DOCKER_PORT || 8080;
const HOST = '0.0.0.0';

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/thumbnail/upload', upload.single('test'), function (req, res, next) {
    console.log('my file', req.file);
})


app.listen(PORT, HOST, (error) => {
   if (!error) {
       console.log("Upload Server Running on " + PORT);
   }  else {
       console.log("Error occured, server can't start",  error);
   }
});



