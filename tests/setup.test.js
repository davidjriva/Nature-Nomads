const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const app = require(path.join(__dirname, '../app'));

describe('Mongoose Connection', () => {
  it('should verify that Mongoose connection is alive', async () => {
    const isConnected = mongoose.connection.readyState === 1; // 1 means connected
    expect(isConnected).toBe(true);
  });
});

describe('Environment Variables', () => {
  it('should verify that the NODE_ENV is test', async () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('Verify server is running', () => {
  it('should respond with a 200 status code to verify server is functional', async () => {
    const response = await request(app).post('/test-route').send();
    expect(response.statusCode).toBe(200);
  });
});
