
require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const app = express();
const port = process.env.PORT || 5500;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db('Group4-database');
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
    try {
        const db = await connectToDatabase();
        const bookings = db.collection('Group4-collection');

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


app.post('/update-booking', async (req, res) => {
    console.log("Received update request with data:", req.body);

    const { bookingId, newName, newTime } = req.body;
    if (!bookingId || !newName || !newTime) {
        console.error("Missing data for update:", req.body);
        return res.status(400).send("Missing data for update");
    }

    try {
        const db = await connectToDatabase();
        const bookings = db.collection('Group4-collection');

        const result = await bookings.updateOne(
            { _id: new ObjectId(bookingId) },
            { $set: { name: newName, selectedTime: newTime } }
        );
        
        console.log("MongoDB Update Result:", result);

        if (result.matchedCount === 0) {
            console.error("No booking found with ID:", bookingId);
            return res.status(404).send("No booking found with the specified ID");
        }

        if (result.modifiedCount === 0) {
            console.log("No changes made to the booking.");
        }

        res.redirect('/manage-bookings');
    } catch (err) {
        console.error("Error updating booking:", err);
        res.status(500).send('Error updating your booking.');
    }
});


app.post('/delete-booking', async (req, res) => {
    const { bookingId } = req.body;
    try {
        const db = await connectToDatabase();
        const bookings = db.collection('Group4-collection');
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

app.get('/index', async (req, res) => {
    res.render('index');
    
});

app.get('/login', async (req, res) => {
    res.render('login');
    
});

app.get('/register', async (req, res) => {
    res.render('register');
    
});

  app.get('/my-bookings', async (req, res) => {
    const userEmail = req.query.email; // Use authentication mechanism to get user's email
    const userBookings = await db.collection('Group4-collection').find({ email: userEmail }).toArray();
    res.render('my-bookings', { bookings: userBookings });
});

  app.post('/register', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {
    
            let hashPassword = await bcrypt.hash(req.body.password, 10);
    
            let newUser = {
                id: Date.now(),
                username: req.body.username,
                email: req.body.email,
                password: hashPassword,
            };
            users.push(newUser);
            console.log('User list', users);
    
            res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./registration.html'>Register another user</a></div>");
        } else {
            res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./registration.html'>Register again</a></div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

app.post('/login', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (foundUser) {
    
            let submittedPass = req.body.password; 
            let storedPass = foundUser.password; 
    
            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                let usrname = foundUser.username;
                res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);
            } else {
                res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
            }
        }
        else {
    
            let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
            await bcrypt.compare(req.body.password, fakePass);
    
            res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
