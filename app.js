var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    flash = require("connect-flash"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    Request = require("./models/request"),
    flag = "";

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

app.get("/success/:id",function(req,res){
    Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           res.redirect("/success");
       } else {
           res.render("show", {blog: foundBlog});
       }
   })
});


//requests
app.get("/form", isLoggedIn,function(req,res){
    if(flag === "NGO")
        res.render("form1");
    else
        res.render("form2");
});

app.get("/estimate", isLoggedIn,function(req,res){
    if(flag === "Donor")
        res.render("estimator");
});


app.post("/form1", isLoggedIn,function(req,res)
{
    if(flag === "NGO")
        var request = new Request({claim: 'NGO', type: req.body.type,  amount : req.body.amt});
    else
        var request = new Request({claim: 'Donor', type: req.body.type,  amount : req.body.amt});
    request.save(function(err,req1) 
    {
        if(err)
            console.log(err);
    });
    if(flag === "NGO")
    {
        Request.find({'claim': 'Donor', 'type': req.body.type, 'amount' : req.body.amt}, function(err, ret){
            if(err)
                console.log(err);
            else
            {
                if(ret != null)
                {
                    console.log(ret);
                    //res.send("<h2>We are ready to serve you. Go to your nearest pickup point.<h2>");
                    res.redirect("/locate");
                }
                else
                    res.redirect("/home");
            }
        });
    }
    else
        res.redirect("/home");
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
        //console.log(res);
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
    flag = "";
    res.redirect("/home");
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Middleware

function isLoggedIn(req, res, next){
    //console.log(req);
    if(req.isAuthenticated()){
        if(req.user.type === "NGO")
            flag = "NGO";
        else
            flag = "Donor";
        return next();
    }
    req.flash("error","Please login first!")
    res.redirect("/login");
}


app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Server Started.");
});