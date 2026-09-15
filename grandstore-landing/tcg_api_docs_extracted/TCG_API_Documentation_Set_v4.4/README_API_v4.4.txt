TCG API DOCUMENTATION SET v4.4

Files
- TCG_API_QuickStart_v4.4.docx
- TCG_API_Developer_Reference_v4.4.docx
- TCG_API_FAQ_and_Troubleshooting_v4.4.docx
- TCG_Locker_API_Examples_v1.1.docx

Changes from v4.3
- Added a new "Webhooks" section to the Developer Reference guide: webhook calls (e.g. shipment status/tracking updates) originate from Courier Guy's servers to your endpoint, so firewall/IP whitelisting is needed if inbound traffic is restricted. Live source IP: 13.244.230.182 (api.portal.thecourierguy.co.za). Sandbox source IP: 13.247.30.105 (api.shiplogic.com).
- Renamed TCG_Locker_API_Examples_v1.0.docx to TCG_Locker_API_Examples_v1.1.docx so the filename matches its internal version (was mismatched in v4.3 — internal version said 1.1, filename still said 1.0).

Changes from v4.2
- Added ECORR (Economy Road, Regional-to-Regional) as a real, distinct third Economy Road service alongside ECO (National) and ECOR (Regional), everywhere ECO/ECOR are listed as selectable service codes.
- Named the service codes explicitly in the existing "3 zones" weight-tier note: National = ECO, Regional = ECOR, Regional-to-Regional = ECORR.
- Added a PUDO Locker/Kiosk fuel-surcharge note to the Locker API Examples guide: routes fully within the locker/kiosk network carry no fuel surcharge, routes touching a physical Door carry half the standard fuel levy.

Changes from v4.1
- Updated for the 1 September 2026 rate card: LOX renamed to LPP (Local Priority Parcel), LOF renamed to LPF (Local Priority Flyer), LSE renamed to LSP (Local Same Day Parcel).
- Added a note that Economy Road (ECO/ECOR) services are now tiered by weight into 6 bands across 3 zones rather than a single flat rate.
- Preserved existing "(formerly OVN)"/"(formerly OVNR)" historical naming notes for PRI/PRIR unchanged.

Changes from v4.0
- Added PRI (formerly OVN) and PRIR (formerly OVNR) naming notes.
- Clarified locker, kiosk, and pickup-point support: integrations@tcglocker.co.za.
- Added a plain-language Locker API examples guide based on Locker API docs.pdf.
