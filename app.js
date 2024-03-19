const express = require('express')
const app = express()
const port = process.env.PORT || 5500;
// set the view engine to ejs
let path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// use res.render to load up an ejs view file

let myTypeServer = "9️⃣ The Peacemaker ✌🏻";




// create a function to display the table with the days and times available
function displayScheduleTable() {
  // define the available class times
  const classTimes = [
    { day: 'Monday', time: '9:00 AM' },
    { day: 'Tuesday', time: '10:30 AM' },
    { day: 'Wednesday', time: '2:00 PM' },
    { day: 'Thursday', time: '4:30 PM' },
    { day: 'Friday', time: '6:00 PM' }
  ];

  // render the schedule table view

  
  app.get('/schedule', function(req, res) {
    const selectedCourses = req.query.courses;
    if (selectedCourses.includes('CS440') || selectedCourses.includes('CS455') || selectedCourses.includes('ITE449')) {
      res.render('schedule', {
        classTimes: classTimes
      });
    } else {
      res.send('No schedule available for the selected courses.');
    }
  });
}

// call the function to display the schedule table
displayScheduleTable()








app.get('/', function(req, res) {

  res.render('index', {
   
    myTypeClient: myTypeServer 

  });
  
});


app.get('/send', function (req, res) {
  
    res.send('Hello World from Express <br><a href="/">home</a>')
})


// app.listen(3000)

app.listen(port, () => {
  console.log(`nov app listening on port ${port}`)
})
