const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mysql = require('mysql');
const uploadFile = require('./file.upload');
const path = require('path');
const fs = require("fs");
const csv = require("csv-parser");
const multer = require('multer');
const upload = multer();

// Connection to Database

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "nahid007@@2345",
    database: "HRManagement",
});


// Setup Middle Ware

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(`${__dirname}/uploads`)));


// Initial API

app.get("/", (req, res) => {
    res.send("Welcome to HR Management");
});


// Add Employee Information In Database

app.post("/api/insert", (req, res) => {
    if (req.body.firstName == " ") {
        return res.send({
            success: false,
            message: 'Please Enter First Name'
        })
    }
    if (req.body.lastName == " ") {
        return res.send({
            success: false,
            message: 'Please Enter Last Name'
        })
    }
    if (req.body.email == " ") {
        return res.send({
            success: false,
            message: 'Please Enter Email'
        })
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const sqlInsert = "INSERT INTO employee_information (firstName, lastName, email) VALUES (?, ?, ?)";
    db.query(sqlInsert, [firstName, lastName, email], (err, result) => {
        console.log(result.affectedRows);
        if (result.affectedRows > 0) {
            return res.send({
                success: true,
                message: 'New Employee Added In Database',
            });
        }
    });
});

// Get Employee Information From Database

app.get("/api/get", (req, res) => {
    const sqlSelect = "SELECT * FROM employee_information";
    db.query(sqlSelect, (err, result) => {
        res.send(result);
    });
});


// Add Multiple Employee Information 

app.post('/api/file-upload', uploadFile.single('file'), (req, res) => {
    const filePath = req.file.originalname;

    let response = {
        successCount: 0,
        errorCount: 0,
    }
    fs.createReadStream(`./uploads/${filePath}`)
        .pipe(csv())
        .on("data", (data) => {
            if (data.firstName && data.lastName && data.email) {
                const sqlInsert = "INSERT INTO employee_information (firstName, lastName, email) VALUES (?, ?, ?)";
                db.query(sqlInsert, [data.firstName, data.lastName, data.email], (err, result) => {
                });
                response.successCount += 1;
            } else {
                response.errorCount += 1;
            }
        }).on("end", () => {
            fs.unlink(`./uploads/${filePath}`, (err) => {
                if (err)
                    console.log(err)
            })
            return res.send({
                success: true,
                message: 'Total Employee Data Success ' + response.successCount + 'Total Employee Data Failed ' + response.errorCount,
                data: response
            });
        });
});

// Console Message 

app.listen(5000, () => {
    console.log("Application running on port: 5000")
})
