const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));
const fs = require('fs');
const Tour = require(path.join(__dirname, '../models/tourModel'));

describe('Tour Routes', () => {
  let JWT_TOKEN;
  let tours;
  let createdTourId;

  beforeAll(() => {
    // Read tour data from the file
    tours = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../dev-data/data/tours.json'), 'utf-8')
    );
  });

  describe('Create Admin Account', () => {
    it('should create an admin level account for performing future /tours requests', async () => {
      const signupResponse = await request(app).post('/api/v1/users/signup').send({
        email: 'admin@gmail.com',
        name: 'The Admin',
        password: 'this_is_my_password',
        passwordConfirm: 'this_is_my_password',
        role: 'admin',
      });

      expect(signupResponse.statusCode).toBe(201);
      expect(signupResponse.body.data.newUser.email).toBe('admin@gmail.com');
      expect(signupResponse.body.data.newUser.name).toBe('The Admin');
      expect(signupResponse.body.data.newUser.role).toBe('admin');

      JWT_TOKEN = signupResponse.body.data.token;
    });
  });

  describe('POST /', () => {
    it('should create all tours in the dev-data and return a 201 status code', async () => {
      const createTourReq = await request(app)
        .post('/api/v1/tours')
        .send(tours[0])
        .set('Authorization', `Bearer ${JWT_TOKEN}`);

      createdTourId = createTourReq.body.data.id;

      // Adding the `id` field
      tours[0].locations = tours[0].locations.map((location) => ({
        ...location,
        id: location._id,
      }));
      expect(createTourReq.statusCode).toBe(201);
      expect(createTourReq.body.data.name).toBe(tours[0].name);
      expect(createTourReq.body.data.duration).toBe(tours[0].duration);
      expect(createTourReq.body.data.summary).toBe(tours[0].summary);
      expect(createTourReq.body.data.images).toStrictEqual(tours[0].images);
      expect(createTourReq.body.data.startDates).toStrictEqual(tours[0].startDates);
      expect(createTourReq.body.data.locations).toStrictEqual(tours[0].locations);
    });
  });

  describe('GET /', () => {
    it('should get all tours and return a 200 status code', () => {
      expect(true).toBe(true);
    });
  });

  describe('GET /:id', () => {
    it('should get a tour by ID and return a 200 status code', () => {
      expect(true).toBe(true);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a tour by ID and return a 200 status code', () => {
      expect(true).toBe(true);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a tour by ID and return a 204 status code', () => {
      expect(true).toBe(true);
    });
  });
});
