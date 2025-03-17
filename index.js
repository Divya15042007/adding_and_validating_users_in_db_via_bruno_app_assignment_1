const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { resolve } = require("path");
require("dotenv").config();

const app = express();
const port = 3010;

// Middleware
app.use(express.static("static"));
app.use(express.json()); // Parse JSON requests

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((error) => {
    console.error("Database Connection Failed:", error);
    process.exit(1);
  });

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
});

const User = mongoose.model("User", userSchema);

// Serve Homepage
app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "pages/index.html"));
});

// User Registration Route
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to database
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
