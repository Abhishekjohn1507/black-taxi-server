const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000; // Port for the server

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
  const { pickup, drop, date, time, passengers } = req.body;

  // Validate input
  if (!pickup || !drop || !date || !time || !passengers) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Create a booking object
  const newBooking = {
    id: bookings.length + 1,
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
