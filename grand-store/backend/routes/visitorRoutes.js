const express = require('express');
const router = express.Router();
const Counter = require('../models/Counter');

const BASE_VISITOR_COUNT = 549841;

// GET current visitor count
router.get(['/', '/count'], async (req, res) => {
  try {
    let counter = await Counter.findOne({ id: 'total_visitors' });
    if (!counter) {
      counter = await Counter.create({ id: 'total_visitors', seq: BASE_VISITOR_COUNT });
    } else if (counter.seq < BASE_VISITOR_COUNT) {
      counter.seq = BASE_VISITOR_COUNT;
      await counter.save();
    }
    res.json({ count: counter.seq });
  } catch (err) {
    res.status(500).json({ count: BASE_VISITOR_COUNT, error: err.message });
  }
});

// POST register a visitor hit and increment count by exactly 5
const handleHit = async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: 'total_visitors' },
      { $inc: { seq: 5 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const finalCount = Math.max(BASE_VISITOR_COUNT, counter.seq);
    if (counter.seq < BASE_VISITOR_COUNT) {
      counter.seq = BASE_VISITOR_COUNT;
      await counter.save();
    }
    res.json({ count: finalCount });
  } catch (err) {
    res.status(500).json({ count: BASE_VISITOR_COUNT, error: err.message });
  }
};

router.post(['/hit', '/record', '/'], handleHit);

module.exports = router;
