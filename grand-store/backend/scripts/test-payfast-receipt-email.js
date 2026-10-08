require('dotenv').config();
const { sendEmail } = require('../utils/emailService');
const { orderConfirmationTemplate } = require('../utils/emailTemplates');
const { generateOrderReceiptBuffer } = require('../utils/pdfService');

async function sendTestPayfastReceipt() {
  const recipient = process.argv[2] || process.env.BILLING_EMAIL || 'billing@grandstore.co.za';

  console.log(`\n======================================================`);
  console.log(`🚀 Simulating PayFast Payment Receipt without live payment`);
  console.log(`📨 Destination: ${recipient}`);
  console.log(`======================================================\n`);

  const mockOrder = {
    _id: '67a5f1234567890abcdef123',
    orderId: 'GS-2026-PF-TEST',
    invoiceNumber: 'INV-2026-8801',
    transactionId: 'PF-TXN-98472651',
    paymentMethod: 'Instant EFT / Card (PayFast)',
    paymentStatus: 'Paid',
    isPaid: true,
    paidAt: new Date(),
    createdAt: new Date(),
    subTotal: 2173.91,
    vatAmount: 326.09,
    shippingPrice: 150.00,
    totalPrice: 2650.00,
    shippingAddress: {
      fullName: 'Grand Store Quality Assurance',
      address: '1 Sandton Drive, Sandton',
      city: 'Johannesburg',
      postalCode: '2196',
      country: 'South Africa',
      phone: '+27 76 580 9522'
    },
    orderItems: [
      {
        id: 'prod-001',
        name: 'The Grand Reserve Collection 2024',
        quantity: 1,
        price: 1500.00,
        image: 'https://grandstoreglobal.com/logo.png',
        category: 'Wine & Spirits'
      },
      {
        id: 'prod-002',
        name: 'Artisan Crystal Decanter Set',
        quantity: 1,
        price: 673.91,
        image: 'https://grandstoreglobal.com/logo.png',
        category: 'Accessories'
      }
    ],
    user: {
      name: 'Billing Administrator',
      email: recipient
    }
  };

  const mockCustomer = {
    name: 'Billing Administrator',
    email: recipient,
    phone: '+27 76 580 9522'
  };

  try {
    console.log('1. Generating luxury PDF Tax Invoice buffer...');
    const pdfBuffer = await generateOrderReceiptBuffer(mockOrder, mockCustomer);
    console.log(`   ✅ PDF generated (${pdfBuffer.length} bytes)`);

    console.log('2. Rendering official Order Confirmation template...');
    const htmlContent = orderConfirmationTemplate(mockOrder);

    console.log('3. Sending PayFast receipt email via Hostinger Billing channel...');
    const result = await sendEmail({
      to: recipient,
      subject: `Payment Receipt #${mockOrder.invoiceNumber} (PayFast Simulation - No Real Payment)`,
      html: htmlContent,
      attachments: [
        {
          filename: `Tax-Invoice-${mockOrder.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log(`\n🎉 SUCCESS! Test PayFast receipt delivered to ${recipient}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Sender: ${result.from || 'billing@grandstore.co.za'}`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('❌ Failed to send simulated PayFast receipt:', err);
  }
}

sendTestPayfastReceipt();
