const { bankTransferInstructionsTemplate } = require('../utils/emailTemplates');

const mockOrder = {
  _id: '6abc19b5ae525697f5ccc032',
  depositReference: 'GS-001039',
  totalPrice: 1039,
  isGuest: true,
  guestAccessToken: 'guest_token_12345',
  shippingAddress: {
    name: 'Sarah Naidoo'
  }
};

const mockBankDetails = {
  bankName: 'FNB',
  accountName: 'The Grand Store',
  accountNumber: '62000000000',
  branchCode: '250655',
  accountType: 'Cheque'
};

const html = bankTransferInstructionsTemplate(mockOrder, mockBankDetails);

console.log('--- Bank Transfer Email Render Check ---');
console.log('Length:', html.length);
console.log('Contains Rand (R 1039.00):', html.includes('R 1039.00'));
console.log('Contains GS-001039:', html.includes('GS-001039'));
console.log('Does NOT contain raw Mongo ID:', !html.includes('Order #6abc19b5ae525697f5ccc032'));
console.log('Contains guest token link:', html.includes('guest_token_12345'));
console.log('Contains Beneficiary Bank Account Details:', html.includes('Beneficiary Bank Account Details'));
console.log('Contains FNB & 62000000000:', html.includes('FNB') && html.includes('62000000000'));
console.log('----------------------------------------');
