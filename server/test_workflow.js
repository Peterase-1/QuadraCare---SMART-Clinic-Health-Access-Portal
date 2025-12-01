const mongoose = require('mongoose');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const doctorController = require('./controllers/doctorController');
const labTechController = require('./controllers/labTechController');

// Mock Request/Response
const mockReq = (body = {}, params = {}, user = {}) => ({
  body,
  params,
  user
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function runTest() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/quadracare_test');
    console.log('Connected to MongoDB');

    // Cleanup
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});

    // 1. Create Users
    const doctor = await User.create({ name: 'Dr. Test', email: 'doc@test.com', password: '123', role: 'doctor' });
    const patient = await User.create({ name: 'Pat Test', email: 'pat@test.com', password: '123', role: 'patient' });
    const labtech = await User.create({ name: 'Lab Test', email: 'lab@test.com', password: '123', role: 'lab_tech' });

    console.log('Users created');

    // 2. Create Appointment
    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient._id,
      date: new Date(),
      time: '10:00',
      reason: 'Checkup',
      status: 'approved'
    });
    console.log('Appointment created:', appointment._id);

    // 3. Start Consultation (Doctor)
    console.log('--- Starting Consultation ---');
    const consultReq = mockReq({
      patientId: patient._id,
      patientDetails: { age: 30, weight: '70kg', bloodPressure: '120/80', symptoms: 'Fever' },
      labRequest: { required: true, testType: 'Blood Test' }
    }, {}, doctor);
    const consultRes = mockRes();

    await doctorController.createConsultation(consultReq, consultRes);
    const record = consultRes.data;
    console.log('Consultation Record Created:', record._id);

    // Verify Appointment Status
    const updatedAppt = await Appointment.findById(appointment._id);
    console.log('Appointment Status (should be completed):', updatedAppt.status);

    // 4. Lab Tech Enters Results
    console.log('--- Entering Lab Results ---');
    const labReq = mockReq({
      resultData: 'All good',
      bloodPressure: '120/80',
      temperature: '37.5',
      heartRate: '72',
      bloodSugar: '90',
      cholesterol: '180',
      wbc: '5000',
      hemoglobin: '14.0',
      comments: 'Normal'
    }, { id: record._id }, labtech);
    const labRes = mockRes();

    await labTechController.updateRequestStatus(labReq, labRes);
    console.log('Lab Results Updated. Status:', labRes.data.status);
    console.log('Lab Data:', labRes.data.labResults);

    // 5. Doctor Finalizes
    console.log('--- Finalizing Record ---');
    const finalizeReq = mockReq({
      diagnosis: 'Viral Fever',
      prescription: {
        medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'BID', duration: '3 days', route: 'Oral', timing: 'After Meal', notes: 'Take with water' }],
        instructions: 'Rest well'
      }
    }, { id: record._id }, doctor);
    const finalizeRes = mockRes();

    await doctorController.finalizeRecord(finalizeReq, finalizeRes);
    console.log('Record Finalized. Status:', finalizeRes.data.status);
    console.log('Prescription:', finalizeRes.data.prescription);

    // 6. Doctor Closes Case
    console.log('--- Closing Case ---');
    const closeReq = mockReq({}, { id: record._id }, doctor);
    const closeRes = mockRes();

    await doctorController.closeRecord(closeReq, closeRes);
    console.log('Record Closed. Status:', closeRes.data.status);

    console.log('TEST COMPLETED SUCCESSFULLY');
    process.exit(0);
  } catch (error) {
    console.error('TEST FAILED:', error);
    process.exit(1);
  }
}

runTest();
