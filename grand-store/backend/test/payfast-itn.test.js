const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const express = require('express');

process.env.PAYFAST_IS_LIVE = 'false';
process.env.PAYFAST_TEST_MERCHANT_ID = '10000100';
process.env.PAYFAST_TEST_MERCHANT_KEY = 'test-key';
process.env.PAYFAST_TEST_PASSPHRASE = 'test-passphrase';

const payfastRoutes = require('../routes/payfastRoutes');

const generateSignature = (data, passphrase) => {
  const fields = Object.entries(data)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => (
      `${key}=${encodeURIComponent(value.toString().trim())
        .replace(/[!'()*~]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%20/g, '+')}`
    ));

  fields.push(`passphrase=${encodeURIComponent(passphrase.trim())
    .replace(/[!'()*~]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+')}`);
  return crypto.createHash('md5').update(fields.join('&')).digest('hex');
};

const axios = require('axios');

const withServer = async (callback) => {
  const originalPost = axios.post;
  // Default mock to VALID so tests run deterministically in CI without external network dependencies
  axios.post = async () => ({ data: 'VALID' });

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/payfast', payfastRoutes);

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });

  try {
    const address = server.address();
    await callback(`http://127.0.0.1:${address.port}`, axios);
  } finally {
    axios.post = originalPost;
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
};

test('PayFast ITN route parses urlencoded form posts', async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      m_payment_id: 'IGNORED-123',
      payment_status: 'CANCELLED',
      merchant_id: process.env.PAYFAST_TEST_MERCHANT_ID,
    };
    payload.signature = generateSignature(payload, process.env.PAYFAST_TEST_PASSPHRASE);

    const response = await fetch(`${baseUrl}/api/payfast/itn`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload),
    });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'OK');
  });
});

test('PayFast ITN route rejects an invalid signature', async () => {
  await withServer(async (baseUrl, axiosInstance) => {
    axiosInstance.post = async () => ({ data: 'INVALID' });
    const response = await fetch(`${baseUrl}/api/payfast/itn`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        m_payment_id: 'IGNORED-123',
        payment_status: 'CANCELLED',
        merchant_id: process.env.PAYFAST_TEST_MERCHANT_ID,
        signature: 'invalid',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(await response.text(), 'Invalid signature');
  });
});

test('PayFast ITN verification follows PHP encoding and stops at signature', async () => {
  await withServer(async (baseUrl) => {
    const signedFields = {
      m_payment_id: 'IGNORED-123',
      payment_status: 'CANCELLED',
      item_name: "Collector's ~ Evening",
      merchant_id: process.env.PAYFAST_TEST_MERCHANT_ID,
    };
    const signature = generateSignature(signedFields, process.env.PAYFAST_TEST_PASSPHRASE);
    const body = new URLSearchParams(signedFields);
    body.append('signature', signature);
    body.append('field_after_signature', 'must-not-be-signed');

    const response = await fetch(`${baseUrl}/api/payfast/itn`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'OK');
  });
});

test('PayFast server confirmation excludes the received signature field', async () => {
  let validationBody = '';

  await withServer(async (baseUrl, axiosInstance) => {
    axiosInstance.post = async (url, body) => {
      validationBody = body;
      return { data: 'VALID' };
    };

    const payload = {
      m_payment_id: 'IGNORED-123',
      payment_status: 'COMPLETE',
      merchant_id: process.env.PAYFAST_TEST_MERCHANT_ID,
      amount_gross: '10.00',
    };
    payload.signature = generateSignature(payload, process.env.PAYFAST_TEST_PASSPHRASE);

    const response = await fetch(`${baseUrl}/api/payfast/itn`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload),
    });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'OK');
    assert.equal(new URLSearchParams(validationBody).has('signature'), false);
    assert.equal(new URLSearchParams(validationBody).get('payment_status'), 'COMPLETE');
  });
});
