const CURRENCY_FORMAT = '"R" #,##0.00';

const numberValue = (value) => Number(value || 0);
const roundMoney = (value) => Math.round((numberValue(value) + Number.EPSILON) * 100) / 100;
const dateValue = (value) => (value ? new Date(value) : null);
const vendorPayout = (order) => (order.vendorPayables || [])
  .reduce((sum, payable) => sum + numberValue(payable.netPayable), 0);
const shippingCost = (order) => numberValue(order.shippingCost);
const actualShippingCost = (order) => (order.shipments || [])
  .reduce((sum, shipment) => sum + numberValue(shipment.actualShippingCost), 0);

function styleDataSheet(worksheet, _title, headers, rows, currencyColumns = []) {
  const lastColumn = String.fromCharCode(64 + headers.length);
  worksheet.addRow(headers);
  rows.forEach((row) => worksheet.addRow(row));

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    worksheet.getRow(rowNumber).eachCell((cell, columnNumber) => {
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle' };
      if (currencyColumns.includes(columnNumber)) {
        cell.numFmt = CURRENCY_FORMAT;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  }

  worksheet.autoFilter = { from: 'A1', to: `${lastColumn}1` };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.columns.forEach((column, index) => {
    const headerLength = String(headers[index] || '').length;
    let maxLength = headerLength;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value instanceof Date ? 12 : String(cell.value ?? '').length;
      maxLength = Math.max(maxLength, value);
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 30);
  });
}

export async function buildAccountingWorkbook(data) {
  const ExcelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'The Grand Store';
  workbook.company = 'The Grand Store';
  workbook.subject = 'Accountant financial and transaction report';
  workbook.created = new Date();
  workbook.modified = new Date();

  const {
    metrics = {},
    transactions = [],
    shopOrders = [],
    auctionOrders = [],
    eventBookings = [],
    vendorPayments = [],
  } = data;

  const summary = workbook.addWorksheet('Summary');
  const summaryRows = [
    ['Total processed sales', numberValue(metrics.totalProcessed)],
    ['Platform commission', numberValue(metrics.totalPlatformRevenue)],
    ['VAT collected', numberValue(metrics.totalVatCollected)],
    ['Pending vendor payables', numberValue(metrics.totalPendingPayables)],
    ['Retail orders', shopOrders.length],
    ['Auction orders', auctionOrders.length],
    ['Event bookings', eventBookings.length],
    ['Transactions', transactions.length],
  ];
  styleDataSheet(summary, '', ['Metric', 'Value'], summaryRows);
  for (let rowNumber = 2; rowNumber <= 5; rowNumber += 1) summary.getCell(`B${rowNumber}`).numFmt = CURRENCY_FORMAT;
  for (let rowNumber = 6; rowNumber <= 9; rowNumber += 1) summary.getCell(`B${rowNumber}`).numFmt = '#,##0';

  const retailSheet = workbook.addWorksheet('Retail Orders');
  styleDataSheet(retailSheet, 'Retail Order Detail', [
    'Order Ref', 'Invoice', 'Date', 'Customer', 'Customer Email', 'Payment Method', 'Payment Status',
    'Products', 'Shipping Charged', 'Actual Shipping', 'Shipping Margin', 'VAT', 'Duties', 'Taxes',
    'Customs Fees', 'Gateway Fee', 'Total Paid', 'Commission', 'Vendor Payout', 'Delivery Status',
  ], shopOrders.map((order) => {
    const charged = shippingCost(order);
    const actual = actualShippingCost(order);
    return [
      order.orderId || order.transactionId || order._id,
      order.invoiceNumber || '',
      dateValue(order.createdAt),
      order.user?.name || '',
      order.user?.email || '',
      order.paymentMethod || '',
      order.paymentStatus || '',
      numberValue(order.subTotal),
      charged,
      actual,
      charged - actual,
      numberValue(order.vatAmount),
      numberValue(order.importDuties),
      numberValue(order.importTaxes),
      numberValue(order.customsFees),
      numberValue(order.gatewayFeeAmount),
      numberValue(order.totalPrice),
      numberValue(order.commissionAmount),
      vendorPayout(order),
      order.isDelivered ? 'Delivered' : 'Open',
    ];
  }), [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

  const auctionSheet = workbook.addWorksheet('Auction Orders');
  styleDataSheet(auctionSheet, 'Auction Order Detail', [
    'Order Ref', 'Date', 'Buyer', 'Buyer Email', 'Payment Status', 'Hammer Price', 'VAT',
    'Buyer Paid', 'Commission', 'Vendor Payout',
  ], auctionOrders.map((order) => [
    order.transactionId || order.orderId || order._id,
    dateValue(order.createdAt),
    order.user?.name || '',
    order.user?.email || '',
    order.paymentStatus || '',
    numberValue(order.subTotal),
    numberValue(order.vatAmount),
    numberValue(order.totalPrice),
    numberValue(order.commissionAmount),
    vendorPayout(order),
  ]), [6, 7, 8, 9, 10]);

  const eventsSheet = workbook.addWorksheet('Event Bookings');
  styleDataSheet(eventsSheet, 'Event Booking Detail', [
    'Booking Ref', 'Date', 'Customer', 'Customer Email', 'Payment Status', 'Subtotal', 'VAT',
    'Customer Paid', 'Commission', 'Organizer Payout',
  ], eventBookings.map((booking) => [
    booking.gsReference || booking.ticketId || booking._id,
    dateValue(booking.bookingDate || booking.createdAt),
    booking.user?.name || '',
    booking.user?.email || '',
    booking.paymentStatus || '',
    numberValue(booking.subTotal),
    numberValue(booking.vatAmount),
    numberValue(booking.totalPrice),
    numberValue(booking.commissionAmount),
    numberValue(booking.organizerPayable),
  ]), [6, 7, 8, 9, 10]);

  const vendorSheet = workbook.addWorksheet('Vendor Payments');
  styleDataSheet(vendorSheet, 'Vendor Registration Payments', [
    'Reference', 'Date', 'Vendor', 'Vendor Email', 'Amount', 'Gateway', 'Status', 'Description',
  ], vendorPayments.map((transaction) => [
    transaction.gsReference || transaction.reference || transaction._id,
    dateValue(transaction.createdAt || transaction.date),
    transaction.user?.name || transaction.customer?.name || '',
    transaction.user?.email || transaction.customer?.email || '',
    numberValue(transaction.amount),
    transaction.gateway || '',
    transaction.status || '',
    transaction.description || '',
  ]), [5]);

  const transactionSheet = workbook.addWorksheet('Transactions');
  styleDataSheet(transactionSheet, 'Master Transaction Ledger', [
    'GS Reference', 'Date', 'Type', 'Module', 'Status', 'Currency', 'Gross Amount', 'Net Amount',
    'Gateway', 'Gateway Transaction', 'Description',
  ], transactions.map((transaction) => [
    transaction.gsReference || transaction.reference || transaction._id,
    dateValue(transaction.createdAt),
    transaction.type || '',
    transaction.module || '',
    transaction.status || '',
    transaction.currency || 'ZAR',
    numberValue(transaction.amount),
    numberValue(transaction.netAmount),
    transaction.gateway || '',
    transaction.gatewayTransactionId || '',
    transaction.description || '',
  ]), [7, 8]);

  [retailSheet, auctionSheet, eventsSheet, vendorSheet, transactionSheet].forEach((worksheet) => {
    worksheet.getColumn(3).numFmt = 'yyyy-mm-dd';
  });
  retailSheet.getColumn(3).numFmt = 'yyyy-mm-dd';
  auctionSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  eventsSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  vendorSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  transactionSheet.getColumn(2).numFmt = 'yyyy-mm-dd';

  return workbook;
}

export function buildCategoryReportRows(shopOrders = []) {
  return shopOrders.flatMap((order, orderIndex) => {
    const orderReference = order.orderId || order.transactionId || order._id || `Order ${orderIndex + 1}`;
    const categories = new Map();
    const categoryProducts = new Map();
    
    (order.orderItems || []).forEach((item) => {
      const category = String(item.category || '').trim() || 'Uncategorised';
      const lineTotal = numberValue(item.quantity) * numberValue(item.price);
      categories.set(category, numberValue(categories.get(category)) + lineTotal);
      
      const productDesc = `${item.name || 'Unknown item'} (x${item.quantity || 1})`;
      if (!categoryProducts.has(category)) {
        categoryProducts.set(category, []);
      }
      categoryProducts.get(category).push(productDesc);
    });

    const categoryEntries = [...categories.entries()];
    const productTotal = categoryEntries.reduce((sum, [, amount]) => sum + amount, 0);
    const orderTotals = {
      shipping: shippingCost(order),
      shippingMargin: shippingCost(order) - actualShippingCost(order),
      vat: numberValue(order.vatAmount),
      totalPaid: numberValue(order.totalPrice),
      commission: numberValue(order.commissionAmount),
      vendorPayout: vendorPayout(order),
    };
    const allocated = Object.fromEntries(Object.keys(orderTotals).map((key) => [key, 0]));

    return categoryEntries.map(([category, productSales], categoryIndex) => {
      const isLastCategory = categoryIndex === categoryEntries.length - 1;
      const share = productTotal ? productSales / productTotal : 0;
      const allocate = (key) => {
        const amount = isLastCategory
          ? roundMoney(orderTotals[key] - allocated[key])
          : roundMoney(orderTotals[key] * share);
        allocated[key] = roundMoney(allocated[key] + amount);
        return amount;
      };
      return {
        category,
        orderReference,
        date: dateValue(order.createdAt),
        productNames: categoryProducts.get(category).join(', '),
        productSales: roundMoney(productSales),
        shipping: allocate('shipping'),
        shippingMargin: allocate('shippingMargin'),
        vat: allocate('vat'),
        totalPaid: allocate('totalPaid'),
        commission: allocate('commission'),
        vendorPayout: allocate('vendorPayout'),
      };
    });
  }).sort((left, right) => left.category.localeCompare(right.category)
    || numberValue(right.date?.getTime()) - numberValue(left.date?.getTime()));
}

export async function buildCategoryAccountingWorkbook({ shopOrders = [], auctionOrders = [], eventBookings = [] } = {}) {
  const ExcelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'The Grand Store';
  workbook.company = 'The Grand Store';
  workbook.subject = 'Sales report grouped by category, auctions, and events';
  workbook.created = new Date();
  workbook.modified = new Date();

  const rows = buildCategoryReportRows(shopOrders);
  
  // Group rows by category
  const categoriesMap = new Map();
  rows.forEach((row) => {
    if (!categoriesMap.has(row.category)) {
      categoriesMap.set(row.category, []);
    }
    categoriesMap.get(row.category).push(row);
  });

  // Create a sheet for each category
  for (const [category, categoryRows] of categoriesMap.entries()) {
    // Excel worksheet names must be <= 31 characters and cannot contain certain chars
    const safeSheetName = (category || 'Uncategorised')
      .replace(/[\[\]\*\?\/\\\:]/g, '')
      .substring(0, 31);
      
    const sheet = workbook.addWorksheet(safeSheetName);
    styleDataSheet(sheet, '', [
      'Category', 'Order Ref', 'Date', 'Items Purchased', 'Category Sales', 'Shipping', 'Shipping Margin',
      'VAT', 'Total Paid', 'Commission', 'Vendor Payout',
    ], categoryRows.map((row) => [
      row.category,
      row.orderReference,
      row.date,
      row.productNames,
      row.productSales,
      row.shipping,
      row.shippingMargin,
      row.vat,
      row.totalPaid,
      row.commission,
      row.vendorPayout,
    ]), [5, 6, 7, 8, 9, 10, 11]);
    
    sheet.getColumn(3).numFmt = 'dd mmm yyyy';
  }

  // Add Auction Orders sheet
  if (auctionOrders.length > 0) {
    const auctionSheet = workbook.addWorksheet('Auctions');
    styleDataSheet(auctionSheet, '', [
      'Order Ref', 'Date', 'Buyer', 'Buyer Email', 'Payment Status', 'Hammer Price', 'VAT',
      'Buyer Paid', 'Commission', 'Vendor Payout',
    ], auctionOrders.map((order) => [
      order.transactionId || order.orderId || order._id,
      dateValue(order.createdAt),
      order.user?.name || '',
      order.user?.email || '',
      order.paymentStatus || '',
      numberValue(order.subTotal),
      numberValue(order.vatAmount),
      numberValue(order.totalPrice),
      numberValue(order.commissionAmount),
      vendorPayout(order),
    ]), [6, 7, 8, 9, 10]);
    auctionSheet.getColumn(2).numFmt = 'dd mmm yyyy';
  }

  // Add Event Bookings sheet
  if (eventBookings.length > 0) {
    const eventsSheet = workbook.addWorksheet('Event Tickets');
    styleDataSheet(eventsSheet, '', [
      'Booking Ref', 'Date', 'Customer', 'Customer Email', 'Payment Status', 'Subtotal', 'VAT',
      'Customer Paid', 'Commission', 'Organizer Payout',
    ], eventBookings.map((booking) => [
      booking.gsReference || booking.ticketId || booking._id,
      dateValue(booking.bookingDate || booking.createdAt),
      booking.user?.name || '',
      booking.user?.email || '',
      booking.paymentStatus || '',
      numberValue(booking.subTotal),
      numberValue(booking.vatAmount),
      numberValue(booking.totalPrice),
      numberValue(booking.commissionAmount),
      numberValue(booking.organizerPayable),
    ]), [6, 7, 8, 9, 10]);
    eventsSheet.getColumn(2).numFmt = 'dd mmm yyyy';
  }

  workbook.views = [{ activeTab: 0 }];

  return workbook;
}

async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAccountingWorkbook(data) {
  const workbook = await buildAccountingWorkbook(data);
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `grand-store-accounting-${stamp}.xlsx`);
}

export async function downloadCategoryAccountingWorkbook(data) {
  const workbook = await buildCategoryAccountingWorkbook(data);
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `grand-store-retail-sales-${stamp}.xlsx`);
}

export async function downloadAuctionsWorkbook({ auctionOrders = [] }) {
  const ExcelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const auctionSheet = workbook.addWorksheet('Auctions');
  styleDataSheet(auctionSheet, 'Auction Order Detail', [
    'Order Ref', 'Date', 'Buyer', 'Buyer Email', 'Payment Status', 'Hammer Price', 'VAT',
    'Buyer Paid', 'Commission', 'Vendor Payout',
  ], auctionOrders.map((order) => [
    order.transactionId || order.orderId || order._id,
    dateValue(order.createdAt),
    order.user?.name || '',
    order.user?.email || '',
    order.paymentStatus || '',
    numberValue(order.subTotal),
    numberValue(order.vatAmount),
    numberValue(order.totalPrice),
    numberValue(order.commissionAmount),
    vendorPayout(order),
  ]), [6, 7, 8, 9, 10]);
  auctionSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `grand-store-auctions-${stamp}.xlsx`);
}

export async function downloadEventsWorkbook({ eventBookings = [] }) {
  const ExcelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const eventsSheet = workbook.addWorksheet('Event Bookings');
  styleDataSheet(eventsSheet, 'Event Booking Detail', [
    'Booking Ref', 'Date', 'Customer', 'Customer Email', 'Payment Status', 'Subtotal', 'VAT',
    'Customer Paid', 'Commission', 'Organizer Payout',
  ], eventBookings.map((booking) => [
    booking.gsReference || booking.ticketId || booking._id,
    dateValue(booking.bookingDate || booking.createdAt),
    booking.user?.name || '',
    booking.user?.email || '',
    booking.paymentStatus || '',
    numberValue(booking.subTotal),
    numberValue(booking.vatAmount),
    numberValue(booking.totalPrice),
    numberValue(booking.commissionAmount),
    numberValue(booking.organizerPayable),
  ]), [6, 7, 8, 9, 10]);
  eventsSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `grand-store-events-${stamp}.xlsx`);
}

export async function downloadVendorWorkbook({ vendorPayments = [] }) {
  const ExcelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const vendorSheet = workbook.addWorksheet('Vendor Payments');
  styleDataSheet(vendorSheet, 'Vendor Registration Payments', [
    'Reference', 'Date', 'Vendor', 'Vendor Email', 'Amount', 'Gateway', 'Status', 'Description',
  ], vendorPayments.map((transaction) => [
    transaction.gsReference || transaction.reference || transaction._id,
    dateValue(transaction.createdAt || transaction.date),
    transaction.user?.name || transaction.customer?.name || '',
    transaction.user?.email || transaction.customer?.email || '',
    numberValue(transaction.amount),
    transaction.gateway || '',
    transaction.status || '',
    transaction.description || '',
  ]), [5]);
  vendorSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `grand-store-vendor-reg-${stamp}.xlsx`);
}

export async function downloadLedgerWorkbook({ transactions = [] }) {
  const ExcelModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelModule.default || ExcelModule;
  const workbook = new ExcelJS.Workbook();
  const transactionSheet = workbook.addWorksheet('Transactions');
  styleDataSheet(transactionSheet, 'Master Transaction Ledger', [
    'GS Reference', 'Date', 'Type', 'Module', 'Status', 'Currency', 'Gross Amount', 'Net Amount',
    'Gateway', 'Gateway Transaction', 'Description',
  ], transactions.map((transaction) => [
    transaction.gsReference || transaction.reference || transaction._id,
    dateValue(transaction.createdAt),
    transaction.type || '',
    transaction.module || '',
    transaction.status || '',
    transaction.currency || 'ZAR',
    numberValue(transaction.amount),
    numberValue(transaction.netAmount),
    transaction.gateway || '',
    transaction.gatewayTransactionId || '',
    transaction.description || '',
  ]), [7, 8]);
  transactionSheet.getColumn(2).numFmt = 'yyyy-mm-dd';
  
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `grand-store-ledger-${stamp}.xlsx`);
}
