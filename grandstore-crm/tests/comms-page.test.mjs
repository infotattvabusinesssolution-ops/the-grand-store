import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-comms-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom'
});
after(() => server.close());

const { default: CrmCommsHubPage } = await server.ssrLoadModule('/src/pages/CrmCommsHubPage.jsx');
const { default: CrmRichTextEditor } = await server.ssrLoadModule('/src/components/common/CrmRichTextEditor.jsx');
const { default: BulkExcelRecipientsUploader } = await server.ssrLoadModule('/src/components/common/BulkExcelRecipientsUploader.jsx');
const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');

test('CrmRichTextEditor renders formatting toolbar and image attachment button', () => {
  const html = renderToStaticMarkup(
    React.createElement(CrmRichTextEditor, {
      value: '<p>Test message content with <strong>bold</strong> text.</p>',
      onChange: () => {},
      placeholder: 'Type here...'
    })
  );

  assert.ok(html.includes('Normal Text'), 'Text style dropdown should be present');
  assert.ok(html.includes('Insert Image'), 'Insert Image button should be present in toolbar');
  assert.match(html, /contentEditable="true"/i, 'contentEditable div should be present');
  assert.ok(html.includes('Insert Variable'), 'Personalization variable tray should be present');
  assert.ok(html.includes('{{name}}'), '{{name}} variable chip should be present');
  assert.ok(html.includes('{{phone}}'), '{{phone}} variable chip should be present');
});

test('BulkExcelRecipientsUploader renders file dropzone and template download', () => {
  const html = renderToStaticMarkup(
    React.createElement(ToastProvider, null,
      React.createElement(BulkExcelRecipientsUploader, {
        channel: 'email',
        onRecipientsChange: () => {}
      })
    )
  );

  assert.ok(html.includes('Excel / Spreadsheet (.xlsx, .csv)'), 'Excel tab should be rendered');
  assert.ok(html.includes('Paste Numbers / Emails'), 'Paste tab should be rendered');
  assert.ok(html.includes('Download Sample Excel Template'), 'Template download button should be rendered');
  assert.ok(html.includes('Upload Excel (.xlsx) or CSV'), 'Dropzone label should be rendered');
});

test('BulkExcelRecipientsUploader phone mode adapts labels', () => {
  const html = renderToStaticMarkup(
    React.createElement(ToastProvider, null,
      React.createElement(BulkExcelRecipientsUploader, {
        channel: 'whatsapp',
        onRecipientsChange: () => {}
      })
    )
  );

  assert.ok(html.includes('Phone Numbers'), 'Should mention phone numbers for whatsapp channel');
});

test('CrmCommsHubPage renders successfully with ToastProvider', () => {
  const html = renderToStaticMarkup(
    React.createElement(ToastProvider, null,
      React.createElement(CrmCommsHubPage, null)
    )
  );

  assert.ok(html.includes('Communications Centre'), 'Hub title should be rendered');
  assert.ok(html.includes('Compose with Template'), 'Compose action button should be rendered');
  assert.ok(html.includes('Log Phone Call'), 'Log Phone action button should be rendered');
});
