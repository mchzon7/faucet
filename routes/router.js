const express = require('express');
const homeController = require('../controllers/homeController');
const blogController = require('../controllers/blogController');

const router = express.Router();

router.get('/', homeController.getHomePage);
router.get('/blog', blogController.getBlogIndex);
router.get('/blog/:slug', blogController.getBlogPost);

module.exports = router;
