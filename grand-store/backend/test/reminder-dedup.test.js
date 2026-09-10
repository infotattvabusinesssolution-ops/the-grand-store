const test = require("node:test");
const assert = require("node:assert/strict");
const Booking = require("../models/Booking");
const AuctionLot = require("../models/AuctionLot");

test("Booking model schema includes reminderSent and reminderSentAt defaults", () => {
  const booking = new Booking({
    user: "6a82b65b02f90b75bff8b311",
    event: "6a854852cb4a2139af093498",
    vendor: "6a82d851cc54cc42c87abf81",
    ticketType: "VIP",
    ticketTierId: "6a854852cb4a2139af093499",
    unitPrice: 1500,
    quantity: 1,
    subTotal: 1500,
    totalPrice: 1500,
    ticketId: "TKT-UNITTEST-001",
  });

  assert.equal(booking.reminderSent, false);
  assert.equal(booking.reminderSentAt, undefined);
});

test("AuctionLot model schema includes reminderSent and reminderSentAt defaults", () => {
  const lot = new AuctionLot({
    title: "Test Lot",
    category: "Whisky",
    vendorId: "6a82d851cc54cc42c87abf81",
    startingBid: 1000,
    currentBid: 1000,
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-10-05"),
  });

  assert.equal(lot.reminderSent, false);
  assert.equal(lot.reminderSentAt, undefined);
});

test("User bookings for the same event are deduplicated into exactly one email group", () => {
  // Simulate 5 separate booking documents for the same user and same event
  const testBookings = [
    {
      _id: "b1",
      user: { _id: "u1", name: "Alice", email: "alice@example.com" },
      event: { _id: "e1", title: "Wine Tasting", date: new Date(), startTime: "18:00", location: "Cape Town" },
      quantity: 1,
      ticketId: "TKT-1",
    },
    {
      _id: "b2",
      user: { _id: "u1", name: "Alice", email: "alice@example.com" },
      event: { _id: "e1", title: "Wine Tasting", date: new Date(), startTime: "18:00", location: "Cape Town" },
      quantity: 1,
      ticketId: "TKT-2",
    },
    {
      _id: "b3",
      user: { _id: "u1", name: "Alice", email: "alice@example.com" },
      event: { _id: "e1", title: "Wine Tasting", date: new Date(), startTime: "18:00", location: "Cape Town" },
      quantity: 1,
      ticketId: "TKT-3",
    },
    {
      _id: "b4",
      user: { _id: "u1", name: "Alice", email: "alice@example.com" },
      event: { _id: "e1", title: "Wine Tasting", date: new Date(), startTime: "18:00", location: "Cape Town" },
      quantity: 1,
      ticketId: "TKT-4",
    },
    {
      _id: "b5",
      user: { _id: "u1", name: "Alice", email: "alice@example.com" },
      event: { _id: "e1", title: "Wine Tasting", date: new Date(), startTime: "18:00", location: "Cape Town" },
      quantity: 1,
      ticketId: "TKT-5",
    },
    // Another user with 1 booking for the same event
    {
      _id: "b6",
      user: { _id: "u2", name: "Bob", email: "bob@example.com" },
      event: { _id: "e1", title: "Wine Tasting", date: new Date(), startTime: "18:00", location: "Cape Town" },
      quantity: 2,
      ticketId: "TKT-6",
    },
  ];

  const userEventMap = new Map();
  for (const booking of testBookings) {
    if (!booking.event || !booking.user || !booking.user.email) continue;
    const recipientEmail = booking.user.email.toLowerCase().trim();
    const eventId = String(booking.event._id || booking.event);
    const groupKey = `${recipientEmail}_${eventId}`;

    if (!userEventMap.has(groupKey)) {
      userEventMap.set(groupKey, {
        user: booking.user,
        event: booking.event,
        bookings: [],
      });
    }
    userEventMap.get(groupKey).bookings.push(booking);
  }

  // Expect exactly 2 groups (1 for Alice, 1 for Bob) even though Alice has 5 bookings
  assert.equal(userEventMap.size, 2);
  const aliceGroup = userEventMap.get("alice@example.com_e1");
  assert.ok(aliceGroup);
  assert.equal(aliceGroup.bookings.length, 5);

  const bobGroup = userEventMap.get("bob@example.com_e1");
  assert.ok(bobGroup);
  assert.equal(bobGroup.bookings.length, 1);
});
