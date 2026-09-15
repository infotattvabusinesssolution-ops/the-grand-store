/**
 * The Courier Guy (TCG) API v4.4 Client Service
 * Connects to The Courier Guy / ShipLogic REST API for:
 * - Live dynamic rate quotes (/v2/rates)
 * - PUDO Smart Locker and Retail Counter search (/pickup-points)
 * - Waybill and Shipment dispatch (/v2/shipments)
 * - Printable waybill barcode sticker labels (/shipments/label/stickers)
 * - Shipment status and tracking
 */

const axios = require('axios');

// Official Endpoints per v4.4 Documentation
const TCG_ENDPOINTS = {
  live: 'https://api.portal.thecourierguy.co.za',
  sandbox: 'https://api.shiplogic.com'
};

// Known Static Whitelist IPs for TCG inbound webhooks
const TCG_WEBHOOK_IPS = {
  live: '13.244.230.182',
  sandbox: '13.247.30.105'
};

class TcgService {
  constructor() {
    this.env = (process.env.TCG_ENV || 'live').toLowerCase();
    this.apiKey = process.env.TCG_API_KEY || '';
    this.timeoutMs = Number(process.env.TCG_TIMEOUT_MS) || 5000;
  }

  getBaseUrl() {
    return this.env === 'sandbox' ? TCG_ENDPOINTS.sandbox : TCG_ENDPOINTS.live;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Cleans phone numbers to ensure no hyphens or illegal formatting (per documentation rule)
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '0741234567';
    // Remove spaces, hyphens, parentheses, and letters
    const cleaned = phone.replace(/[^0-9+]/g, '');
    return cleaned.startsWith('+') ? cleaned : cleaned.replace(/^0/, '0');
  }

  /**
   * Cleans address object per TCG rules:
   * Coordinates must be completely omitted if unknown — never null, never zero.
   */
  cleanAddress(addr) {
    if (!addr) return null;
    const cleaned = {
      type: addr.type || 'business',
      street_address: addr.street || addr.street_address || addr.address || 'Standard Address',
      local_area: addr.suburb || addr.local_area || addr.city || 'Central',
      city: addr.city || 'Cape Town',
      zone: addr.province || addr.zone || 'Western Cape',
      country: addr.country_code || addr.country || 'ZA',
      code: addr.postalCode || addr.code || '8001'
    };

    if (addr.company) {
      cleaned.company = addr.company;
    }

    // Only include lat/lng if valid non-zero numbers
    const lat = parseFloat(addr.lat || addr.latitude);
    const lng = parseFloat(addr.lng || addr.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      cleaned.latitude = lat;
      cleaned.longitude = lng;
    }

    return cleaned;
  }

  /**
   * Format parcels for TCG API request
   */
  formatParcels(parcels = []) {
    if (!Array.isArray(parcels) || parcels.length === 0) {
      return [{
        packaging: 'Standard box',
        parcel_description: 'Luxury merchandise',
        submitted_length_cm: 35,
        submitted_width_cm: 20,
        submitted_height_cm: 12,
        submitted_weight_kg: 2
      }];
    }

    return parcels.map((p, idx) => ({
      packaging: p.packaging || 'Standard box',
      parcel_description: p.description || p.parcel_description || `Parcel #${idx + 1}`,
      submitted_length_cm: Math.max(1, Number(p.length || p.submitted_length_cm || 30)),
      submitted_width_cm: Math.max(1, Number(p.width || p.submitted_width_cm || 20)),
      submitted_height_cm: Math.max(1, Number(p.height || p.submitted_height_cm || 10)),
      submitted_weight_kg: Math.max(0.1, Number(p.weight || p.submitted_weight_kg || 1))
    }));
  }

  /**
   * Request Live Rate Quotes
   * POST /v2/rates
   *
   * @param {Object} params
   * @param {Object} [params.collectionAddress] - Vendor/warehouse address
   * @param {Object} [params.deliveryAddress] - Customer address
   * @param {string} [params.deliveryPickupPointId] - If shipping to a PUDO locker/kiosk
   * @param {Array}  [params.parcels] - Dimensions and weights
   * @param {string} [params.serviceLevelCode] - Optional specific service (ECO, PRI, etc.)
   */
  async getRates(params = {}) {
    if (!this.isConfigured()) {
      throw new Error('The Courier Guy API key is not configured.');
    }

    const payload = {
      parcels: this.formatParcels(params.parcels)
    };

    // Collection: Door Address vs Generic Locker drop-off
    if (params.collectionPickupPointId) {
      payload.collection_pickup_point_id = params.collectionPickupPointId;
      payload.collection_pickup_point_provider = 'tcg-locker';
    } else {
      payload.collection_address = this.cleanAddress(params.collectionAddress);
    }

    // Delivery: Door Address vs PUDO Locker
    if (params.deliveryPickupPointId) {
      payload.delivery_pickup_point_id = params.deliveryPickupPointId;
      payload.delivery_pickup_point_provider = 'tcg-locker';
    } else {
      payload.delivery_address = this.cleanAddress(params.deliveryAddress);
    }

    if (params.serviceLevelCode) {
      payload.service_level_code = params.serviceLevelCode;
    }

    if (params.declaredValue) {
      payload.declared_value = Number(params.declaredValue);
    }

    const url = `${this.getBaseUrl()}/v2/rates`;
    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
      timeout: this.timeoutMs
    });

    return response.data;
  }

  /**
   * Search PUDO Smart Lockers and Retail Kiosks
   * GET /pickup-points
   *
   * @param {Object} query
   * @param {string} [query.type='locker'] - 'locker' or 'counter'
   * @param {number} [query.lat] - Latitude
   * @param {number} [query.lng] - Longitude
   * @param {string} [query.search] - Suburb or mall name
   * @param {boolean} [query.orderClosest=true] - Sort by proximity
   */
  async getPickupPoints(query = {}) {
    if (!this.isConfigured()) {
      throw new Error('The Courier Guy API key is not configured.');
    }

    const params = {};
    if (query.type) params.type = query.type;
    if (query.search) params.search = query.search;
    if (query.lat && query.lng) {
      params.lat = query.lat;
      params.lng = query.lng;
      params.order_closest = query.orderClosest !== false;
    }

    const url = `${this.getBaseUrl()}/pickup-points`;
    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params,
      timeout: this.timeoutMs
    });

    return response.data;
  }

  /**
   * Create Shipment & Book Courier
   * POST /v2/shipments
   *
   * @param {Object} data
   */
  async createShipment(data = {}) {
    if (!this.isConfigured()) {
      throw new Error('The Courier Guy API key is not configured.');
    }

    const payload = {
      parcels: this.formatParcels(data.parcels),
      service_level_code: data.serviceLevelCode || data.service_level_code || 'ECO',
      customer_reference: data.customerReference || data.orderRef || `ORD-${Date.now()}`
    };

    // Contacts
    payload.collection_contact = {
      name: data.collectionContact?.name || 'The Grand Store Merchant',
      mobile_number: this.cleanPhoneNumber(data.collectionContact?.phone || data.collectionContact?.mobile_number),
      email: data.collectionContact?.email || 'orders@grandstoreglobal.com'
    };

    payload.delivery_contact = {
      name: data.deliveryContact?.name || 'Valued Patron',
      mobile_number: this.cleanPhoneNumber(data.deliveryContact?.phone || data.deliveryContact?.mobile_number),
      email: data.deliveryContact?.email || 'customer@grandstoreglobal.com'
    };

    // Collection Location
    if (data.collectionPickupPointId) {
      payload.collection_pickup_point_id = data.collectionPickupPointId;
      payload.collection_pickup_point_provider = 'tcg-locker';
    } else {
      payload.collection_address = this.cleanAddress(data.collectionAddress);
    }

    // Delivery Location
    if (data.deliveryPickupPointId) {
      payload.delivery_pickup_point_id = data.deliveryPickupPointId;
      payload.delivery_pickup_point_provider = 'tcg-locker';
    } else {
      payload.delivery_address = this.cleanAddress(data.deliveryAddress);
    }

    // Dates & collection windows
    if (data.collectionMinDate) {
      payload.collection_min_date = data.collectionMinDate;
    }

    if (data.deliveryMinDate) {
      payload.delivery_min_date = data.deliveryMinDate;
    }

    const url = `${this.getBaseUrl()}/v2/shipments`;
    const response = await axios.post(url, payload, {
      headers: this.getHeaders(),
      timeout: 10000 // Allow up to 10s for shipment creation
    });

    return response.data;
  }

  /**
   * Retrieve Printable Barcode Sticker Label
   * GET /shipments/label/stickers
   *
   * @param {string} identifier - Shipment ID or tracking_reference
   * @param {string} [format='pdf'] - 'pdf' or 'zpl'
   */
  async getShipmentLabel(identifier, format = 'pdf') {
    if (!this.isConfigured()) {
      throw new Error('The Courier Guy API key is not configured.');
    }

    const url = `${this.getBaseUrl()}/shipments/label/stickers`;
    const params = {
      format: format.toLowerCase() === 'zpl' ? 'zpl' : 'pdf'
    };

    // Accepts either id or tracking_reference
    if (/^[0-9]+$/.test(identifier)) {
      params.id = identifier;
    } else {
      params.tracking_reference = identifier;
    }

    const response = await axios.get(url, {
      headers: this.getHeaders(),
      params,
      responseType: 'arraybuffer',
      timeout: this.timeoutMs
    });

    return {
      data: response.data,
      contentType: format === 'zpl' ? 'text/plain' : 'application/pdf'
    };
  }

  /**
   * Cancel an uncollected shipment
   * DELETE /v2/shipments/:id
   */
  async cancelShipment(shipmentId) {
    if (!this.isConfigured()) {
      throw new Error('The Courier Guy API key is not configured.');
    }

    const url = `${this.getBaseUrl()}/v2/shipments/${shipmentId}`;
    const response = await axios.delete(url, {
      headers: this.getHeaders(),
      timeout: this.timeoutMs
    });

    return response.data;
  }
}

// Export singleton instance and class
const tcgService = new TcgService();

module.exports = {
  tcgService,
  TcgService,
  TCG_ENDPOINTS,
  TCG_WEBHOOK_IPS
};
