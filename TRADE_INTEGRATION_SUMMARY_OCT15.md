# Grand Store Global — Daily Work & Change Log (October 15, 2026)

## 📌 Executive Summary
Completed the end-to-end integration of the **B2B International Trade Platform** with the **Retail Marketplace**, committed all code to GitHub (`origin/main`), and deployed the latest versions to both the **Global** and **Local South Africa** servers at `191.215.37.241`.

---

## 🛠️ Complete List of Changes Made Today

### 1. Vendor Experience (Producer Portal)
* **Multi-Tier Volume Pricing (B2B Bulk Export Tiers):**
  * Added an interactive case pricing table inside the Product Editor under *Wholesale & Trade Pricing*.
  * Allows producers to set custom case quantity tiers (`minCases`, `maxCases`, `pricePerCase`, `notes`).
  * Added **"Load Preset Tiers"** button to auto-generate standard bands (10–49 wholesale, 50–99 pallet with 8% discount, 100+ container load with 15% discount).
  * Automatically calculates equivalent price per bottle.
  * Files modified:
    * `grand-store/frontend/src/features/vendor/AddProduct.jsx`
    * `grand-store/frontend/src/features/vendor/EditProduct.jsx`

### 2. Dual-Channel Inventory Protection (Backend)
* **Stock Locking Engine:**
  * Added `reservedTradeStock` field to the `Product` schema.
  * Physical bottle inventory is guarded: when an international trade consignment or order is confirmed, inventory is locked without deleting the product from the retail storefront.
  * Files modified:
    * `grand-store/backend/models/Product.js`
    * `grand-store/backend/controllers/crm/crmExportController.js`

### 3. Commercial Trade Order Architecture (Backend & Database)
* **Official Order Model (`TradeOrder.js`):**
  * Generates official B2B trade order codes (`TO-YYYY-XXXXX`).
  * Tracks consignor, consignee, Incoterms, container packaging, pricing currency, financial ledger, payment terms, and milestone timelines.
  * 1-Click conversion endpoint: `POST /api/crm/export/:id/convert-to-order`.
  * Files created/modified:
    * `grand-store/backend/models/TradeOrder.js` *(New)*
    * `grand-store/backend/routes/crmRoutes.js`
    * `grand-store/backend/controllers/crm/crmExportController.js`

### 4. Buyer Quotation Review & Digital Sign-off Portal
* **Public Buyer Acceptance Portal:**
  * Route: `/trade/quote/:code` (e.g. `/trade/quote/EXP-2026-0001`).
  * Shows international buyers their full itemization breakdown, Incoterms, packaging specs, and SWIFT/IBAN wire routing instructions.
  * Includes a digital sign-off modal with signatory name, job title, and acceptance stamp.
  * Upon sign-off, automatically converts the quotation to an active `TradeOrder` (`TO-YYYY-XXXXX`) and locks cellar inventory.
  * Files created/modified:
    * `grand-store/frontend/src/trade/BuyerQuoteReview.jsx` *(New)*
    * `grand-store/frontend/src/App.jsx`
    * `grand-store/backend/controllers/tradeEnquiryController.js`
    * `grand-store/backend/routes/tradeEnquiryRoutes.js`

### 5. CRM Global Trade Workspace Enhancements
* **Enquiry Slideover Actions:**
  * **"Proforma PDF":** Executive PDF download with Grand Store branding, itemization, Incoterms, and bank wire routing.
  * **"Print Sheet":** Printable proforma invoice view.
  * **"Copy Buyer Link":** One-click copy of the `/trade/quote/:code` link to share with buyers.
  * **"Convert to Trade Order":** 1-click legal order conversion with transactional inventory reservation.
* **4th Tab: "Trade Analytics & Funnel":**
  * **Executive KPI Cards:** Total Trade Orders, Gross Export GMV ($), Platform Commissions (Settled vs Pending), and Total Export Cases Shipped.
  * **Conversion Funnel:** Visual progression tracking through RFQs, requirements verified, quotations prepared, negotiations, confirmed orders, and customs cleared.
  * **Buyer Demand Heatmap:** Case demand broken down by destination country (e.g. UAE, UK, Singapore, USA).
  * **Customs & Document Expiry Monitor:** Real-time scanner for vendor licenses, excise documents, and health certificates expiring within 30 days.
  * **Commercial Trade Orders Register:** Live table of all converted `TradeOrder`s showing status and locked inventory.
  * Files created/modified:
    * `grandstore-crm/src/pages/CrmExportTradePage.jsx`
    * `grandstore-crm/src/utils/proformaPdfGenerator.js` *(New)*
    * `grandstore-crm/src/services/crmApi.js`

### 6. Local South Africa Storefront Build Fix
* Added missing `imageUtils.js` to `grand-storelocal/frontend/src/utils/imageUtils.js`, resolving build issues and enabling clean production compilation.

---

## 🚀 Git & Server Deployment Details

### Git Commits
* `a065882`: *feat(trade): complete B2B international trade platform integration with multi-tier volume pricing, proforma PDF generator, trade order conversion, and analytics*
* `50143ad`: *fix(storelocal): add missing imageUtils.js for frontend build*
* Repository: `https://github.com/infotattvabusinesssolution-ops/the-grand-store.git` (Branch: `main`)

### Live Server Deployment (`191.215.37.241`)
| Service | URL / Port | Status |
| :--- | :--- | :--- |
| **Global Marketplace** | `https://grandstoreglobal.com` | ✅ Live & Updated (Built) |
| **Local Store (South Africa)** | `https://grandstore.co.za` | ✅ Live & Updated (Built) |
| **Global CRM** | `https://crm.grandstoreglobal.com` | ✅ Live & Updated (Built) |
| **Backend API** | `https://api.grandstoreglobal.com` (Port 5015) | ✅ Online (PM2 ID: 14) |
