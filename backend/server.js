const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRouter = require('./routes/auth');
const assetsRouter = require('./routes/assets');
const inspectionsRouter = require('./routes/inspections');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for the dev/learning setup
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded assets static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/reports', reportsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start listening if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Asset Inspection Platform backend running on port ${PORT}`);
  });
}

module.exports = app;
