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
const fs = require('fs'); 
const multer = require('multer');

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Create uploads directory if it doesn't exist
//const uploadDir = path.join(__dirname, 'uploads');
// Use Render's writable temp dir if in production, otherwise default to /app/uploads
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/tmp/uploads'
  : '/app/uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at', uploadDir);
}

// const uploadDir = '/app/uploads';
// if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//   console.log('Created uploads directory');
// }

// Configure storage

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
  //cb(null, 'uploads/'); // Destination folder
  cb(null, uploadDir);
 },
 
  filename: function(req, file, cb) {
  // Create unique filename with original extension
    cb(null, Date.now() + '-' + file.originalname);
  }
});
 
//  // Set up file filter if you want to restrict file types
//  const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Not an image! Please upload only images.'), false);
//   }
//  };
 
 // Initialize upload middleware
const upload = multer({
  storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
    },
  //fileFilter: fileFilter
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use('/js', express.static(__dirname + '/src/resources/js'));
app.use('/js', express.static(path.join(__dirname, 'resources', 'js')));
app.use('/css', express.static(path.join(__dirname, 'resources', 'css')));
app.use(bodyParser.json());
// This allows serving static files from the uploads directory
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(uploadDir));
console.log(path.join(__dirname, 'uploads'));

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
  host: process.env.POSTGRES_HOST,
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
      ORDER BY "eventdate" ASC, "starttime" ASC
      LIMIT 50;
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

    req.session.login = !!req.session.user;
    req.session.events = formattedEvents;
    req.session.geoEvents = JSON.stringify(geoEvents);
    req.session.buildings = buildings;
    req.session.save;

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
app.get('/editProfile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/editProfile', {login: !!req.session.user});
}); 

app.post('/editProfile', upload.single('profilePic'), async(req, res) => {
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
      const passwordQuery = 'UPDATE users SET userPassword = ($1) WHERE users.userName = ($2)';
      await db.none(passwordQuery, [req.body.newPassword, req.session.user.username]);
      // const updatedPass = await db.oneOrNone('SELECT DISTINCT * FROM users WHERE users.userPassword = ($1) LIMIT 1;', [req.body.newPassword])
      // console.log(updatedPass);
    }

    if (req.file) {
      console.log(req.file);
      const filePath = `/uploads/${req.file.filename}`;
      console.log(filePath);
      if (req.session.user.profilepic) {
        const newPicQuery = 'UPDATE users SET profilePic = ($1) WHERE users.userName = ($2)';
        try {
          await db.none(newPicQuery, [filePath, req.session.user.username]);

          req.session.user.profilepic = filePath;

          const updatedPic = await db.oneOrNone('SELECT DISTINCT * FROM users WHERE users.userName = ($1) LIMIT 1;', [req.session.user.username]);
          console.log(updatedPic);
        } catch (dbErr) {
          console.error('Database error:', dbErr);
          res.render('pages/editProfile', {error: true, message: dbErr});
        }
      }
      // const picQuery = 'INSERT INTO users (profilePic) VALUES ($1)';
      // try {
      //   await db.none(picQuery, [req.body.profilePic]);
      // } catch (dbErr) {
      //   console.error('Database error:', dbErr);
      //   res.render('pages/editProfile', {error: true, message: dbErr});
      // }
      
    }

    if (!(req.body.newUsername || req.body.newPassword || req.file)) {
      throw new Error('Please make changes before submitting.')
    } 

    res.render('pages/profile', {
      login: !!req.session.user,
      message: 'Profile successfully edited!'
    });
  } catch (err) {
    console.error('Error sending updated profile data', err);
    // res.status(400).json({ error: err.message});
    res.render('pages/editProfile', {login: !!req.session.user, error: true, message: err});
  }
});

app.get('/profile', (req, res) => {
  res.render('pages/profile', {login: !!req.session.user});
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
    console.error('Error Saving Event:', err);
    // res.status(400).json({ error: err.message});
    res.render('pages/home', {
      error: true,
      message: err,
      login: req.session.login,
      events: req.session.events,
      geoEvents: req.session.geoEvents,
      buildings: req.session.buildings
    });
  }
})


// =========== /eventDetails Route ===========
app.get('/event-details', async (req, res) => {
  const eventid = req.query.eventID;
  try {
    const events = await db.any(`
        SELECT events.eventID as eventid, events.eventName as eventname, locations.buildingName as building, events.eventDate as eventdate, clubs.clubName as clubsponser, events.roomNumber as roomnumber, events.eventDescription as eventdescription, events.startTime as starttime, events.endTime as endtime
        FROM events
        INNER JOIN locations ON events.building = locations.locationID
        INNER JOIN clubs ON events.clubSponser = clubs.clubID
        WHERE eventid = $1
        LIMIT 1;
    `, [eventid]);

    const formattedEvents = events.map(events => {
      return {
        ...events,
        eventDateFormatted: format(new Date(events.eventdate), 'MMM d, yyyy'),
        startTimeFormatted: format(new Date(`1970-01-01T${events.starttime}`), 'h:mm a'),
        endTimeFormatted: format(new Date(`1970-01-01T${events.endtime}`), 'h:mm a'),
      };
    });

    const rsvp = await db.any(`
      SELECT users.userName  as name
      FROM users
      INNER JOIN rsvp ON rsvp.userID = users.userID
      WHERE rsvp.eventID = $1;
      `, [eventid]);

    // Fetch Comments
    const comments = await db.any(`
      SELECT * FROM comments
      WHERE eventid = $1
      ORDER BY created_at DESC;
    `, [eventid]);

    res.render('pages/events', {
      comments,
      user: !!req.session.user,
      event: formattedEvents[0],
      rsvpList: rsvp,
    })
  } catch (err) {
    console.log('error saving events', err);
    res.render('pages/home', {
      error: true,
      message: err,
      login: req.session.login,
      events: req.session.events,
      geoEvents: req.session.geoEvents,
      buildings: req.session.buildings,
    });
  }
})



//For handling the redirect/reload once the user posts a comment
app.get('/event/:id', async (req, res) => {
  const eventid = req.params.id;
  try {
    const events = await db.any(`
      SELECT events.eventID as eventid, events.eventName as eventname, locations.buildingName as building, events.eventDate as eventdate, clubs.clubName as clubsponser, events.roomNumber as roomnumber, events.eventDescription as eventdescription, events.startTime as starttime, events.endTime as endtime
      FROM events
      INNER JOIN locations ON events.building = locations.locationID
      INNER JOIN clubs ON events.clubSponser = clubs.clubID
      WHERE eventid = $1
      LIMIT 1;
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

    const rsvp = await db.any(`
      SELECT users.userName  as name
      FROM users
      INNER JOIN rsvp ON rsvp.userID = users.userID
      WHERE rsvp.eventID = $1;
      `, [eventid]);

    res.render('pages/events', {
      event: formattedEvents[0],
      comments,
      rsvpList: rsvp
    });
  } catch (err) {
    console.log('Error Reloading Event Page', err);
    res.render('pages/home', {
      error: true,
      message: err,
      login: req.session.login,
      events: req.session.events,
      geoEvents: req.session.geoEvents,
      buildings: req.session.buildings,
    });
  }
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
    res.render('pages/home', {
      error: true,
      message: err,
      login: req.session.login,
      events: req.session.events,
      geoEvents: req.session.geoEvents,
      buildings: req.session.buildings,
    });
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
      login: !!req.session.user,
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

// =========== /rsvp Route ===========
app.post("/rsvp", async (req, res) => {
  try {
    if (!req.session.user) {
      console.log('Not Logged In.');
      throw new Error('Please Login Before RSVPing.');
    }

    const userid = req.session.user.userid;
    const eventid = req.body.eventId;
    await db.none(`
      INSERT INTO rsvp (eventID, userID) 
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;`,[eventid, userid]
    );
    res.redirect(`/event/${eventid}`);
  } catch (err) {
    console.error('Error during rsvp:', err);
    res.render('pages/login', {
      error: true,
      message: err,
    });
  }
})

// =========== Calendar/Events Route ===========        

//URL of the events calendar
const icsUrl = 'https://campusgroups.colorado.edu/ical/colorado/ical_colorado.ics';

//Fetch the event using the fetch library, then parse the info from the ICS file which is similar to tokenizing except that ICS files come with clear per line parameters for each item (Title, start, etc...)
async function fetchAndInsertICSEvents() {
  try {
    let insertedCount = 0;

    //Fetch the event info from the ICS link
    const response = await fetch(icsUrl);
    const icsData = await response.text();
    const events = ical.parseICS(icsData);


    //Limit the amount of events fetched and inserted to 30 days from now
    const now = new Date();
    const nextXDays = new Date(now);
    nextXDays.setDate(now.getDate() + 30);

    //Events is an object populated by multiple events differentiated by a 'key', thus iterate through all the events from 0<key<n 
    insertedCount = 0;
    for (const key in events) {
      try {
        const event = events[key];
        //The event file may contain other objects not of type 'event' which are irrelevant and we ignore
        if (event.type !== 'VEVENT') continue;

        //Only continue the loop within the time frame of events we want to add
        if (event.start < now || event.start > nextXDays) continue;

        //--Begin parsing--
        let titleRaw = event.summary;
          const title =
            typeof titleRaw === 'string' //Check if it is a string or an object
              ? titleRaw.slice(0, 30)
              : typeof titleRaw?.val === 'string'
              ? titleRaw.val.slice(0, 30)
              : 'Untitled';

        const description = event.description || '';
        const eventDate = event.start.toISOString().slice(0, 10);
        const startTime = event.start.toTimeString().slice(0, 8);
        const endTime = event.end.toTimeString().slice(0, 8);

        const organizerRaw = event.organizer || '';
        const clubName = typeof organizerRaw === 'string' //Check if it is a string or an object
            ? (organizerRaw.match(/CN="([^"]+)"/) || [])[1] || null //If it's a string manually parse out the values inside quotes -> the club name
            : organizerRaw?.params?.CN || null; //Otherwise if its an object, extract it as such, object of type CN
        
        const tempClubId = await getClubId(clubName);
        const clubID = tempClubId != null ? tempClubId : null;

        const categoriesList = parseCategories(event.categories);
        //const chosenCategoryID = await pickCategory(categoriesList);

        //Values we cant access unless we are logged in are defaulted for now
        const defaultRoom = 'TBD';
        //--end Parsing--

        //Check For duplicates before inserting
        const duplicate = await db.oneOrNone(
          `SELECT 1
          FROM events
          WHERE eventname = $1
            AND eventdate = $2
            AND starttime = $3
            AND endtime   = $4
          LIMIT 1`,
          [title, eventDate, startTime, endTime]
        );
        
        if (duplicate){
          console.log("❌ Duplicate event. Skipping.")
          continue;
        }  //Skip if there is a match

        //Debbugging
        console.log(`📅 Event inserted: ${title} at: ${eventDate} with description 🔭: ${description}`);
        const detectedBuilding = await detectBuilding(description);
        console.log("♦️Detected building:", detectedBuilding);
        const buildingID = detectedBuilding || 1


        await db.none(`
          INSERT INTO events (
            eventName, building, eventDate, clubSponser,
            roomNumber, eventDescription, startTime, endTime
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          title,
          buildingID,
          eventDate,
          clubID,
          defaultRoom,
          description,
          startTime,
          endTime
        ]);

        //Insert into categories list?

        insertedCount++;
      } catch (eventError) {
        console.error('⚠️ Skipping event due to error:', eventError.message);
      }
    }
    console.log(insertedCount, '✅ICS events imported to DB.');
  } catch (error) {
    console.error('❌Error importing ICS:', error);
  } 
}

//--Helper fxns--

//Find the club ID by club Name and return it
async function getClubId(clubName) {
  if (!clubName) return null; //If there is no name

  //Try to find the club by name
  const foundClub = await db.oneOrNone(
    'SELECT clubID FROM clubs WHERE clubName = $1',
    [clubName]
  );

  if (foundClub) { //If a club was found return it's id
    return foundClub.clubid;
  } else { //If it wasn't create the club
    const insertedClub = await db.one(
      `INSERT INTO clubs (clubName, clubDescription, organizer)
       VALUES ($1, $2, $3)
       RETURNING clubID`,
      [
        clubName,
        'ICS feed club',
        1    //Change this if we implement user created club tracking
      ]
    );
    return insertedClub.clubid;
  }
}

//Tokenize categories and return them in an array
function parseCategories(categoriesRaw) {
  //If there were no categories assigned return an empty array
  if (!categoriesRaw) return [];

  categoriesRaw.map(c => c.trim()) //Get rid of spaces
  categoriesRaw.filter(Boolean); //Get rid of empty categories

  return categoriesRaw //Return the array
}

//Select a category from matchin categories in our DB or assign a random one
async function pickCategory(categoriesList) {
  //Loop through the entries in the categories array
  for (const i of categoriesList) {
    const foundCategory = await db.oneOrNone(
      'SELECT categoryID FROM categories WHERE categoryName = $1',
      [i]
    );
    if (foundCategory) return foundCategory.categoryid; //Return the first match
  }

  //If the array was emtpy or there were no matches return a random category
  const randomCategory = await db.one(
    'SELECT categoryID FROM categories ORDER BY RANDOM() LIMIT 1'
  );
  return randomCategory.categoryid;
}

async function detectBuilding(rawDescription) {
  let row = await db.oneOrNone(
    `
    SELECT l.locationID
    FROM   building_aliases a
    JOIN   locations       l ON a.buildingID = l.locationID
    WHERE  similarity(lower(a.alias), lower($1)) > 0.01   -- tweak cutoff
    ORDER  BY similarity(lower(a.alias), lower($1)) DESC
    LIMIT  1
    `,
    [rawDescription]
  );
  if (row) return row.locationid;

  // 2. Fallback: direct match on buildingName -----------------
  row = await db.oneOrNone(
    `
    SELECT locationID
    FROM   locations
    WHERE  similarity(lower(buildingName), lower($1)) > 0.01
    ORDER  BY similarity(lower(buildingName), lower($1)) DESC
    LIMIT  1
    `,
    [rawDescription]
  );
  return row?.locationid ?? null;
}


//--End of Helpers--

//Run on server start
fetchAndInsertICSEvents();

// ====================== Server Initialization ======================

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
});
