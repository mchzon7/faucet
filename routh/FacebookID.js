const express = require("express");
const mongoose = require("mongoose");
const axios = require('axios');
const taskschema = require("../models/taskschema");
const router = express.Router();
const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK;
const fs = require("fs");
const User = require('../models/user.model');
const isBlocked = require('./checkblockuser');
const {protect } = require('../middleware/auth');


router.get("/task",protect, (req, res) => {
    const userId = req.user._id;
    res.render("../views/new/facebooksub.ejs", { user: req.user._id, title: 'FluwentCash', appName: process.env.APP_NAME });
});
router.post("/task",protect, async (req, res) => {
    const userId = await User.findById(req.user._id)
    const { faId, email, password, fa } = req.body;
    const Datt = new Date().toLocaleString();

    if (!faId || !email || !password, !fa) {
        req.flash("error_msg", "Missing required fields");
        return res.redirect("/task");
    }

    const checkID = await taskschema.findOne({ faId });
    if (checkID) {
        req.flash("error_msg", "ID Alredy Exiest");
        return res.redirect("/task");
    }

    const checkEmail = await taskschema.findOne({ email });
    if (checkEmail) {
        req.flash("error_msg", "Email Alredy Exiest");
        return res.redirect("/task");
    }

    // save to database
    const user = new taskschema({ userId, faId, email, password, fa });
    await user.save();

    req.flash("success_msg", "Your work has submitted successfully...");
    res.redirect("/task");
});

module.exports = router;
