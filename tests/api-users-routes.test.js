const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const app = require(path.join(__dirname, '../app'));
const User = require(path.join(__dirname, '../models/userModel'));
const { error } = require('console');

const secondUser = {
  email: 'second_user@gmail.com',
  name: 'User Two',
  password: 'this_is_my_password',
  passwordConfirm: 'this_is_my_password',
};

const thirdUser = {
  email: 'third_user@hotmail.com',
  name: 'User Three',
  password: 'this_is_my_password',
  passwordConfirm: 'this_is_my_password',
};

const adminUser = {
  email: 'admin-users-routes@gmail.com',
  name: 'The Admin',
  password: 'this_is_my_password',
  passwordConfirm: 'this_is_my_password',
  role: 'admin',
};

describe('User Routes', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('/signup Admin User', () => {
    it('should create a user with admin privileges and return a 201 status code', async () => {
      const adminRes = await request(app).post('/api/v1/users/signup').send(adminUser).expect(201);

      adminUser._id = adminRes.body.data.newUser._id;
      adminUser.token = adminRes.body.data.token;
    });
  });

    describe('/signup POST', () => {
      it('should create a new user and return a 201 status code', async () => {
        // Create a second user with different attributes
        const res = await request(app).post('/api/v1/users/signup').send(secondUser).expect(201);

        expect(res.body.data.newUser.email).toBe('second_user@gmail.com');
        expect(res.body.data.newUser.name).toBe('User Two');
        expect(res.body.data.newUser.role).toBe('user');

        secondUser._id = res.body.data.newUser._id;
        secondUser.token = res.body.data.token;
        secondUser.role = res.body.data.newUser.role;
      });
    });

    describe('/logout User', () => {
      it('should clear the jwt cookie and respond with a 200 status code', async () => {
        const response = await request(app)
          .get('/api/v1/users/logout')
          .set('Cookie', `jwt=${adminUser.token}`);

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
          email: adminUser.email,
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBe('Token sent to email!');

        // Verify that the reset token is set in the database
        const updatedUser = await User.findById(adminUser._id);
        expect(updatedUser.passwordResetToken).toBeDefined();
        expect(updatedUser.passwordResetExpires).toBeDefined();
      });
    });

    describe('/updatePassword User', () => {
      it('should update the user password to a new password and return a 200 status code', async () => {
        const newPassword = 'new_password_1234';
        const updatePasswordResponse = await request(app)
          .patch('/api/v1/users/updatePassword')
          .send({
            passwordCurrent: secondUser.password,
            password: newPassword,
            passwordConfirm: newPassword,
          })
          .set('Authorization', `Bearer ${secondUser.token}`);

        secondUser.password = newPassword;
        expect(updatePasswordResponse.statusCode).toBe(200);
      });
    });

    describe('/login POST', () => {
      it('should log in the created user and return a JWT token', async () => {
        const loginResponse = await request(app).post('/api/v1/users/login').send({
          email: secondUser.email,
          password: secondUser.password,
        });

        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body.data.user.email).toBe(secondUser.email);
        expect(loginResponse.body.data).toHaveProperty('token');

        // Store the JWT token for later use
        secondUser.token = loginResponse.body.data.token;
      });
    });

    describe('/me GET', () => {
      it('should get information on the currently logged in user and respond with a 200 status code', async () => {
        const loginResponse = await request(app)
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${secondUser.token}`);

        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body.data._id).toBe(secondUser._id);
        expect(loginResponse.body.data.name).toBe(secondUser.name);
        expect(loginResponse.body.data.email).toBe(secondUser.email);
      });
    });

    describe('/updateMe PATCH', () => {
      it("should update the current user's name and return a 200 status code", async () => {
        const newName = 'David';
        const updateMeResponse = await request(app)
          .patch('/api/v1/users/updateMe')
          .send({
            name: newName,
          })
          .set('Authorization', `Bearer ${secondUser.token}`);

        secondUser.name = newName;
        expect(updateMeResponse.statusCode).toBe(200);
        expect(updateMeResponse.body.data.name).toBe('David');
      });
    });

    describe('/ GET all Users', () => {
      it('should retrieve all users in the DB', async () => {
        const res = await request(app)
          .get('/api/v1/users/')
          .set('Authorization', `Bearer ${adminUser.token}`);

        const expectedUsers = [secondUser, adminUser];

        expect(res.statusCode).toBe(200);
        expect(res.body.data.results).toBeGreaterThanOrEqual(2);
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
          .get(`/api/v1/users/${secondUser._id}`)
          .set('Authorization', `Bearer ${adminUser.token}`);

        expect(lookupResponse.statusCode).toBe(200);
        expect(lookupResponse.body.data.name).toBe(secondUser.name);
        expect(lookupResponse.body.data.email).toBe(secondUser.email);
        expect(lookupResponse.body.data.role).toBe(secondUser.role);
      });
    });

    describe('/:id PATCH User', () => {
      it("should update the user's email and return the updated user", async () => {
        const newEmail = 'david@gmail.com';
        const res = await request(app)
          .patch(`/api/v1/users/${secondUser._id}`)
          .send({
            email: newEmail,
          })
          .set('Authorization', `Bearer ${adminUser.token}`);

        secondUser.email = newEmail;
        expect(res.statusCode).toBe(200);
        expect(res.body.data._id).toBe(secondUser._id);
        expect(res.body.data.email).toBe(newEmail);
      });
    });

    describe('/:id DELETE User', () => {
      it('should delete the user by id', async () => {
        const createRes = await request(app).post('/api/v1/users/signup').send(thirdUser).expect(201);

        thirdUser._id = createRes.body.data.newUser._id;

        const deleteRes = await request(app)
          .delete(`/api/v1/users/${thirdUser._id}`)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .expect(204);

        const lookupRes = await request(app)
          .get(`/api/v1/users/${thirdUser._id}`)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .expect(404);
      });
    });

    describe('/deleteMe DELETE', () => {
      it('should set the current user to active=false and respond with a 200 status code', async () => {
        const res = await request(app)
          .delete('/api/v1/users/deleteMe')
          .set('Authorization', `Bearer ${secondUser.token}`)
          .expect(204);

        const lookupRes = await request(app)
          .get(`/api/v1/users/${secondUser._id}`)
          .set('Authorization', `Bearer ${adminUser.token}`)
          .expect(404);
      });
    });
});
