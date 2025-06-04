const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // Import path module

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Explicitly point to .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors()); // Commented out the simple cors

const allowedOrigins = [
  'https://event-planner-india.netlify.app',
  'http://localhost:3000', // For local frontend dev
  'http://localhost:5000'  // If you ever test backend directly locally with a tool
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // If you plan to use cookies or send authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Added X-Requested-With
}));

// Handle preflight requests for all routes
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json()); // To parse JSON request bodies

// Define Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("FATAL ERROR: MONGO_URI is not defined in the .env file.");
    process.exit(1); // Exit the application if MONGO_URI is not found
}

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the application on connection failure
});

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Event Planner Backend API is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // Export for potential testing or extension 