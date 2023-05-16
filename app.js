//require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();




app.set('view engine','ejs');

app.use('/uploads', express.static('uploads'));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
    secret: "our farmers project",
    resave: false,
    saveUninitialized: false,

}));


app.use(passport.initialize());
app.use(passport.session());
/*
mongoose.connect("mongodb://localhost:27017/farmersDB",{useNewUrlParser:true}).then(function(err){
  //console.log(err);
  console.log("Connected mongoose");
}); */

//mongoose.connect("mongodb+srv://subhash:subbu143@cluster0.6eumtl4.mongodb.net/todolistDB",{useNewUrlparser : true});
/*
mongoose.connect("mongodb+srv://andekishore:Kishore-1506@cluster0.szmohag.mongodb.net/farmersDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function(err){

  console.log("Mongoose connected");
});*/


mongoose.connect("mongodb://localhost:27017/farmersDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function(){

  console.log("Mongoose connected");
});

//mongoose.connect("mongodb+srv://andekishore:Kishore-1506@cluster0.szmohag.mongodb.net/?retryWrites=true&w=majority/farmersDB", {useNewUrlParser: true});
//mongoose.set("useCreateIndex", true);
//mongoose.set('bufferCommands',false);
const userSchema = new mongoose.Schema({
  name:String,
  email:String,
  mobileNum:String,
  url:String
});
const User = new mongoose.model("User",userSchema);
const productSchema = {
    farmername:String,
    name:String,
    quantity:String,
    image:{
        name:String,
        data:Buffer,
        contentType:String
    },
    price:Number,
    mobileNum:String
};
const farmerSchema = new mongoose.Schema({

    username:String,
    password:String,

    products:[productSchema]
});

farmerSchema.plugin(passportLocalMongoose);

const Farmer = new mongoose.model("Farmer",farmerSchema);
passport.use(Farmer.createStrategy());
passport.serializeUser(Farmer.serializeUser());
passport.deserializeUser(Farmer.deserializeUser());


const upload = multer({dest:'uploads/'});
app.get("/",function(req,res){
  Farmer.find({}).then(function(images){
   // console.log(images[0].products[2].image.data);
    if(images){
     res.render("home",{images:images});

    }

  });
});

app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/postcrops", function(req, res){
    //res.send("In postcrops route");

    if (req.isAuthenticated()){

        //console.log("postcrops entered");
        Farmer.find({username:req.user.username}).then(function(images){
         // console.log(images[0].products[2].image.data);
          if(images){
           res.render("postcrops",{images:images});
           //res.render("postcrops");
          }

        });



    } else {
      res.redirect("/login");
    }
});
app.post("/postcrops", upload.single('myImage'),function(req, res){


    const product = {
        farmername:req.body.farmername,
        name:req.body.name,
        quantity:req.body.quantity,
        image:{
          name:req.file.originalname,
          data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)),
          contentType:req.file.mimetype
        },
        price:req.body.price,
        mobileNum:req.body.mobileNum

    }
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);


    Farmer.findOne({username:req.user.username}).then(function(foundUser){
        if(foundUser){
            foundUser.products.push(product);
            foundUser.save();
            res.redirect("/postcrops");
        }
    });

  });

app.post("/register",function(req,res){

    Farmer.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/postcrops");
          });
        }
    });

});


app.post("/login",function(req,res){
    const user = new Farmer({
        username: req.body.username,
        password: req.body.password
      });

      req.login(user, function(err){
        if (err) {
          console.log("incorrect");

        } else {
          passport.authenticate("local",{ failureRedirect: '/login', failureMessage: true })(req, res, function(){
            res.redirect("/postcrops");


          });
        }

      });
});

app.get("/products/:i/product/:j/",function(req,res){
  console.log(req.params.i);
  console.log(req.params.j);
  Farmer.find({}).then(function(images){
    // console.log(images[0].products[2].image.data);
     if(images){
      res.render("product",{images:images,i:req.params.i,j:req.params.j});

     }

   });
});

app.get("/success",function(req,res){
  res.render("success");
});
app.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/products",function(req,res){
     const newUser = new User({
      name:req.body.name,
      email:req.body.email,
      mobileNum:req.body.mobileNum,
      url:req.originalUrl
     });
     newUser.save().then(function(err){
      res.redirect("success");
     });
});



app.listen(3000||process.env.PORT,function(){
    console.log("Server started on port 3000");
});
