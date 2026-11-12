const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, unique: true, required: true }, // GS-YY-SHP-DEL-XXXXXX
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderRef: { type: String, required: true }, // GS-YY-SHP-ORD-XXXXXX
    subOrderRef: { type: String, index: true }, // Sub-Order Ref (GS-YY-SHP-ORD-XXXXXX-S01)
    vendorName: { type: String, default: '' },
    originCountry: { type: String, default: 'South Africa' },
    destCountry: { type: String, default: 'South Africa' },
    isInternational: { type: Boolean, default: false },
    courierName: { type: String, default: '' },
    serviceLevel: { type: String, default: '' },

    // Independent Sub-Order Consignment Items
    items: [
      {
        product: { type: String },
        name: { type: String },
        category: { type: String },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        option: { type: String },
        isCase: { type: Boolean, default: false },
        bottlesPerCase: { type: Number, default: 1 },
        image: { type: String },
        country: { type: String },
        hsCode: { type: String }
      }
    ],

    // Tripartite Financial Settlement Breakdown (Document Section 5)
    financialSplit: {
      merchandiseSubtotal: { type: Number, default: 0 },
      commissionRatePct: { type: Number, default: 15 },
      commissionAmount: { type: Number, default: 0 },
      vendorNetProceeds: { type: Number, default: 0 }, // Product price minus GS commission
      courierShippingCost: { type: Number, default: 0 }, // Allocated to courier account
      transitInsuranceCost: { type: Number, default: 0 }, // 1.5% allocated to insurance reserve
      payoutStatus: { type: String, enum: ['Pending', 'Eligible', 'Settled', 'On Hold'], default: 'Pending' },
      settlementReference: { type: String }
    },

    // Customs & International Compliance (Document Section 6 & 8)
    customsCompliance: {
      terms: { type: String, default: 'DAP' },
      commercialInvoiceRef: { type: String },
      hsCode: { type: String, default: '2204.21' },
      declaredValue: { type: Number, default: 0 }
    },

    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    pickupAddress: {
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
    deliveryAddress: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    deliveryMethod: {
      type: String,
      enum: ["home_delivery", "postnet_pickup", "pudo_locker", "international_courier", "aramex_delivery"],
      default: "home_delivery",
    },
    pickupLocation: {
      locationId: String,
      name: String,
      address: String,
      provider: String, // 'postnet' or 'tcg-locker'
    },
    tcgShipmentId: { type: String },
    tcgWaybillNumber: { type: String },
    tcgTrackingUrl: { type: String },
    tcgLabelUrl: { type: String },
    aramexWaybillNumber: { type: String },
    aramexServiceType: { type: String, default: 'ONP' },
    aramexLabelUrl: { type: String },
    aramexCollectionRef: { type: String },
    aramexTrackingUrl: { type: String },

    packageDetails: {
      weight: Number,
      length: Number,
      width: Number,
      height: Number,
    },

    // What the customer sees/pays for the whole journey
    customerShippingCharge: { type: Number, required: true },

    // Total cost paid by Grand Store to couriers (sum of leg costs)
    actualShippingCost: { type: Number, default: 0 },

    // High-level customer tracking
    mainTrackingNumber: { type: String },
    mainTrackingUrl: { type: String },

    // Courier Legs (for multi-leg shipments)
    legs: [
      {
        courierName: String,
        serviceLevel: String,
        trackingNumber: String,
        trackingUrl: String,
        cost: Number, // Internal commercial pricing for this leg
        origin: String,
        destination: String,
        status: {
          type: String,
          enum: ["Pending", "In Transit", "Completed", "Failed"],
          default: "Pending",
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "Payment Pending",
        "Order Confirmed",
        "Preparing",
        "Collected",
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Delayed",
        "Failed",
        "Cancelled",
      ],
      default: "Payment Pending",
    },

    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },

    // Custom information
    hsCode: { type: String },
    declaredValue: { type: Number },

    // === CRM LOGISTICS EXCEPTION EXTENSIONS (Non-breaking) ===
    logisticsException: {
      isException: { type: Boolean, default: false, index: true },
      exceptionType: {
        type: String,
        enum: ['none', 'courier_delay', 'failed_delivery', 'stock_shortage', 'address_query', 'customs_hold', 'damaged_in_transit'],
        default: 'none'
      },
      reportedAt: { type: Date },
      reportedBy: { type: String, enum: ['courier_webhook', 'operations_manual', 'customer'] },
      assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolutionNotes: { type: String },
      resolutionStatus: { type: String, enum: ['unresolved', 'in_investigation', 'resolved'], default: 'unresolved' }
    },
    courierWaybillUrl: { type: String },
    proofOfDeliveryUrl: { type: String }
  },
  { timestamps: true },
);

module.exports = mongoose.model("Shipment", shipmentSchema);
