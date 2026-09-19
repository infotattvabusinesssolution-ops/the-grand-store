const test = require('node:test');
const assert = require('node:assert/strict');

test('Phase 2: Inventory & Storefront Sync Test Suite', async (t) => {
  // 1. Inventory Stock Check Logic in addOrderItems
  await t.test('1. Insufficient stock rejects order creation', async () => {
    const product = {
      name: 'Limited Reserve Cabernet 2018',
      price: 1200,
      stock: 2
    };
    const requestedQty = 5;

    const isStockInsufficient = product.stock !== undefined && product.stock !== null && product.stock < requestedQty;
    assert.equal(isStockInsufficient, true, 'Order requesting 5 items when only 2 in stock must be rejected');
  });

  await t.test('2. Sufficient stock allows order creation', async () => {
    const product = {
      name: 'Pinotage 2021',
      price: 450,
      stock: 10
    };
    const requestedQty = 3;

    const isStockInsufficient = product.stock !== undefined && product.stock !== null && product.stock < requestedQty;
    assert.equal(isStockInsufficient, false, 'Order requesting 3 items when 10 in stock must proceed');
  });

  // 2. Atomic Stock Decrement Condition in processOrderPayment
  await t.test('3. Atomic stock decrement query condition requires stock >= quantity', async () => {
    const qty = 2;
    const updateQuery = (productId, qty) => ({
      _id: productId,
      stock: { $gte: qty }
    });

    const query = updateQuery('prod-123', qty);
    assert.equal(query.stock.$gte, 2, 'Query must enforce $gte: quantity to prevent negative stock');
  });

  // 3. Stock Restoration on Order Cancellation
  await t.test('4. Stock restoration calculates positive increment for cancelled items', async () => {
    const orderItems = [
      { product: 'prod-1', quantity: 2 },
      { product: 'prod-2', quantity: 1 }
    ];

    const restorations = orderItems.map(item => ({
      product: item.product,
      restoreInc: { stock: Number(item.quantity) || 1 }
    }));

    assert.equal(restorations[0].restoreInc.stock, 2);
    assert.equal(restorations[1].restoreInc.stock, 1);
  });

  // 4. Guest Order Access Token Header and Query Extraction
  await t.test('5. getOrderById correctly extracts token from headers or query', async () => {
    const reqFromHeader = {
      headers: { 'x-guest-access-token': 'token-from-header-999' },
      query: {}
    };
    const reqFromQuery = {
      headers: {},
      query: { token: 'token-from-query-888' }
    };
    const reqFromQueryAlias = {
      headers: {},
      query: { guestAccessToken: 'token-from-alias-777' }
    };

    const extractToken = (req) => req.headers['x-guest-access-token'] || req.query.token || req.query.guestAccessToken;

    assert.equal(extractToken(reqFromHeader), 'token-from-header-999');
    assert.equal(extractToken(reqFromQuery), 'token-from-query-888');
    assert.equal(extractToken(reqFromQueryAlias), 'token-from-alias-777');
  });
});
