const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Volunteer = require('../models/Volunteer');

// Get all attendance
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('volunteerId eventId').sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create attendance (bulk)
router.post('/bulk', async (req, res) => {
  try {
    const records = req.body.records;
    const savedRecords = await Attendance.insertMany(records);
    
    // Update volunteer hours
    for (let record of records) {
      if (record.status === 'present') {
        await Volunteer.findByIdAndUpdate(record.volunteerId, {
          $inc: { hours: record.hours }
        });
      }
    }
    
    res.status(201).json(savedRecords);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;