// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

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

// API: /add_user
// Expect: res.status == 200 and res.body.message == 'Success'
// Result: This test case should pass and return a status 200 along with a "Success" message.
// Explanation: The testcase will call the /login API with the following input
// and expects the API to return a status of 200 along with the "Success" message.
describe('Testing Login API', () => {
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
});
// ********************************************************************************