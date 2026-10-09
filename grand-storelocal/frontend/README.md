# Grand Store Local — South African Luxury Wine & Spirits

The official frontend application for **The Grand Store (South Africa)** (`https://grandstore.co.za`).

Dedicated to fine South African wines from Stellenbosch, Franschhoek, Paarl, Robertson, and the Klein Karoo, as well as artisanal spirits, potstill brandies, and private winery tastings.

---

## Tech Stack
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: Tailwind CSS + Custom Obsidian Gold Luxury System
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Backend API**: [Grand Store Global Backend](https://api.grandstoreglobal.com)

---

## Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure the API endpoint is configured:
```env
VITE_API_URL=https://api.grandstoreglobal.com
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
The compiled assets will be output to the `dist/` directory.

---

## Deployment
This project deploys as static assets served by Nginx:
- **Server**: Ubuntu 24.04 VPS
- **Web Root**: `/var/www/grandstore-local/dist`
- **Domain**: `https://grandstore.co.za`
