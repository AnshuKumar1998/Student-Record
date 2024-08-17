const express = require('express');
const app = express();
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Middleware
app.use(cors());
app.use(express.json()); // Handle JSON data in requests

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// JWT Secret Key
const SECRET_KEY = 'mySuperSecretKey';

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Sequelize ORM setup
const sequelize = new Sequelize('reactcrud', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

sequelize.authenticate()
    .then(() => console.log('Connected to the MySQL database'))
    .catch(err => console.error('Unable to connect to the database:', err));

// Student Model
const Student = sequelize.define('Student', {
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'student',
    timestamps: false
});

// Route to get all students
app.get("/", authenticateToken, async (req, res) => {
    try {
        const students = await Student.findAll();
        res.json(students);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Route to create a new student
app.post('/create', authenticateToken, async (req, res) => {
    try {
        const student = await Student.create({
            Name: req.body.name,
            Email: req.body.email
        });
        res.json(student);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json("Error creating student");
    }
});

// Route to update a student
app.put('/update/:id', authenticateToken, async (req, res) => {
    try {
        const student = await Student.update({
            Name: req.body.name,
            Email: req.body.email
        }, {
            where: { ID: req.params.id }
        });
        res.json(student);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ message: "Error updating student" });
    }
});

// Route to delete a student
app.delete('/student/:id', authenticateToken, async (req, res) => {
    const id = req.params.id; // Get the ID from URL parameters

    if (!id) {
        return res.status(400).json({ message: "No ID provided" });
    }

    try {
        const result = await Student.destroy({ where: { ID: id } });

        if (result === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ message: "Error deleting student" });
    }
});



// Route to login and get a token
app.post('/login', (req, res) => {
    const user = {
        id: 1, // example user id
        username: 'exampleUser'
    };
    const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Start the server
app.listen(8081, () => {
    console.log("Server is running on port 8081");
});


