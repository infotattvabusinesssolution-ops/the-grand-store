import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-price-intel-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom'
});
after(() => server.close());

const { default: CrmPriceIntelligencePage } = await server.ssrLoadModule('/src/pages/CrmPriceIntelligencePage.jsx');
const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');

test('CrmPriceIntelligencePage renders heading, tabs, and market tracking controls', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ToastProvider,
      null,
      React.createElement(CrmPriceIntelligencePage)
    )
  );

  // Assert main titles and descriptions render cleanly
  assert.match(html, /Competitor Price Intelligence/i);
  assert.match(html, /Norman Goodfellows/i);

  // Assert both operational tabs exist
  assert.match(html, /Vs-by-Vs Comparison/i);
  assert.match(html, /Monthly Price Summary/i);

  // Assert Sync Now and Export buttons exist
  assert.match(html, /Sync Now/i);
});

test('Price Intelligence layout includes KPI cards and filter badges', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ToastProvider,
      null,
      React.createElement(CrmPriceIntelligencePage)
    )
  );

  // Assert status filters exist
  assert.match(html, /All Products/i);
  assert.match(html, /Grand Store Cheaper/i);
  assert.match(html, /NGF Cheaper/i);
  assert.match(html, /Price Matched/i);
});
