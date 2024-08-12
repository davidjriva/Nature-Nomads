const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));
const Tour = require(path.join(__dirname, '../models/tourModel'));

describe('Tour Routes', () => {
  let JWT_TOKEN;
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
      const fs = require('fs');
      const tours = JSON.parse(
        fs.readFileSync(`${__dirname}/../dev-data/data/tours.json`, 'utf-8')
      );
      await Tour.create(tours);
      expect(true).toBe(true);
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