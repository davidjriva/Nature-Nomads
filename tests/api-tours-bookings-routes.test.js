const request = require('supertest');
const path = require('path');
const app = require(path.join(__dirname, '../app'));
const fs = require('fs');
const mongoose = require('mongoose');

const adminUser = JSON.parse(process.env.ADMIN_USER);

describe('Tour Routes', () => {
  let tours;
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    // Read tour data from the file
    tours = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../dev-data/data/tours.json'), 'utf-8')
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
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

      await request(app)
        .delete(`/api/v1/tours/${seaExplorerId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(204);

      await request(app).get(`/api/v1/tours/${seaExplorerId}`).expect(404);
    });
  });

  const snowAdventurerId = '5c88fa8cf4afda39709c295a';
  const parkCamperId = '5c88fa8cf4afda39709c2961';
  let snowAdventurerBooking;

  describe('GET /checkout-session/:tourId', () => {
    it('should return a valid booking session and status code 200', async () => {
      const lookupRes = await request(app).get(`/api/v1/tours/${snowAdventurerId}`).expect(200);

      const snowAdventurerTour = lookupRes.body.data;

      const res = await request(app)
        .get(`/api/v1/bookings/checkout-session/${snowAdventurerId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const checkoutSession = res.body.data;

      expect(checkoutSession).toHaveProperty('id');
      expect(checkoutSession.object).toBe('checkout.session');
      expect(checkoutSession.amount_total).toBe(snowAdventurerTour.price * 100);
      expect(checkoutSession.currency).toBe('usd');
      expect(checkoutSession.client_reference_id).toBe(snowAdventurerId);
      expect(checkoutSession.payment_status).toBe('unpaid');
      expect(checkoutSession.cancel_url).toContain(`tour/the-snow-adventurer`);
      expect(checkoutSession.success_url).toContain(`tour=${snowAdventurerId}`);
      expect(checkoutSession.customer_email).toBe(adminUser.email);
      expect(checkoutSession.payment_method_types).toContain('card');
    });
  });

  describe('POST /', () => {
    it('should create a booking manually', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          paid: true,
          tour: snowAdventurerId,
          user: adminUser._id,
          price: 997,
        })
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(201);

      snowAdventurerBooking = res.body.data;
      expect(snowAdventurerBooking.tour).toBe(snowAdventurerBooking.tour);
      expect(snowAdventurerBooking.user).toBe(adminUser._id);
      expect(snowAdventurerBooking.price).toBe(997);
      expect(snowAdventurerBooking.paid).toBe(true);
      expect(snowAdventurerBooking).toHaveProperty('_id');
    });
  });

  describe('GET /:id', () => {
    it('should get a booking by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${snowAdventurerBooking._id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(res.body.data._id).toBe(snowAdventurerBooking._id);
      expect(res.body.data.tour._id).toBe(snowAdventurerBooking.tour);
      expect(res.body.data.user._id).toBe(snowAdventurerBooking.user);
      expect(res.body.data.price).toBe(snowAdventurerBooking.price);
      expect(res.body.data.paid).toBe(true);
    });
  });

  describe('PATCH :/id', () => {
    it("should manually update a booking's details", async () => {
      await request(app)
        .patch(`/api/v1/bookings/${snowAdventurerBooking._id}`)
        .send({
          paid: false,
        })
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      const lookupRes = await request(app)
        .get(`/api/v1/bookings/${snowAdventurerBooking._id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(lookupRes.body.data._id).toBe(snowAdventurerBooking._id);
      expect(lookupRes.body.data.tour._id).toBe(snowAdventurerBooking.tour);
      expect(lookupRes.body.data.user._id).toBe(snowAdventurerBooking.user);
      expect(lookupRes.body.data.price).toBe(snowAdventurerBooking.price);
      expect(lookupRes.body.data.paid).toBe(false);
    });
  });

  describe('GET /', () => {
    it('should get all bookings', async () => {
      // create a second booking
      await request(app)
        .post('/api/v1/bookings')
        .send({
          paid: true,
          tour: parkCamperId,
          user: adminUser._id,
          price: 1500,
        })
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(201);

      // lookup all bookings
      const allBookingsRes = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      expect(allBookingsRes.body.data.results).toBe(2);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a booking by ID', async () => {
      await request(app)
        .delete(`/api/v1/bookings/${snowAdventurerBooking._id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(204);

      await request(app)
        .get(`/api/v1/bookings/${snowAdventurerBooking._id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(404);
    });
  });
});
