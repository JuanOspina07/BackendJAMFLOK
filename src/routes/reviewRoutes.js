const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.get("/resenas/negocio/:id", reviewController.getReviewsByBusiness);
router.post("/resenas", reviewController.createReview);

module.exports = router;
