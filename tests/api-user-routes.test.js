const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));

describe('User Signup POST', () => {
  it('should respond with a 200 status code to verify server is functional', async () => {
    const response = await request(app).post('/api/v1/users/test-route').send();
    expect(response.statusCode).toBe(200);
  });

  it('should respond with a 201 status code', async () => {
    const response = await request(app).post('/api/v1/users/signup').send({
      email: 'new_user1234@gmail.com',
      name: 'New User',
      password: 'this_is_my_password',
      passwordConfirm: 'this_is_my_password',
    });
    expect(response.statusCode).toBe(201);
    // expect(response.body.data.user.email).toBe("new_user1234@gmail.com");
  });
});
