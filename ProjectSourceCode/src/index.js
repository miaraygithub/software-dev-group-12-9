// ----------------------------------   DEPENDENCIES  ----------------------------------------------

const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs'); //  To hash passwords
const app = express();
const ical = require('node-ical');
app.use(bodyParser.json());
const { format } = require('date-fns'); //needed to format the event dates in a user friendly way

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
  helpers: { // for clubs page to only show 10 clubs on the horizontal scroll
    slice: (arr, start, end) => arr.slice(start, end),
    gt: (a, b) => a > b
  }
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
      INNER JOIN clubs ON events.clubSponsor = clubs.clubID
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
                  'roomNumber', events.roomNumber,
                  'category', clubs.category
              )
            )
          )
      ) AS geojson
      FROM events
      INNER JOIN locations ON events.building = locations.locationID
      INNER JOIN clubs ON events.clubSponsor = clubs.clubID;`);

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
app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/profile');
}); 

app.post('/profile', async(req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    if (req.body.newUsername) {
      // Validation that username does not already exist in db
      const searchQuery = 'SELECT DISTINCT * FROM users WHERE users.userName = ($1)';
      const existingUser = await db.oneOrNone(searchQuery, [req.body.newUsername]);
  
      if (!!existingUser) {
        console.log('User already exists in database.');
        throw new Error('Username taken. Please choose a different one.');
      }

      const usernameQuery = 'UPDATE users SET userName = ($1) WHERE users.userName = ($2)';
      await db.none(usernameQuery, [req.body.newUsername, req.session.user.username]);
      // const updatedUser = await db.oneOrNone('SELECT DISTINCT * FROM users WHERE users.userName = ($1) LIMIT 1;', [req.body.newUsername])
      // console.log(updatedUser);
    }
    if (req.body.newPassword) {
      const passwordQuery = 'UPDATE users SET userPassword = ($1) WHERE users.userPassword = ($2)';
      await db.none(passwordQuery, [req.body.newPassword, req.session.user.userpassword]);
      // const updatedPass = await db.oneOrNone('SELECT DISTINCT * FROM users WHERE users.userPassword = ($1) LIMIT 1;', [req.body.newPassword])
      // console.log(updatedPass);
    }

    if (!(req.body.newUsername || req.body.newPassword)) {
      throw new Error('Please make changes before submitting.')
    } 

    res.render('pages/profile', {message: 'Profile successfully edited!'});
  } catch (err) {
    console.error('Error sending updated profile data', err);
    // res.status(400).json({ error: err.message});
    res.render('pages/profile', {error: true, message: err});
  }
});

// =========== /login Routes ===========
app.get('/login', async (req, res) => {
  res.render('pages/login');
});

app.post('/login', async(req, res) => {
  try {
    const password = req.body.password;
   
    const user = await db.oneOrNone('SELECT DISTINCT * FROM users WHERE users.userName = ($1) LIMIT 1;', [req.body.username])
    if (!user) { return res.redirect('/register'); }
    
    // check if password from request matches with password in DB
    const hash = await bcrypt.hash(user.userpassword, 10);
    const match = await bcrypt.compare(password, hash);

    if (!match) { 
      console.log('Passwords do not match.');
      throw new Error('Invalid username or password.'); 
    }

    req.session.user = user;
    req.session.save();
    res.redirect('/');
  } catch (err) {
    console.error('Login failed:', err);
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
    // const hash = await bcrypt.hash(req.body.password, 10);
    var userAdmin = true;

    if (!req.body.userAdmin) {
      userAdmin = false;
    }

    // Validation that user doesn't already exist in db
    const searchQuery = 'SELECT DISTINCT * FROM users WHERE users.userName = ($1)';
    const existingUser = await db.oneOrNone(searchQuery, [req.body.username]);

    if (!!existingUser) {
      console.log('User already exists in database.');
      throw new Error('Username taken. Please choose a different one.');
    }

    const insertQuery = 'INSERT INTO users(userName, userPassword, userAdmin) VALUES($1, $2, $3)';
    await db.none(insertQuery, [req.body.username, req.body.password, userAdmin]);

    res.redirect('/login');
  } catch (err) {
    console.error('Error during registration:', err);
    res.render('pages/register', {
      error: true,
      message: err
    });
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
    const saveQuery = `INSERT INTO events (eventName, building, eventDate, clubSponsor, roomNumber, eventDescription, startTime, endTime)
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

  const club = await db.one(`SELECT clubs.* FROM clubs 
    INNER JOIN events ON clubs.clubID = events.clubSponsor
    WHERE events.eventID = $1;`, [eventid]);

  // Fetch Comments
  const comments = await db.any(`
    SELECT * FROM comments
    WHERE eventid = $1
    ORDER BY created_at DESC;
  `, [eventid]);

  res.render('pages/events', { 
    event: formattedEvents[0],
    club: club,
    comments: comments
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

//!!! Currently not working, waiting to determine whether we need to change clubsponsor into a string as the current code treats it as such
// =========== Calendar/Events Route ===========        

//URL of the events calendar
const icsUrl = 'https://campusgroups.colorado.edu/ical/colorado/ical_colorado.ics';

//Fetch the event using the fetch library, then parse the info from the ICS file which is similar to tokenizing except that ICS files come with clear per line parameters for each item (Title, start, etc...)
async function fetchAndInsertICSEvents() {
  try {
    //Fetch the event info from the ICS link
    const response = await fetch(icsUrl);
    const icsData = await response.text();
    const events = ical.parseICS(icsData);

    //Limit the amount of events fetched and inserted to 30 days from now
    const now = new Date();
    const next30Days = new Date(now);
    next30Days.setDate(now.getDate() + 30);

    //Events is an object populated by multiple events differentiated by a 'key', thus iterate through all the events from 0<key<n 
    insertedCount = 0;
    for (const key in events) {
      const event = events[key];
      //The event file may contain other objects not of type 'event' which are irrelevant and we ignore
      if (event.type !== 'VEVENT') continue;

      //Only continue the loop within the time frame of events we want to add
      if (event.start < now || event.start > next30Days) continue;

      //Begin parsing
      let titleRaw = event.summary;
        const title =
          typeof titleRaw === 'string' //Check if it is a string or an object
            ? titleRaw.slice(0, 30)
            : typeof titleRaw?.val === 'string'
            ? titleRaw.val.slice(0, 30)
            : 'Untitled';
      const description = event.description || '';
      const eventDate = event.start.toISOString().slice(0, 10);      // 'YYYY-MM-DD'
      const startTime = event.start.toTimeString().slice(0, 8);      // 'HH:MM:SS'
      const endTime = event.end.toTimeString().slice(0, 8);          // 'HH:MM:SS'
      const organizerRaw = event.organizer || '';
      const clubSponsorName = typeof organizerRaw === 'string' //Check if it is a string or an object
          ? (organizerRaw.match(/CN="([^"]+)"/) || [])[1] || null //If it's a string manually parse out the values inside quotes -> the club name
          : organizerRaw?.params?.CN || null; //Otherwise if its an object, extract it as such, object of type CN

      //Values we cant access unless we are logged in are defaulted for now
      const defaultBuildingID = 1;
      const defaultRoom = 'TBD';

      //Log the events inserted for debugging
      console.log(`📅 Inserting event: "${title}" on ${eventDate} at ${startTime}`);
      
      //get clubid from clubs table
      const clubSponsor = await db.one(`
        SELECT
          COALESCE (
            (SELECT clubid FROM clubs WHERE clubName = $1 LIMIT 1),
            0
          ) as clubSponsorResult;
      `, [clubSponsorName]
      );
      //if club doesnt exist, insert club and get id
      if (clubSponsor['clubsponsorresult'] == 0) {
        await db.none(`
          INSERT INTO clubs (clubName, clubDescription, organizer) 
          VALUES ($1, 'TBD', 1);
          `, [clubSponsorName]
        );

        clubSponsorResult = await db.one(`
          SELECT clubId FROM clubs
          WHERE clubName = $1
          LIMIT 1;
          `, [clubSponsorName]
        );

        clubSponsor['clubsponsorresult'] = clubSponsorResult['clubid']
      }

      await db.none(`
        INSERT INTO events (
          eventName, building, eventDate, clubSponsor,
          roomNumber, eventDescription, startTime, endTime
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [
        title,
        defaultBuildingID,
        eventDate,
        clubSponsor['clubsponsorresult'],
        defaultRoom,
        description,
        startTime,
        endTime
      ]);

      insertedCount++;
    }

    console.log(insertedCount,' ICS events imported to DB.');
  } catch (error) {
    console.error('❌ Error importing ICS:', error);
  } 
}

//Run on server start
fetchAndInsertICSEvents();

// =========== /clubs Route ===========
app.get("/clubs", async(req, res) => {
  try{
    const categories = await db.any(`SELECT * FROM club_categories;`);

    const clubsByCategory = [];

    for (const category of categories) {
      const clubs = await db.any(`SELECT clubs.clubID, clubs.clubName, clubs.clubDescription
        FROM clubs 
        INNER JOIN club_categories ON clubs.category = club_categories.categoryID
         WHERE club_categories.categoryID = $1;`, [category.categoryid]);
      
      clubsByCategory.push({
        categoryid: category.categoryid,
        categoryname: category.categoryname,
        clubs: clubs
      });
    }
    // console.log(clubsByCategory);

    res.render('pages/clubs', {
      clubsByCategory: clubsByCategory,
    })
  }
  catch (err) {
    res.render('pages/clubs', {
      clubsByCategory: [],
      error: true,
      message: err.message
    })
  }
});

// =========== /club-details Route ===========
app.get("/club-details", async(req, res) => {
  try{
    const club = await db.one(`SELECT clubs.*, club_categories.categoryName as categoryName FROM clubs
      INNER JOIN club_categories ON clubs.category = club_categories.categoryID
      WHERE clubs.clubName = $1
      ORDER BY clubs.clubName ASC;`, [req.query.club]);
  
    const events = await db.any(`SELECT events.* FROM events 
      INNER JOIN clubs ON events.clubSponsor = clubs.clubID
      WHERE clubs.clubID = $1
      ORDER BY events.eventDate ASC, events.startTime ASC;`, [club.clubid]);

    const formattedEvents = events.map(events => {
      return {
        ...events,
        eventDateFormatted: format(new Date(events.eventdate), 'MMM d, yyyy'),
        startTimeFormatted: format(new Date(`1970-01-01T${events.starttime}`), 'h:mm a'),
        endTimeFormatted: format(new Date(`1970-01-01T${events.endtime}`), 'h:mm a'),
      };
    });

    const memberCount = await db.one(`SELECT COUNT(userID) FROM users_to_clubs WHERE clubID = $1;`, [club.clubID]);

    res.render('pages/club-details', {
      club: club,
      events: formattedEvents,
      memberCount: memberCount.count
    })
  }
  catch (err) {
    res.render('pages/club-details', {
      club: [],
      events: [],
      memberCount: '',
      error: true,
      message: err.message
    })
  }
});

// =========== /follow-club Route ===========
app.post("/follow-club", async(req, res) => {
  try {
    
  }
  catch (err) {
    res.render('pages/club-details', {
      club: [],
      events: [],
      memberCount: '',
      error: true,
      message: err.message
    })
  }
});

// =========== /clubs-by-category Route ===========
app.get("/clubs-by-category", async(req, res) => {
  try {
    const clubs = await db.any(`SELECT clubs.*, club_categories.categoryName as categoryName FROM clubs 
      INNER JOIN club_categories ON clubs.category = club_categories.categoryID
      WHERE clubs.category = $1;`, [req.query.categoryID]);
    console.log(clubs);
    
    res.render('pages/clubs-by-category', {
      category: req.query.category,
      clubs: clubs
    });
  }
  catch (err) {
    res.render('pages/clubs-by-category', {
      clubs: [],
      error: true,
      message: err.message
    });
  }
})

// ====================== Server Initialization ======================

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
});
