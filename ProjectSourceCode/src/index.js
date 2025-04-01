/**************************************************** DEPENDENCIES ****************************************************/

const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');


/**************************************************** HANDLEBARS CONFIG ****************************************************/
//configuration borrowed from previous lab and altered by Julia

//configure handlebars partials
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Register hbs view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'resources')));


/**************************************************** DB CONFIG + CONNECT ****************************************************/

// database configuration taken from previous lab
// const dbConfig = {
//   host: 'db', // the database server
//   port: 5432, // the database port
//   database: process.env.POSTGRES_DB, // the database name
//   user: process.env.POSTGRES_USER, // the user account to connect with
//   password: process.env.POSTGRES_PASSWORD, // the password of the user account
// };

// const db = pgp(dbConfig);

// // test your database
// db.connect()
//   .then(obj => {
//     console.log('Database connection successful'); // you can view this message in the docker compose logs
//     obj.done(); // success, release the connection;
//   })
//   .catch(error => {
//     console.log('ERROR:', error.message || error);
//   });

/**************************************************** PAGES ****************************************************/

//Render the homepage -- Julia
app.get('/', (req, res) => {
  res.render('pages/home')
})

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
})