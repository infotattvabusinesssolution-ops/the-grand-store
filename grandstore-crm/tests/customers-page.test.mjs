import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CrmCustomersPage.jsx does not include corporate filter', () => {
  const filePath = path.resolve('src/pages/CrmCustomersPage.jsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verify Corporate filter button was removed
  assert.equal(content.includes("handleFilterType('corporate_client')"), false);
  assert.equal(content.includes('>Corporate<'), false);

  // Verify Retail, VIP, and Trade filter tabs are present
  assert.equal(content.includes("handleFilterType('')"), true);
  assert.equal(content.includes("handleFilterType('retail')"), true);
  assert.equal(content.includes("handleFilterType('vip_collector')"), true);
  assert.equal(content.includes("handleFilterType('trade_buyer')"), true);

  // Verify pagination controls are included
  assert.equal(content.includes('totalPages'), true);
  assert.equal(content.includes('handlePageSizeChange'), true);
  assert.equal(content.includes('handlePageChange'), true);
});
