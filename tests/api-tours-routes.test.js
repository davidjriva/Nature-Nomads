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
    it('should create all tours in the dev-data and return a 201 status code for each', async () => {
      const reqs = tours.map(async (tour) => {
        // Make the POST request
        const createReq = await request(app)
          .post('/api/v1/tours')
          .send(tour)
          .set('Authorization', `Bearer ${JWT_TOKEN}`);

        const updatedTour = {
          ...tour,
          locations: tour.locations.map((location) => ({
            ...location,
            id: location._id,
            description: location.description.replace('&', '&amp;'),
          })),
        };

        return { createReq, updatedTour };
      });

      const results = await Promise.all(reqs);

      results.forEach(({ createReq, updatedTour }) => {
        expect(createReq.statusCode).toBe(201);
        expect(createReq.body.data.name).toBe(updatedTour.name);
        expect(createReq.body.data.duration).toBe(updatedTour.duration);
        expect(createReq.body.data.summary).toBe(updatedTour.summary);
        expect(createReq.body.data.images).toStrictEqual(updatedTour.images);
        expect(createReq.body.data.startDates).toStrictEqual(updatedTour.startDates);
        expect(createReq.body.data.locations).toStrictEqual(updatedTour.locations);
      });
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
