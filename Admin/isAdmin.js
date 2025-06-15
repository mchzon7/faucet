module.exports = (req, res, next) => {
    if (req.session.user && req.session.user.role == "admin") {
      return next(); // Allow access
    }
    req.flash("error_msg", "Unauthorized access.");
    return res.redirect("/admin"); // Redirect unauthorized users
}