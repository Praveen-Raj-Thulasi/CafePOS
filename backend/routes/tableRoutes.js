const express = require('express');
const router = express.Router();
const { getFloorsAndTables, createFloor, createTable, updateTableStatus, updateTable, deleteFloor, deleteTable } = require('../controllers/tableController');
const { protect, admin } = require('../middleware/auth');

// Floor routes
router.route('/floors')
  .get(protect, getFloorsAndTables)
  .post(protect, admin, createFloor);

router.route('/floors/:id')
  .delete(protect, admin, deleteFloor);

// Table routes
router.route('/tables')
  .post(protect, admin, createTable);

router.route('/tables/:id')
  .put(protect, admin, updateTable)
  .delete(protect, admin, deleteTable);

router.route('/tables/:id/status')
  .put(protect, updateTableStatus); // Protect, but any employee can update status

module.exports = router;
