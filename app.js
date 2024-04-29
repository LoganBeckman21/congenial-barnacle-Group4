require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5500;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI;
let db;

async function connectToDatabase() {
    if (!db) {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('Group4-database');
    }
    return db;
}

const classSchedules = {
    'CS440': [
        { day: 'Monday', time: '9:00 AM' },
        { day: 'Monday', time: '12:30 PM' },
        { day: 'Wednesday', time: '2:00 PM' },
        { day: 'Wednesday', time: '3:30 PM' },
    ],
    'CS455': [
        { day: 'Tuesday', time: '10:30 AM' },
        { day: 'Tuesday', time: '1:00 PM' },
        { day: 'Thursday', time: '4:30 PM' },
        { day: 'Thursday', time: '6:00 PM' },
    ],
    'ITE449': [
        { day: 'Friday', time: '6:00 PM' },
        { day: 'Friday', time: '7:30 PM' },
    ],
};

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/schedule', async (req, res) => {
    const selectedCourse = req.query.course;
    const db = await connectToDatabase();
    const bookings = db.collection('Group4-collection');

    try {
        const bookedTimes = await bookings.find({ course: selectedCourse }).toArray();
        res.render('schedule', {
            classTimes: classSchedules[selectedCourse] || [],
            bookedTimes: bookedTimes.map(b => b.selectedTime),
            course: selectedCourse
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving schedule.');
    }
});

app.post('/submit-booking', async (req, res) => {
    const { name, reason, selectedTime, course } = req.body;
    try {
        const db = await connectToDatabase();
        const bookings = db.collection('Group4-collection');

        const existingBooking = await bookings.findOne({ selectedTime, course });
        if (existingBooking) {
            res.render('booking-unavailable', { course, selectedTime });
        } else {
            await bookings.insertOne({ name, reason, selectedTime, course });
            res.render('confirmation', { booking: { name, reason, selectedTime, course } });
        }
    } catch (err) {
        console.error("Failed to save booking:", err);
        res.status(500).send('Error processing your booking.');
    }
});


// Route to handle updating a booking
app.post('/update-booking', async (req, res) => {
    const { bookingId, newName, newTime } = req.body;
  
    try {
      const db = await connectToDatabase(); // This assumes you have a function to connect to your DB
      const bookings = db.collection('bookings');
  
      await bookings.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { name: newName, selectedTime: newTime } }
      );
  
      res.redirect('/manage-bookings');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating your booking.');
    }
  });
  
  // Route to handle deleting a booking
  app.post('/delete-booking', async (req, res) => {
    const { bookingId } = req.body;
  
    try {
      const db = await connectToDatabase();
      const bookings = db.collection('bookings');
  
      await bookings.deleteOne({ _id: new ObjectId(bookingId) });
  
      res.redirect('/manage-bookings');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting your booking.');
    }
  });
  
  app.get('/manage-bookings', async (req, res) => {
    const db = await connectToDatabase();
    const bookingsCollection = db.collection('Group4-collection');

    try {
        const userEmail = req.query.email; // Replace with your user's identification logic
        const bookings = await bookingsCollection.find({ email: userEmail }).toArray();
        res.render('manage-bookings', { bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving bookings.");
    }
});

  app.get('/my-bookings', async (req, res) => {
    const userEmail = req.query.email; // Use authentication mechanism to get user's email
    const userBookings = await db.collection('Group4-collection').find({ email: userEmail }).toArray();
    res.render('my-bookings', { bookings: userBookings });
});

connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}).catch(console.error);
