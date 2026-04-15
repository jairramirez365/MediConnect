const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

const app = require('../src/app');
const pool = require('../src/database/pool');

describe('GET /api/v1/doctors', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    await pool.end();
  });

  it('returns active doctors filtered by specialty', async () => {
    const response = await fetch(`${baseUrl}/api/v1/doctors?specialty=Medicina`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);

    const doctor = body.data[0];
    assert.ok(doctor.id);
    assert.ok(doctor.nombres);
    assert.ok(doctor.apellidos);
    assert.ok(Array.isArray(doctor.specialties));
  });
});
