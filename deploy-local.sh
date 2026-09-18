#!/bin/bash
set -e

echo "=== 1. Pulling latest code ==="
cd /var/www/grandstore-all
git pull

echo "=== 2. Building Grand Store Local ==="
cd /var/www/grandstore-all/grand-storelocal/frontend
npm run build

echo "=== 3. Setting permissions & reloading Nginx ==="
chown -R www-data:www-data /var/www/grandstore-all/grand-storelocal/frontend/dist
chmod -R 755 /var/www/grandstore-all/grand-storelocal/frontend/dist
systemctl reload nginx

echo "=== ✅ Grand Store Local is updated and live at https://grandstore.co.za ==="
