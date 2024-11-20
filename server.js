const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = 5000; // Port for the server



// Razorpay credentials from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Accessing the key from environment variables
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Accessing the key secret
});

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// In-memory database for bookings (temporary storage)
const bookings = [];

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Booking API');
});

// Create a booking
app.post('/api/bookings', (req, res) => {
  const { Name, pickup, drop, date, time, passengers } = req.body;

  // Validate input
  if (!Name || !pickup || !drop || !date || !time || !passengers) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Create a booking object
  const newBooking = {
    id: bookings.length + 1,
    Name, // Include Name
    pickup,
    drop,
    date,
    time,
    passengers,
  };

  // Save booking to "database"
  bookings.push(newBooking);

  // Return the created booking
  res.status(201).json({
    message: 'Booking created successfully.',
    booking: newBooking,
  });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// Create an order (payment initialization)
app.post('/api/create-order', async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required.' });
  }

  const options = {
    amount: amount * 100, // Amount in paise (Razorpay requires this format)
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(201).json({
      orderId: order.id,
      key: 'YOUR_RAZORPAY_KEY_ID', // Provide the Razorpay Key ID to the frontend
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order.' });
  }
});

// Verify payment
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'All payment details are required.' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', 'YOUR_RAZORPAY_KEY_SECRET')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    const bookingId = `booking_${Date.now()}`; // Generate a unique booking ID
    res.json({ success: true, bookingId });
  } else {
    res.status(400).json({ success: false, message: 'Payment verification failed.' });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
