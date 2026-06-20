const express = require('express');
const router = express.Router();
const { getUsers, archiveUser, changePassword, createUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router.route('/:id/archive')
  .put(protect, admin, archiveUser);

router.route('/:id/password')
  .put(protect, admin, changePassword);

module.exports = router;
