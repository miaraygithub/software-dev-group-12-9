// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;


// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

//Negative test case for login route
describe('Login negative test', () => {
  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'DevOrg1', password: '123'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  it('Test for if POST request correctly fails when invalid login is entered or no user is found', done => {
    chai
      .request(server)
      .post('/login')
      .set('Accept', 'application/json')
      .send({ username: 'wrong', password: 'wrong' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message');
        done();
      });
  });
});

//=== Positive and Negative test cases for register ===

describe('Testing User Registration', () => {
  it('positive : /register creates new user', done => {
    chai
      .request(server)
      .post('/register')
      .type('form')
      .send({
        username: 'test_user',
        password: 'securePass123!',
        useradmin: false
      })
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res).to.have.status(200); // Or 302 depending on redirect
        done();
      });
  });

  it('negative : /register with numeric username should return 400', done => {
    chai
      .request(server)
      .post('/register')
      .type('form')
      .send({
        username: 12345, // Invalid input: number instead of string
        password: 'password123',
        useradmin: false
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equal('Invalid input');
        done();
      });
  });
});
// ********************************************************************************