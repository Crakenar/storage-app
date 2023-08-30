const express = require('express');
const mysql = require('mysql2')
const fs = require('fs');
require('dotenv').config();
const multer = require('multer');

const app = express();

const connection = mysql.createConnection({
    host: 'host.docker.internal',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
})

connection.connect();

const PORT = process.env.NODE_DOCKER_PORT || 8080;
const HOST = '0.0.0.0';

app.get('/', (req, res) => {
    res.send('Hello World');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { user_id } = req.body;
        const dir = `./uploads/${user_id}`
        fs.exists(dir, exist => {
                if (!exist) {
                    return fs.mkdir(dir, error => cb(error, dir))
                }
        cb(null, dir);
        });
    },
    filename: (req, file, cb) => {
        const ext = getExtension(file.originalname);
        const fileName = getClearFileName(file.originalname);
        const registeredFileName = `${fileName}-${Date.now()}.${ext}`;
        cb(null, registeredFileName);
    }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('test'), function (req, res, next) {
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file');
        // error.httpStatusCode = 400;
        res.json({status: 500, message: error.message});
    } else {
        const check = fs.existsSync(file.path);
        if (!check) {
            const error = new Error('Error while uploading a file');
            // error.httpStatusCode = 400;
            res.json({status: 500, message: error.message});
        } else {
            const resultQuery = saveFileInDatabase(file.originalname, file.path, req.body.user_id);
            if (resultQuery.success) {
                res.json({status: 200, file: req.file});
            } else {
                fs.unlinkSync(file.path);
                res.json({status: 500, message: resultQuery.message});
            }
        }
    }
});


function saveFileInDatabase(fileName, path ,user_id) {
    try {
        connection.query('INSERT INTO documents (name, path, user_id) VALUES (?, ?, ?)', [fileName, path, user_id]);
        return {success: true};
    }catch (e) {
        return {success: false, message: e.message};
    }
}

function getExtension(fileName) {
    return fileName.split('.').pop();
}

function getClearFileName(fileName) {
    return fileName.split('.').shift();
}

/* TODO:
    -   Add error handling
    -   Add jsonwebtoken
    -   Job to check no virus on files (like first save files in a quarantine folder then after scan move it to final folder)
    -   Encrypt files when transferring to final folder
    -   Make a command to delete files https://x-team.com/blog/a-guide-to-creating-a-nodejs-command/
*/



app.listen(PORT, HOST, (error) => {
    if (!error) {
        console.log("Upload Server Running on " + PORT);
    }  else {
        console.log("Error occurred, server can't start",  error);
    }
});


