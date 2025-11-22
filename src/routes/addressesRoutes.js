const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Idempotent endpoint to find or create an address normalized by hash
router.post('/find-or-create', addressController.findOrCreate);

module.exports = router;
