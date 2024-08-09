const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));

describe('User /signup POST', () => {
  let JWT_TOKEN;
  let userId;

  describe('/signup POST', () => {
    it('should create a new user and return a 201 status code', async () => {
      const signupResponse = await request(app).post('/api/v1/users/signup').send({
        email: 'new_user1234@gmail.com',
        name: 'New User',
        password: 'this_is_my_password',
        passwordConfirm: 'this_is_my_password',
        role: 'admin',
      });

      expect(signupResponse.statusCode).toBe(201);
      expect(signupResponse.body.data.newUser.email).toBe('new_user1234@gmail.com');
      expect(signupResponse.body.data.newUser.name).toBe('New User');
      expect(signupResponse.body.data.newUser.role).toBe('admin');

      // Store for use in later tests
      userId = signupResponse.body.data.newUser._id;
    });
  });

  describe('/login POST', () => {
    it('should log in the created user and return a JWT token', async () => {
      const loginResponse = await request(app).post('/api/v1/users/login').send({
        email: 'new_user1234@gmail.com',
        password: 'this_is_my_password',
      });

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body.data.user.email).toBe('new_user1234@gmail.com');
      expect(loginResponse.body.data).toHaveProperty('token');

      // Store the JWT token for later use
      JWT_TOKEN = loginResponse.body.data.token;
    });
  });

  describe('/get User', () => {
    it('should retrieve the user from the database using the JWT token', async () => {
      const lookupResponse = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      expect(lookupResponse.statusCode).toBe(200);
      expect(lookupResponse.body.data.name).toBe('New User');
      expect(lookupResponse.body.data.email).toBe('new_user1234@gmail.com');
      expect(lookupResponse.body.data.role).toBe('admin');
    });
  });
});
