import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Component checks only: no database, campaign sends or browser session needed.
const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-ui-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom'
});
after(() => server.close());
const { default: StatCard } = await server.ssrLoadModule('/src/components/common/StatCard.jsx');
const { default: OrderBoardCard } = await server.ssrLoadModule('/src/components/orders/OrderBoardCard.jsx');

function buttons(element) {
  if (!React.isValidElement(element)) return [];
  return [
    ...(element.type === 'button' ? [element] : []),
    ...React.Children.toArray(element.props.children).flatMap(buttons)
  ];
}

const order = {
  _id: 'order123', orderId: 'GS-1001', customerName: 'A customer with a long name',
  customerPhone: '+27 11 123 4567', totalPrice: 1234567,
  shippingAddress: { city: 'Cape Town', province: 'Western Cape' },
  orderItems: [{ name: 'A long product name for an allocated bottle', quantity: 2 }],
  createdAt: '2026-09-25T12:00:00Z'
};

test('stat cards keep zero values and support the existing count prop', () => {
  assert.match(renderToStaticMarkup(React.createElement(StatCard, { title: 'Zero', value: 0, count: 7 })), />0<\/span>/);
  assert.match(renderToStaticMarkup(React.createElement(StatCard, { title: 'Count', count: 7 })), />7<\/span>/);
});

test('clickable stat cards use keyboard-accessible buttons and preserve the handler', () => {
  let clicked = false;
  const card = StatCard({ title: 'Campaigns', value: 5, active: true, onClick: () => { clicked = true; } });
  assert.equal(card.type, 'button');
  assert.equal(card.props.type, 'button');
  assert.equal(card.props['aria-pressed'], true);
  card.props.onClick();
  assert.equal(clicked, true);
  assert.equal(StatCard({ title: 'Read only' }).type, 'div');
});

test('loading metrics do not display a false zero', () => {
  const html = renderToStaticMarkup(React.createElement(StatCard, { title: 'Sales', value: 0, loading: true }));
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /…/);
  assert.doesNotMatch(html, />0<\/span>/);
});

for (const key of ['newOrders', 'vendorProcessing']) {
  test(`${key} uses the same card structure and both actions open the original order`, () => {
    const opened = [];
    const card = OrderBoardCard({ lane: { key }, item: order, onOpenOrder: value => opened.push(value) });
    const html = renderToStaticMarkup(card);
    assert.match(html, /crm-order-card/);
    assert.match(html, /crm-order-products/);
    assert.match(html, /crm-order-action/);
    assert.match(html, /GS-1001/);
    assert.equal(buttons(card).length, 2);
    buttons(card).forEach(button => button.props.onClick());
    assert.deepEqual(opened, [order, order]);
  });
}

test('shipment and ticket cards retain their separate inspection handlers', () => {
  for (const isCustomerTicket of [false, true]) {
    const item = { _id: 'exception1', order, isCustomerTicket, subject: 'Delivery query' };
    let resolved, ticket;
    const card = OrderBoardCard({
      lane: { key: 'shipmentIssues', isExceptionLane: true }, item,
      onOpenOrder() {}, onOpenTicket: value => { ticket = value; },
      onResolveException: value => { resolved = value; }
    });
    const html = renderToStaticMarkup(card);
    assert.match(html, /crm-order-card--exception/);
    buttons(card).at(-1).props.onClick();
    assert.equal(isCustomerTicket ? ticket : resolved, item);
    assert.equal(isCustomerTicket ? resolved : ticket, undefined);
  }
});

test('completed cards preserve settlement navigation', () => {
  let opened = false;
  const card = OrderBoardCard({ lane: { key: 'completed' }, item: order, onOpenOrder() {}, onViewSettlements: () => { opened = true; } });
  buttons(card).at(-1).props.onClick();
  assert.equal(opened, true);
});

test('missing contact, product and date data keep reserved card sections', () => {
  const card = OrderBoardCard({ lane: { key: 'newOrders' }, item: { _id: 'empty' }, onOpenOrder() {} });
  const html = renderToStaticMarkup(card);
  assert.match(html, /Phone not provided/);
  assert.match(html, /Location not provided/);
  assert.match(html, /View order for item details/);
  assert.match(html, /Date unavailable/);
  assert.doesNotMatch(html, /Invalid Date|undefined/);
});
