const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getCheckoutPhone } = require('../utils/phoneNumbers');
const Order = require('../models/Order');
const { addOrderItems, getAdminOrderById } = require('../controllers/orderController');

test('checkout retains the selected code and normalizes local numbers once', () => {
  const examples = [
    ['ZA', '082 123 4567', '+27821234567', '+27'],
    ['ZA', '+27 82 123 4567', '+27821234567', '+27'],
    ['ZA', '27821234567', '+27821234567', '+27'],
    ['IN', '9876543210', '+919876543210', '+91'],
    ['GB', '07700 900123', '+447700900123', '+44'],
    ['US', '2025550123', '+12025550123', '+1'],
    ['CA', '4165550123', '+14165550123', '+1'],
    ['IT', '0212345678', '+390212345678', '+39'],
  ];
  for (const [country, input, phone, code] of examples) {
    assert.deepEqual(getCheckoutPhone(input, country), {
      phone, phoneNumber: phone, phoneCountry: country, phoneCountryCode: code,
    });
  }
});

test('invalid choices, mismatched prefixes, extensions and incomplete numbers are rejected', () => {
  for (const [country, phone] of [
    ['ZZ', '0821234567'], ['+27', '0821234567'], ['', '0821234567'],
    ['ZA', '123'], ['ZA', ''], ['ZA', '+919876543210'],
    ['ZA', 'Call 0821234567'], ['ZA', '0821234567 ext. 12'],
  ]) {
    assert.equal(getCheckoutPhone(phone, country), null, `${country}: ${phone}`);
  }
});

test('registered and guest order snapshots retain international contact fields', async () => {
  const contact = getCheckoutPhone('9876543210', 'IN');
  const order = new Order({
    paymentMethod: 'Bank Transfer',
    shippingAddress: { address: '1 Sample Street', city: 'Cape Town', postalCode: '8001', country: 'South Africa', ...contact },
    guestInfo: { name: 'Sample Guest', email: 'guest@example.com', ...contact },
  });
  await order.validate();
  const saved = order.toObject();
  assert.equal(saved.shippingAddress.phoneCountryCode, '+91');
  assert.equal(saved.shippingAddress.phoneCountry, 'IN');
  assert.equal(saved.shippingAddress.phone, '+919876543210');
  assert.equal(saved.guestInfo.phone, '+919876543210');
  assert.equal(saved.guestInfo.phoneCountryCode, '+91');
});

test('order endpoint rejects a tampered country code before accessing the database', async () => {
  const req = { body: { shippingAddress: { phone: '0821234567', phoneCountry: 'ZA', phoneCountryCode: '+999' } } };
  let status;
  let response;
  const res = { status(value) { status = value; return this; }, json(value) { response = value; return this; } };
  await addOrderItems(req, res);
  assert.equal(status, 400);
  assert.match(response.message, /country code/);
});

test('admin order response includes the saved calling code for mobile and web orders', async (t) => {
  const contact = getCheckoutPhone('9876543210', 'IN');
  const saved = new Order({ shippingAddress: contact }).toObject();
  const query = { populate() { return this; }, async lean() { return saved; } };
  t.mock.method(Order, 'findById', () => query);
  let response;
  const res = { json(value) { response = value; }, status() { return this; } };
  await getAdminOrderById({ params: { id: String(saved._id) } }, res);
  assert.equal(response.customerPhone, '+919876543210');
  assert.equal(response.customerPhoneCountry, 'IN');
  assert.equal(response.customerPhoneCountryCode, '+91');
});
