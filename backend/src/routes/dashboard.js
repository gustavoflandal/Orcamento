const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', dashboardController.obterDashboard);

module.exports = router;
