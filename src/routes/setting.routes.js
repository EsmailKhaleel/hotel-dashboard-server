const express = require('express');
const router = express.Router();
const {
    getSettings,
    createSettings,
    updateSettings,
    resetSettings
} = require('../controllers/setting.controller');

// Get settings
router.get('/', getSettings);

// Create new settings
router.post('/', createSettings);

// Update settings
router.patch('/', updateSettings);

// Reset settings to default
router.post('/reset', resetSettings);

module.exports = router;
