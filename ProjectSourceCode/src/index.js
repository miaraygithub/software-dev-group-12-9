// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs'); //  To hash passwords
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
      SELECT events.eventID as eventid, events.eventName as eventname, locations.buildingName as building, events.eventDate as eventdate, clubs.clubName as clubsponser, events.roomNumber as roomnumber, events.eventDescription as eventdescription, events.startTime as starttime, events.endTime as endtime
      FROM events
      INNER JOIN locations ON events.building = locations.locationID
      INNER JOIN clubs ON events.clubSponser = clubs.clubID
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

    // generate geojson formatted event list to show pins
    const geojson = await db.any(`
      SELECT jsonb_build_object(
          'type', 'FeatureCollection',

          'features', jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'geometry', jsonb_build_object(
                  'type', 'Point',
                  'coordinates', jsonb_build_array(locations.longitude, locations.latitude)
              ),
              'properties', jsonb_build_object(
                  'eventID', events.eventID,
                  'buildingName', locations.buildingName,
                  'roomNumber', events.roomNumber
              )
            )
          )
      ) AS geojson
      FROM events
      INNER JOIN locations ON events.building = locations.locationID;`);

    const geoEvents = geojson[0].geojson;
    // console.log(JSON.stringify(geoEvents, null, 2)); // see if geoEvents is formatted correctly

    const buildings = await db.any(`SELECT locationID, buildingName FROM locations;`)

    res.render('pages/home', { 
      login: !!req.session.user,
      events: formattedEvents, 
      geoEvents: JSON.stringify(geoEvents),
      buildings: buildings
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).send('Internal server error');
  }
});

// =========== /profile Route ===========
app.get('/profile', async(req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/profile');
}) 

// =========== /login Routes ===========
app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/login', async(req, res) => {
  try {
    const user = await db.oneOrNone('SELECT DISTINCT * FROM users WHERE username = $1;', [req.body.username])
    if (!user) { throw new Error('Invalid username or password.'); }
    
    // check if password from request matches with password in DB
    const match = await bcrypt.compare(req.body.password, user.userpassword);
    if (!match) { throw new Error('Invalid username or password.'); }

    req.session.user = user;
    req.session.save();
    res.redirect('/');
  } catch (err) {
    console.log('Login failed.');
    // res.status(400).json({ error: err.message});
    res.render('pages/login', {
      error: true,
      message: err
    });
  }
})

// =========== /register Routes ===========

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async(req,res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);

    const query = 'INSERT INTO users(userName, userPassword, userAdmin) VALUES($1, $2, $3)';
    await db.none(query, [req.body.username, hash, req.body.useradmin]);

    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);
    res.redirect('/register');
  }
});

// =========== /logout Route ===========
app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    res.render('pages/logout', { message: 'Logged out successfully!'});
  });
  // res.render('pages/logout');
});

// =========== GET /events Route for sidebar ===========
app.get('/events', async (req, res) => {
  var query = `SELECT * FROM users`;
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
    const eventName = req.body.event_name;
    const eventBuildingID = req.body.event_building;
    const eventRoomNumber = req.body.event_room_number;
    const eventDate = req.body.event_date;
    const eventStartTime = req.body.event_start_time;
    const eventEndTime = req.body.event_end_time;
    const eventClub = 1 // NEEDS TO BE CONNECTED TO USER 
    const eventDescription = req.body.event_description;

    
    //QUERIES
    const saveQuery = `INSERT INTO events (eventName, building, eventDate, clubSponser, roomNumber, eventDescription, startTime, endTime)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`

    //Data to send to query 
    const eventSave = [eventName, eventBuildingID, eventDate, eventClub, eventRoomNumber, eventDescription, eventStartTime+':00', eventEndTime+':00']

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
app.get('/event-details', async (req, res) => {
  const eventid = req.query.eventID;

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

  // Fetch Comments
  const comments = await db.any(`
    SELECT * FROM comments
    WHERE eventid = $1
    ORDER BY created_at DESC;
  `, [eventid]);

  res.render('pages/events', { event: formattedEvents[0],
    comments
   })
})

//For handling the redirect/reload once the user posts a comment
app.get('/event/:id', async (req, res) => {
  const eventid = req.params.id;

  const events = await db.any(`
    SELECT * FROM events
    WHERE eventid = $1;
  `, [eventid]);

  const formattedEvents = events.map(event => {
    return {
      ...event,
      eventDateFormatted: format(new Date(event.eventdate), 'MMM d, yyyy'),
      startTimeFormatted: format(new Date(`1970-01-01T${event.starttime}`), 'h:mm a'),
      endTimeFormatted: format(new Date(`1970-01-01T${event.endtime}`), 'h:mm a'),
    };
  });

  const comments = await db.any(`
    SELECT * FROM comments
    WHERE eventid = $1
    ORDER BY created_at DESC;
  `, [eventid]);

  res.render('pages/events', {
    event: formattedEvents[0],
    comments
  });
});

app.post('/comment', async (req, res) => {
  const eventId = req.body.eventid;
  const commentText = req.body.comment_text;
  const username = req.session.username || 'Anonymous';

  try {
    await db.none(`
      INSERT INTO comments (eventid, comment_text, username)
      VALUES ($1, $2, $3)
    `, [eventId, commentText, username]);

    //Redirect to the GET route after comment submission
    res.redirect(`/event/${eventId}`);
  } catch (err) {
    console.error('Error submitting comment:', err);
    res.status(500).send('Failed to post comment.');
  }
});

// =========== /search Route ===========
app.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const keywordLower = keyword.toLowerCase();
    if (!keyword) { throw new Error('No keyword entered. Cannot query.') };
    
    
    // TODO: add search by user
    // const users_results = await db.any(`SELECT username, firstname, lastname FROM users 
    //   WHERE username = $1 OR firstname LIKE $1 OR lastname LIKE $1 OR (fistname || ' ' || lastname) LIKE $1;`, [req.query.keyword]);

    // TODO: once club categories is implemented, also search by cateogry
    const clubs_results = await db.any(`SELECT * FROM clubs WHERE LOWER(clubName) LIKE CONCAT('%', $1, '%');`, [keywordLower]);

    const events_results = await db.any(`SELECT e.eventID, e.eventName, l.buildingName,  e.roomNumber, e.eventDescription, e.eventDate, e.startTime, e.endTime
      FROM events e
      LEFT JOIN locations l ON e.building = l.locationID
      WHERE LOWER(e.eventName) LIKE CONCAT('%', $1, '%');`, [keywordLower]);
    
    const formattedEvents = events_results.map(events => {
      return {
        ...events,
        eventDateFormatted: format(new Date(events.eventdate), 'MMM d, yyyy'),
        startTimeFormatted: format(new Date(`1970-01-01T${events.starttime}`), 'h:mm a'),
        endTimeFormatted: format(new Date(`1970-01-01T${events.endtime}`), 'h:mm a'),
      };
    });


    const resultsBool = !!(clubs_results || events_results); // check if any results were output

    res.render('pages/search-results', {
      keyword: keyword,
      resultsBool: resultsBool,
      // users: users_results,
      clubs: clubs_results,
      events: formattedEvents
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

// =========== Comments Route ===========

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
});
