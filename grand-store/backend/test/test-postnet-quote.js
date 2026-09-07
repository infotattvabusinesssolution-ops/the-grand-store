const assert = require('assert');
const { getShippingQuotes } = require('../engines/shippingEngine');

console.log('--- Running PostNet Shipping Engine Tests ---');

async function runTests() {
  const dummyAddress = {
    address: '14 Katherine St',
    city: 'Johannesburg',
    postalCode: '2196',
    country: 'South Africa'
  };

  const mockPostnetLookup = {
    stores: [
      { id: 'pn-1', name: 'PostNet Sandton City', address: 'Shop L38 Sandton City', distance: 0.8 },
      { id: 'pn-2', name: 'PostNet Rosebank', address: 'The Zone @ Rosebank', distance: 2.4 }
    ],
    searchedCity: 'Johannesburg',
    hasCityMatch: true
  };

  // Test 1: Domestic SA Quote Generation
  const result = await getShippingQuotes(
    null, // vendorId
    dummyAddress,
    1500, // Subtotal
    3.0,  // Weight kg
    { postnetLookup: mockPostnetLookup }
  );

  console.log('Available Quotes Count:', result.quotes.length);
  const quoteNames = result.quotes.map(q => `${q.courierName} - ${q.serviceLevel} (R${q.cost})`);
  console.log('Quotes:', quoteNames);

  const postnetStandard = result.quotes.find(q => q.serviceLevel === 'PostNet Standard Delivery');
  const postnetExpress = result.quotes.find(q => q.serviceLevel === 'PostNet Express Delivery');
  const postnetCollection = result.quotes.find(q => q.serviceLevel === 'PostNet Store Collection');

  assert(Boolean(postnetStandard), 'PostNet Standard Delivery should be available');
  assert(Boolean(postnetExpress), 'PostNet Express Delivery should be available');
  assert(Boolean(postnetCollection), 'PostNet Store Collection should be available');

  assert.strictEqual(postnetStandard.deliveryType, 'home', 'Standard should be home delivery');
  assert.strictEqual(postnetExpress.deliveryType, 'home', 'Express should be home delivery');
  assert.strictEqual(postnetCollection.deliveryType, 'pickup', 'Collection should be pickup');
  assert(postnetCollection.stores.length === 2, 'Should attach PostNet stores');

  console.log('✅ PostNet Domestic Shipping Engine Tests Passed!');
}

runTests().then(() => {
  console.log('🎉 ALL PostNet Shipping Tests Passed Successfully!');
}).catch(err => {
  console.error('❌ PostNet Shipping Test Failed:', err);
  process.exit(1);
});
