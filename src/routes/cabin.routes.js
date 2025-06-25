const express = require('express');
const router = express.Router();
const {
    getAllCabins,
    getCabin,
    createCabin,
    updateCabin,
    deleteCabin
} = require('../controllers/cabin.controller');
const upload = require('../utils/helper');

// Get all cabins
router.get('/', getAllCabins);

// Get single cabin
router.get('/:id', getCabin);

// Create new cabin
router.post('/', createCabin);

// Update cabin
router.patch('/:id', upload, updateCabin);

// Delete cabin
router.delete('/:id', deleteCabin);

module.exports = router;
