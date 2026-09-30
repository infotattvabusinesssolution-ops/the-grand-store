const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testRate() {
  await mongoose.connect(process.env.MONGO_URI);
  const { getRates } = require('../controllers/aramexController');

  const mockReq = {
    body: {
      destination: {
        suburb: 'Camps Bay',
        postal_code: '8005',
        city: 'Cape Town',
        is_regional: false
      },
      items: [
        {
          name: 'Ridge Lytton Springs Zinfandel 750ml',
          qty: 1
        }
      ]
    }
  };

  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
      return mockRes;
    },
    status: (code) => {
      console.log('Status code:', code);
      return mockRes;
    }
  };

  await getRates(mockReq, mockRes);

  console.log('--- ARAMEX LIVE RATE CALCULATION RESULT ---');
  console.log('Success:', responseData?.success);
  console.log('Actual Weight:', responseData?.actual_weight, 'kg');
  console.log('Volumetric Weight:', responseData?.volumetric_weight, 'kg');
  console.log('Chargeable Weight:', responseData?.chargeable_weight, 'kg');
  console.log('Declared Value:', responseData?.declared_value);
  console.log('Rates:');
  responseData?.rates?.forEach(r => {
    console.log(`- ${r.service_name} (${r.service_type}): R ${r.rate} (Base: R ${r.amount}, Fuel: R ${r.fuel_surcharge}, VAT: R ${r.vat_amount}) -> ETA: ${r.expected_delivery_date}`);
  });

  await mongoose.disconnect();
}

testRate().catch(console.error);
