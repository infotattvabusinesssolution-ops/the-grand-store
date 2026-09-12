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
      enum: ["home_delivery", "postnet_pickup", "international_courier"],
      default: "home_delivery",
    },
    pickupLocation: {
      locationId: String,
      name: String,
      address: String,
    },

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
      ],
      default: "Payment Pending",
    },

    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },

    // Custom information
    hsCode: { type: String },
    declaredValue: { type: Number },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Shipment", shipmentSchema);
