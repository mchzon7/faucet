const express = require("express");
const mongoose = require("mongoose");
const taskschema = require("../models/taskschema");
const router = express.Router();
const googlesheet = require("./googleSheet");
const fs = require("fs");

router.get("/task", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("FacebookID");
});
router.post("/task", async (req, res) => {
    const { faId, email, password, fa } = req.body;
    const userId = req.session.user._id;
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
    await googlesheet([faId, email, password, fa, Datt]);

    req.flash("success_msg", "Your work has submitted successfully...");
    res.redirect("/task");
});

module.exports = router;
