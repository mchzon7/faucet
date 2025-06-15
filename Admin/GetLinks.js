const express = require("express");
const router = express.Router();
const SubmittedData = require("../models/link.model");
const isAdmin = require("./isAdmin");

// GET Submissions (with search + pagination)
router.get("/getlinks", isAdmin, async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const query = search
    ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    }
    : {};

  const total = await SubmittedData.countDocuments(query);
  const data = await SubmittedData.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.render("getlinks", {
    data,
    search,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit)
  });
});


// Delete submission
router.post("/getlinks/:id", isAdmin, async (req, res) => {
  await SubmittedData.findByIdAndDelete(req.params.id);
  res.redirect("/getlinks");
});

module.exports = router;