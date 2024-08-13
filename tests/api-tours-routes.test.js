const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));
const fs = require('fs');
const { adminUser } = require(path.join(__dirname, './setup'));

describe('Tour Routes', () => {
  let tours;

  beforeAll(() => {
    // Read tour data from the file
    tours = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../dev-data/data/tours.json'), 'utf-8')
    );
  });

  describe('POST /', () => {
    it('should create all tours in the dev-data and return a 201 status code for each', async () => {
      const reqs = tours.map(async (tour) => {
        // Make the POST request
        const createReq = await request(app)
          .post('/api/v1/tours')
          .send(tour)
          .set('Authorization', `Bearer ${adminUser.token}`);

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
    it('should get all tours and return a 200 status code', async () => {
      const res = await request(app).get('/api/v1/tours');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.docs)).toBe(true);
      expect(res.body.data.results).toBe(9);

      const firstTour = res.body.data.docs[0];
      expect(firstTour).toHaveProperty('name');
      expect(firstTour).toHaveProperty('duration');
      expect(firstTour).toHaveProperty('summary');
      expect(firstTour).toHaveProperty('locations');
      expect(firstTour).toHaveProperty('images');
    });
  });

  describe('GET /:id', () => {
    it('should get a tour by ID and return a 200 status code', async () => {
      const seaExplorerId = '5c88fa8cf4afda39709c2955';

      const seaExplorerTour = {
        ...tours[0],
        locations: tours[0].locations.map((location) => ({
          ...location,
          id: location._id,
        })),
      };

      const res = await request(app).get(`/api/v1/tours/${seaExplorerId}`).expect(200);

      expect(res.body.data.name).toBe(seaExplorerTour.name);
      expect(res.body.data.duration).toBe(seaExplorerTour.duration);
      expect(res.body.data.summary).toBe(seaExplorerTour.summary);
      expect(res.body.data.images).toStrictEqual(seaExplorerTour.images);
      expect(res.body.data.startDates).toStrictEqual(seaExplorerTour.startDates);
      expect(res.body.data.locations).toStrictEqual(seaExplorerTour.locations);
    });
  });

  describe('PATCH /:id', () => {
    it('should update a tour by ID and return a 200 status code', async () => {
      const seaExplorerId = '5c88fa8cf4afda39709c2955';

      const patchRes = await request(app)
        .patch(`/api/v1/tours/${seaExplorerId}`)
        .send({
          name: 'My Tour Now',
        })
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(patchRes.body.data.name).toBe('My Tour Now');

      const getRes = await request(app).get(`/api/v1/tours/${seaExplorerId}`).expect(200);

      expect(getRes.body.data.name).toBe('My Tour Now');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a tour by ID and return a 204 status code', async () => {
      const seaExplorerId = '5c88fa8cf4afda39709c2955';

      const deleteRes = await request(app)
        .delete(`/api/v1/tours/${seaExplorerId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(204);


      await request(app).get(`/api/v1/tours/${seaExplorerId}`).expect(404);
    });
  });
});
