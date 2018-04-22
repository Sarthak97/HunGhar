var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    flash = require("connect-flash"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    Request = require("./models/request");

//mongoose.Promise = global.Promise;
// mongoose.connect(process.env.DATABASEURL,{useMongoClient: true});
mongoose.connect("mongodb://localhost/hackathon2");

app.use(flash());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");

app.use(require("express-session")({
    secret: "i AM THE BIGGER MAN!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Schema

var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created : {type:Date, default: Date.now}
});
var Blog = mongoose.model("Blog",blogSchema);








//INDEX
app.get("/",function(req,res){
    res.render("new");
});

//HOME PAGE
app.get("/home",function(req,res){
    res.render("home");
});

app.get("/locate", isLoggedIn,function(req,res){
    res.render("locate");
});

app.get("/success",function(req,res){
    Blog.find({},function(err,blogs){
       if(err){
           console.log("Error!");
       } 
       else {
           res.render("success",{blogs:blogs});
       }
    });
});


app.get("/success/share",function(err,res){
   res.render("share"); 
});
app.post("/success", function(req, res){
    // create blog
    console.log(req.body);
    console.log("===========")
    console.log(req.body);
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("share");
        } else {
            //then, redirect to the index
            res.redirect("/success");
        }
    });
});
//requests
app.get("/form", isLoggedInNGO,function(req,res){
    //console.log(req);
    res.render("form1");
});

app.get("/form", isLoggedInDonor,function(req,res){
    //console.log(req);
    res.render("form2");
});


app.post("/form1", isLoggedInNGO,function(req,res)
{
    var request = new Request({claim: 'NGO', type: req.body.type,  amount : req.body.amt});
    request.save(function(err,req1) 
    {
        if(err)
            console.log(err);
        else
            console.log(req1);
    });
});

app.post("/form1", isLoggedInDonor,function(req,res)
{
    var request = new Request({claim: 'Donor', type: req.body.type,  amount : req.body.amt});
    
});






//LOGIN
app.get("/login",function(req,res){
    res.render("login");
});

app.get("/login/NGO",function(req,res){
    res.render("loginNGO");
});

app.get("/login/Donor",function(req,res){
    res.render("loginNGO");
});

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/home",
        failureRedirect: "/login",
        failureFlash : "Invalid Credentials",
        successFlash : "Welcome!"
    }), function(req,res){
});


//SIGNUP
app.get("/signup",function(req,res){
    res.render("signupMain");
});

app.get("/signup/NGO",function(req,res){
    res.render("signupNGO");
});

app.get("/signup/Donor",function(req,res){
    res.render("signupDonor");
});

app.post("/signup",function(req,res){
    var newUser = new User({type: req.body.type, username: req.body.username, contact : req.body.contact, location : req.body.locate});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.redirect("/signup");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome, " + user.username + "!");
            res.redirect("/home"); 
        });
    });
});

//LOGOUT
app.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/home");
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Middleware
function isLoggedInNGO(req, res, next){
    //console.log(req);
    if(req.isAuthenticated() && req.user.type === "NGO"){
        return next();
    }
    req.flash("error","Please login first!")
    res.redirect("/login");
}

function isLoggedIn(req, res, next){
    //console.log(req);
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","Please login first!")
    res.redirect("/login");
}

function isLoggedInDonor(req, res, next){
    //console.log(req);
    if(req.isAuthenticated() && req.user.type === "Donor"){
        return next();
    }
    req.flash("error","Please login first!")
    res.redirect("/login");
}

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Server Started.");
});