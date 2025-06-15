require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const flash = require("connect-flash");
const activ = require(process.env.activ);
const routhptc = require("./routh/routh");
const transac = require("./routh/dashbord");
const refer = require("./routh/referral");
const withdraw = require(process.env.withdraw);
const progres = require("./routh/progress");
const ptc3 = require("./routh/ptc");
const userprofile = require("./routh/profile");
const mathcaptcha = require("./routh/mathcaptcha");
const typingcatcha = require("./routh/typingcatcha");
const authRouter = require("./controllers/Authcontrollers");
const verified = require("./controllers/senduserOTP");
const FBsubmit = require("./routh/FacebookID");
const Admin = require("./Admin/admin");
const Getusers = require("./Admin/getallusers");
const methodOverride = require("method-override");
const getalltrx = require("./Admin/getalltrx");
const SendMailtoUsers = require("./Admin/Sendmail");
const Admintaskget = require("./Admin/Admintaskget");
const getlinks = require("./Admin/GetLinks");
const TrackIP = require("./Admin/TrackIP");
const BannerAD = require("./Admin/BannerAds");
const Visitpages = require("./routh/visitpages");
const privacy = require("./routh/privacy");






const app = express();
const PORT = 8000;
app.use(express.json());
app.use(express.urlencoded({extended:true}));



//Middleware
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(
    session({
        secret: "faucet-secret",
        resave: false,
        saveUninitialized: false,
    })
);




// Middleware for flash
app.use(flash());

// Make flash message available
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    next();
});

mongoose.connect(process.env.MANGODB,)
.then(()=>{
    console.log("connected to the database");
})
.catch((err)=>{
    console.log(err);
});

app.use("/activities", activ);
app.use("/track-link", routhptc);
app.use("/", transac);
app.use("/", refer);
app.use("/", withdraw);
app.use("/", progres);
app.use("/", ptc3);
app.use("/", userprofile);
app.use("/", mathcaptcha);
app.use("/", typingcatcha);
app.use("/", authRouter);
app.use("/", verified);
app.use("/", FBsubmit);
app.use("/", Admin);
app.use("/", Getusers);
app.use("/", getalltrx);
app.use("/", SendMailtoUsers);
app.use("/", Admintaskget);
app.use("/", getlinks);
app.use("/", TrackIP);
app.use("/", BannerAD);
app.use("/", Visitpages);
app.use("/", privacy);


app.listen(PORT, ()=> console.log(`server is running at http://localhost${PORT}`));
