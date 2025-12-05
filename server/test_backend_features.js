const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Ward = require('./models/Ward');
const Room = require('./models/Room');
const InpatientRecord = require('./models/InpatientRecord');

async function testBackendFeatures() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Cleanup
    await Ward.deleteMany({ name: 'Test Ward' });
    await Room.deleteMany({ roomNumber: 'T-101' });
    await InpatientRecord.deleteMany({ diagnosis: 'Test Diagnosis' });

    // 1. Admin: Create Ward
    console.log('1. Creating Ward...');
    const ward = await Ward.create({
      name: 'Test Ward',
      type: 'Surgical',
      capacity: 10
    });
    console.log('Ward Created:', ward._id);

    // 2. Admin: Create Nurse and Room
    console.log('2. Setup Nurse and Room...');
    let nurse = await User.findOne({ email: 'testnurse@example.com' });
    if (!nurse) {
      // Create dummy nurse if not exists, though usually we assume seeded data
      // For test purity let's try to find any user or create one
      const password = 'password123'; // Logic to hash? We need to use User model create which hashes
      nurse = await User.create({
        name: 'Test Nurse',
        email: 'testnurse@example.com',
        password: 'password123',
        role: 'nurse'
      });
    }

    const room = await Room.create({
      roomNumber: 'T-101',
      ward: ward._id,
      capacity: 1,
      assignedNurses: [nurse._id]
    });
    console.log('Room Created:', room._id);

    // 3. Doctor: Admit Patient
    // Need a patient and doctor
    console.log('3. Admitting Patient...');
    let patient = await User.findOne({ role: 'patient' });
    let doctor = await User.findOne({ role: 'doctor' });

    if (!patient || !doctor) {
      console.log('Skipping admission test - missing patient/doctor in DB');
      return;
    }

    const inpatientRecord = await InpatientRecord.create({
      patient: patient._id,
      doctor: doctor._id,
      room: room._id,
      diagnosis: 'Test Diagnosis',
      dailyLogs: []
    });

    // Manually update room occupancy as controller would do
    room.currentOccupancy += 1;
    room.status = 'Occupied';
    await room.save();

    console.log('Inpatient Record Created:', inpatientRecord._id);

    // 4. Nurse: Add Daily Log
    console.log('4. Adding Daily Log...');
    inpatientRecord.dailyLogs.push({
      nurse: nurse._id,
      date: Date.now(),
      vitals: {
        temperature: '37.5',
        bloodPressure: '120/80',
        heartRate: '80'
      },
      notes: 'Patient stable'
    });
    await inpatientRecord.save();
    console.log('Daily Log Added.');

    console.log('Test Passed Successfully!');
  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    // Optional cleanup
    /*
    await Ward.deleteMany({ name: 'Test Ward' });
    await Room.deleteMany({ roomNumber: 'T-101' });
    await InpatientRecord.deleteMany({ diagnosis: 'Test Diagnosis' });
    if (nurse && nurse.email === 'testnurse@example.com') await User.deleteOne({ _id: nurse._id });
    */
    await mongoose.disconnect();
  }
}

testBackendFeatures();
