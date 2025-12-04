const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Payment Intent
// @route   POST /api/payment/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  const { type } = req.body;
  let amount = 0;
  let currency = 'etb'; // Ethiopian Birr

  // Determine amount based on type
  if (type === 'appointment') {
    amount = 150 * 100; // 150 ETB in cents (Stripe requires > $0.50)
  } else if (type === 'lab_test') {
    amount = 200 * 100; // 200 ETB in cents
  } else {
    return res.status(400).json({ message: 'Invalid payment type' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm Payment & Update Record
// @route   POST /api/payment/confirm
// @access  Private
exports.confirmPayment = async (req, res) => {
  const { paymentIntentId, recordId, type } = req.body;

  try {
    // In a real app, verify paymentIntentId with Stripe here

    if (type === 'lab_test' && recordId) {
      const MedicalRecord = require('../models/MedicalRecord');
      const record = await MedicalRecord.findById(recordId);

      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      if (record.labRequest) {
        record.labRequest.paymentStatus = 'paid';
        await record.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Payment Confirmation Error:', error);
    res.status(500).json({ message: error.message });
  }
};
