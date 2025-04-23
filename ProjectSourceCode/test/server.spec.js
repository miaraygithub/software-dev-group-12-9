// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);

//=== Positive and Negative test cases for register ===

describe('Testing User Registration', () => {
  it('reg.1: positive (no admin): /register redirects to /login', done => {
    chai
      .request(server)
      .post('/register')
      .redirects(0)
      .send({
        username: 'test_user_1',
        password: 'test_password',
        useradmin: false
      })
      .end((err, res) => {
        res.should.have.status(302);
        res.should.redirectTo('/login');
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('reg.2: positive (organizer, existing club): /register redirects to /login', done => {
    chai
      .request(server)
      .post('/register')
      .redirects(0)
      .send({
        username: 'test_user_2',
        password: 'test_password',
        useradmin: true,
        forclub: 'Club1',
        createclub: false
      })
      .end((err, res) => {
        res.should.have.status(302);
        res.should.redirectTo('/login');
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('reg.3: positive (organizer, new club): /register redirects to /login', done => {
    chai
      .request(server)
      .post('/register')
      .redirects(0)
      .send({
        username: 'test_user_3',
        password: 'test_password',
        useradmin: true,
        forclub: 'NOT A CLUB AT CU BOULDER',
        createclub: true
      })
      .end((err, res) => {
        res.should.have.status(302);
        res.should.redirectTo('/login');
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('reg.4: negative (existing username) : /register renders pages/register with 400', done => {
    chai
      .request(server)
      .post('/register')
      .send({
        username: 'Default Organizer 1',
        password: 'test_password',
        useradmin: false
      })
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.html;
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('reg.5: negative (admin, no matching club name, no new club) : /register renders pages/register with 400', done => {
    chai
      .request(server)
      .post('/register')
      .send({
        username: 'test_user_5',
        password: 'test_password',
        useradmin: true,
        forclub: 'a;sldkjfa;lskdjf',
        createclub: false
      })
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.html;
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

//Negative test case for login route
describe('Testing User Login', () => {
  it('log.1: positive : /login redirects to /', done => {
    chai
      .request(server)
      .post('/login')
      .redirects(0)
      .send({username: 'Default Organizer 1', password: '123'})
      .end((err, res) => {
        res.should.have.status(302);
        res.should.redirectTo('/');
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('log.2: negative (no user): /login redirects to /register', done => {
    chai
      .request(server)
      .post('/login')
      .redirects(0)
      .send({ username: 'dont name a user this', password: 'test_password' })
      .end((err, res) => {
        res.should.have.status(302);
        res.should.redirectTo('/register');
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('negative (wrong password): /login renders /login with error message', done => {
    chai
      .request(server)
      .post('/login')
      .send({ username: 'Default Organizer 1', password: 'wrong' })
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.html;
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });
});


//endpoint testing for New Events
describe('Testing New Events', () => {
  it('positive : /save-event redirects to /', done => {
    chai
      .request(server)
      .post('/save-event')
      .redirects(0)
      .send({
        event_name: 'TestEvent', 
        event_building: 1,
        event_room_number: '100',
        event_date: '2025-12-31',
        event_start_time: '12:00',
        event_end_time: '12:30',
        event_club: 1,
        event_description: 'Test Event Description'
      })
      .end((err, res) => {
        res.should.have.status(302);
        res.should.redirectTo('/');
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('negative (wrong building format): /save-event renders pages/home with error message', done => {
    chai
      .request(server)
      .post('/save-event')
      .send({
        event_name: 'TestEvent', 
        event_building: 'Stearns West',
        event_room_number: '100',
        event_date: '2025-12-31',
        event_start_time: '12:00',
        event_end_time: '12:30',
        event_club: 1,
        event_description: 'Test Event Description'
      })
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.html;
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('negative (wrong club format): /save-event renders pages/home with error message', done => {
    chai
      .request(server)
      .post('/save-event')
      .send({
        event_name: 'TestEvent', 
        event_building: 1,
        event_room_number: '100',
        event_date: '2025-12-31',
        event_start_time: '12:00',
        event_end_time: '12:30',
        event_club: 'Residents Life',
        event_description: 'Test Event Description'
      })
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.html;
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });

  it('negative (missing info): /save-event renders pages/home with error message', done => {
    chai
      .request(server)
      .post('/save-event')
      .send({
        event_name: 'TestEvent', 
        event_building: 1,
        event_room_number: '100',
        event_date: '',
        event_start_time: '12:00',
        event_end_time: '12:30',
        event_club: 1,
        event_description: 'Test Event Description'
      })
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.html;
        done();
      });
      console.log('===================================================')
      console.log('===================================================')
      console.log('===================================================')
  });
});



// ********************************************************************************