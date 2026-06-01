const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');
const { validateItemInput } = require('../middleware/validator');

// PUBLIC
router.get('/', itemController.getItems);

// ADMIN – specific routes BEFORE /:id to avoid param conflicts
router.get('/admin', auth, itemController.getItemsAdmin);
router.get('/stats', auth, itemController.getStats);

// ADMIN – single item
router.get('/:id', auth, itemController.getItem);

// ADMIN – create
router.post('/', auth, validateItemInput, itemController.createItem);

// ADMIN – update
router.put('/:id', auth, validateItemInput, itemController.updateItem);

// ADMIN – soft delete
router.delete('/:id', auth, itemController.deleteItem);

// ADMIN – update status only
router.patch('/:id/status', auth, itemController.updateStatus);

module.exports = router;
