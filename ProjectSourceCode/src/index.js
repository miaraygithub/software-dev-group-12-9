
// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
app.use(bodyParser.json());
const { format } = require('date-fns'); //needed to format the event dates in a user friendly way

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use('/js', express.static(__dirname + '/src/resources/js'));
app.use('/js', express.static(path.join(__dirname, 'resources', 'js')));
app.use('/css', express.static(path.join(__dirname, 'resources', 'css')));
app.use(bodyParser.json());

// set Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

// db test
db.connect()
  .then(obj => {
    // Can check the server version here (pg-promise v10.1.0+):
    console.log('Database connection successful');
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR', error.message || error);
  });

// -------------------------------------  ROUTES  ---------------------------------------

// =========== / Route ===========
app.get('/', async (req, res) => {
  try {
    const events = await db.any(`
      SELECT *
      FROM events
      ORDER BY "eventdate" ASC, "starttime" ASC;
    `);

    const formattedEvents = events.map(events => {
      return {
        ...events,
        eventDateFormatted: format(new Date(events.eventdate), 'MMM d, yyyy'),
        startTimeFormatted: format(new Date(`1970-01-01T${events.starttime}`), 'h:mm a'),
        endTimeFormatted: format(new Date(`1970-01-01T${events.endtime}`), 'h:mm a'),
      };
    });
    
    res.render('pages/home', { events: formattedEvents });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).send('Internal server error');
  }
});

// =========== /login Route ===========
// Render the login page -- Jessie
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// TODO: Finish POST login
// app.post('login', async(req, res) => {
//   try {

//   } catch {

//   }
// })

// =========== /logout Route ===========
app.get('/logout', (req, res) => {
  res.render('pages/logout');
});

// =========== /events Route ===========
app.get('/events', async (req, res) => {
  var query = `SELECT * FROM events`;
  try {
    const response = await db.any(query);
    console.log(response);
  } catch (err) {
    console.error('Error fetching data: ', err);
    res.status(400).json({ error: err.message});
  }
});

//=========== /saveEvent Route ===========
app.post("/save-event", async (req, res) => {
  console.log('Save Event')
  try {
    const eventName = req.body.event_name
    const eventBuilding = req.body.event_building
    const eventRoomNumber = req.body.event_room_number
    const eventDate = req.body.event_date
    const eventStartTime = req.body.event_start_time
    const eventEndTime = req.body.event_end_time
    const eventClub = 1 // NEEDS TO BE CONNECTED TO USER 
    const eventDescription = req.body.event_description

    
    //QUERIES
    const buildingQuery = `SELECT locationID from locations where buildingName = ($1)`
    const saveQuery = `INSERT INTO events (eventName, building, eventDate, clubSponser, roomNumber, eventDescription, startTime, endTime)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

    //Get Building ID from Building Name
    buildingId = await db.one(buildingQuery, [eventBuilding])
    buildingId = buildingId['locationid']
    console.log(buildingId, eventBuilding)

    //Data to send to query 
    const eventSave = [eventName, buildingId, eventDate, eventClub, eventRoomNumber, eventDescription, eventStartTime+':00', eventEndTime+':00']

    //insert event into database
    console.log(eventSave)
    insertEvent = await db.none(saveQuery, eventSave)
    res.redirect('/')
  } catch (err) {
    console.error('Error saving event: ', err);
    res.status(400).json({ error: err.message});
  }
})

// =========== /eventDetails Route ===========
app.post('/new-page', async (req, res) => {
  const eventid = req.body.data;

  const events = await db.any(`
    SELECT *
    FROM events
    WHERE eventid = $1;
  `, [eventid]);

  const formattedEvents = events.map(events => {
    return {
      ...events,
      eventDateFormatted: format(new Date(events.eventdate), 'MMM d, yyyy'),
      startTimeFormatted: format(new Date(`1970-01-01T${events.starttime}`), 'h:mm a'),
      endTimeFormatted: format(new Date(`1970-01-01T${events.endtime}`), 'h:mm a'),
    };
  });

  res.render('pages/events', { event: formattedEvents[0] })
})

// =========== /search Route ===========
app.get("/search", async (req, res) => {
  try {
    // const results = await db.any(`SELECT * FROM Users
    //   JOIN Clubs
    //   JOIN Events 
    //   WHERE Users.username = keyword
    //   OR Users.firstname = keyword
    //   OR Users.lastname = keyword
    //   OR Users.fistname + ' ' + lastname = keyword
    //   AND Clubs.clubname = keyword
    //   AND Events.eventName = keyword;`, [req.body.keyword]);

    res.render('pages/search-results', {
      results: results
    });
  }
  catch (err) {
    res.render('pages/search-results', {
      results: [],
      error: true,
      message: err.message
    });
  }
});

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
});
