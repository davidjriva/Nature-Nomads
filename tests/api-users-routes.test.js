const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));
const User = require(path.join(__dirname, '../models/userModel'));

describe('User Routes', () => {
  let JWT_TOKEN;
  let userId;
  let secondUserId;

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
      JWT_TOKEN = signupResponse.body.data.token;

      // Create a second user with different attributes
      const res = await request(app).post('/api/v1/users/signup').send({
        email: 'second_user@gmail.com',
        name: 'User Two',
        password: 'this_is_my_password',
        passwordConfirm: 'this_is_my_password',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.newUser.email).toBe('second_user@gmail.com');
      expect(res.body.data.newUser.name).toBe('User Two');
      expect(res.body.data.newUser.role).toBe('user');

      secondUserId = res.body.data.newUser._id;
    });
  });

  describe('/logout User', () => {
    it('should clear the jwt cookie and respond with a 200 status code', async () => {
      const response = await request(app)
        .get('/api/v1/users/logout')
        .set('Cookie', `jwt=${JWT_TOKEN}`);

      // Check that the response status code is 200
      expect(response.statusCode).toBe(200);

      // Check that the cookie has been cleared
      expect(response.headers['set-cookie'][0]).toMatch(/jwt=;/);
    });
  });

  describe('User forgot password POST', () => {
    it('should return a 404 status code if the email is not found', async () => {
      const response = await request(app).post('/api/v1/users/forgotPassword').send({
        email: 'undefined_email@gmail.com',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return a 200 status code and send a password reset token if the email exists', async () => {
      const response = await request(app).post('/api/v1/users/forgotPassword').send({
        email: 'new_user1234@gmail.com',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBe('Token sent to email!');

      // Verify that the reset token is set in the database
      const updatedUser = await User.findById(userId);
      expect(updatedUser.passwordResetToken).toBeDefined();
      expect(updatedUser.passwordResetExpires).toBeDefined();
    });
  });

  describe('/updatePassword User', () => {
    it('should update the user password to a new password and return a 200 status code', async () => {
      const updatePasswordResponse = await request(app)
        .patch('/api/v1/users/updatePassword')
        .send({
          passwordCurrent: 'this_is_my_password',
          password: 'new_password_1234',
          passwordConfirm: 'new_password_1234',
        })
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      expect(updatePasswordResponse.statusCode).toBe(200);
    });
  });

  describe('/login POST', () => {
    it('should log in the created user and return a JWT token', async () => {
      const loginResponse = await request(app).post('/api/v1/users/login').send({
        email: 'new_user1234@gmail.com',
        password: 'new_password_1234',
      });

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body.data.user.email).toBe('new_user1234@gmail.com');
      expect(loginResponse.body.data).toHaveProperty('token');

      // Store the JWT token for later use
      JWT_TOKEN = loginResponse.body.data.token;
    });
  });

  describe('/me GET', () => {
    it('should get information on the currently logged in user and respond with a 200 status code', async () => {
      const loginResponse = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body.data._id).toBe(userId);
      expect(loginResponse.body.data.name).toBe('New User');
      expect(loginResponse.body.data.email).toBe('new_user1234@gmail.com');
    });
  });

  describe('/updateMe PATCH', () => {
    it("should update the current user's name and return a 200 status code", async () => {
      const updateMeResponse = await request(app)
        .patch('/api/v1/users/updateMe')
        .send({
          name: 'David',
        })
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      expect(updateMeResponse.statusCode).toBe(200);
      expect(updateMeResponse.body.data.name).toBe('David');
    });
  });

  describe('/ GET all Users', () => {
    it('should retrieve all users in the DB', async () => {
      const res = await request(app)
        .get('/api/v1/users/')
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      const expectedUsers = [
        {
          name: 'David',
          email: 'new_user1234@gmail.com',
          role: 'admin',
        },
        {
          name: 'User Two',
          email: 'second_user@gmail.com',
          role: 'user',
        },
      ];

      expect(res.statusCode).toBe(200);
      expect(res.body.data.results.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.docs).toEqual(
        expect.arrayContaining(
          expectedUsers.map((user) =>
            expect.objectContaining({
              name: user.name,
              email: user.email,
              role: user.role,
            })
          )
        )
      );
    });
  });

  describe('/:id GET User', () => {
    it('should retrieve the user from the database using the JWT token', async () => {
      const lookupResponse = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      expect(lookupResponse.statusCode).toBe(200);
      expect(lookupResponse.body.data.name).toBe('David');
      expect(lookupResponse.body.data.email).toBe('new_user1234@gmail.com');
      expect(lookupResponse.body.data.role).toBe('admin');
    });
  });

  describe('/:id PATCH User', () => {
    it("should update the user's email and return the updated user", async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${userId}`)
        .send({
          email: 'david@gmail.com',
        })
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(userId);
      expect(res.body.data.email).toBe('david@gmail.com');
    });
  });

  describe('/:id DELETE User', () => {
    it('should delete the user by id', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${secondUserId}`)
        .set('Authorization', `Bearer ${JWT_TOKEN}`);
      expect(res.statusCode).toBe(204);

      const lookupRes = await request(app)
        .get(`/api/v1/users/${secondUserId}`)
        .set('Authorization', `Bearer ${JWT_TOKEN}`);
      expect(lookupRes.statusCode).toBe(404);
    });
  });

  describe('/deleteMe DELETE', () => {
    it('should set the current user to active=false and respond with a 200 status code', async () => {
      const res = await request(app)
        .delete('/api/v1/users/deleteMe')
        .set('Authorization', `Bearer ${JWT_TOKEN}`);
      expect(res.statusCode).toBe(204);

      const lookupRes = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${JWT_TOKEN}`);
      expect(lookupRes.statusCode).toBe(404);
    });
  });
});
