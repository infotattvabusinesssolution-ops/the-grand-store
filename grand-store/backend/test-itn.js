const axios = require('axios');
const crypto = require('crypto');

const passphrase = 'Grand001002003';
const payload = {
  m_payment_id: 'EVT-6a968d3b1da81bc4c2b7f115',
  pf_payment_id: '1234567',
  payment_status: 'COMPLETE',
  item_name: 'Test Event Ticket',
  item_description: 'Test Event Ticket',
  amount_gross: '2362.28',
  amount_fee: '-1.00',
  amount_net: '2361.28',
  custom_str1: '',
  custom_str2: '',
  custom_str3: '',
  custom_str4: '',
  custom_str5: '',
  custom_int1: '',
  custom_int2: '',
  custom_int3: '',
  custom_int4: '',
  custom_int5: '',
  name_first: '',
  name_last: '',
  email_address: '',
  merchant_id: '10027304'
};

const generateSignature = (payload, passphrase) => {
  let pfOutput = '';
  for (let key in payload) {
    if (payload.hasOwnProperty(key)) {
      if (payload[key] !== '') {
        pfOutput += `${key}=${encodeURIComponent(payload[key].trim()).replace(/%20/g, '+')}&`;
      }
    }
  }
  let getString = pfOutput.slice(0, -1);
  if (passphrase !== null) {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }
  return crypto.createHash('md5').update(getString).digest('hex');
};

payload.signature = generateSignature(payload, passphrase);

const pfParamString = Object.keys(payload)
  .map(key => `${key}=${encodeURIComponent(payload[key])}`)
  .join('&');

axios.post('https://api.grandstoreglobal.com/api/payfast/itn', pfParamString, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
}).then(res => console.log('SUCCESS:', res.data)).catch(err => console.log('ERROR:', err.response ? err.response.data : err.message));
