const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Clear any cached environment variables and reload
delete process.env.MONGO_URI;
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const facultyRoutes = require('./routes/faculty');
const facultySubjectRoutes = require('./routes/facultySubjects');
const classroomRoutes = require('./routes/classrooms');
const subjectRoutes = require('./routes/subjects');
const batchRoutes = require('./routes/batches');
const timetableRoutes = require('./routes/timetables');
const schoolRoutes = require('./routes/schools');
const courseRoutes = require('./routes/courses');
const studentRoutes = require('./routes/students');
const leaveRequestRoutes = require('./routes/leaveRequests');
const rescheduleRequestRoutes = require('./routes/rescheduleRequests');

// Import middleware
const { authenticate } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
console.log('🔍 MONGO_URI preview:', process.env.MONGO_URI?.substring(0, 50) + '...');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_classroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/faculty', authenticate, facultyRoutes);
app.use('/api/faculty-subjects', authenticate, facultySubjectRoutes);
app.use('/api/classrooms', authenticate, classroomRoutes);
app.use('/api/subjects', authenticate, subjectRoutes);
app.use('/api/batches', authenticate, batchRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/schools', authenticate, schoolRoutes);
app.use('/api/courses', authenticate, courseRoutes);
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/reschedule-requests', rescheduleRequestRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
