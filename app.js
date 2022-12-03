require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const User = require("./model/user.js");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.set("view engine", "ejs");
// middlewares
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://localhost:27017/test", {
    // useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to mongodb.");
  })
  .catch((e) => {
    console.log(e);
  });

const requireLogin = (req, res, next)=>{
  if(!req.session.isVerified){
    res.redirect("/login")
  }else{
    next()
  }
}

app.get("/", (req, res) => {
  res.send("Hi!");
});

// 處理 signup
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});
app.post("/signup", async (req, res, next) => {
  let { username, password } = req.body;
  let userIsExist = await User.findOne({ username })
  console.log(userIsExist);
  // 處理重複註冊
  if(userIsExist){
    res.send("Username has been used.")
  }else{
    // 進行加密後並儲存
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) {
        next(err);
      }
      bcrypt.hash(password, salt, (err, hashedPassword) => {
        if (err) {
          next(err);
        }
        console.log("The salt is: " + salt);
        let newUser = new User({ username, password: hashedPassword });
        console.log("The hash is: " + hashedPassword);
        try {
          newUser
            .save()
            .then(() => {
              res.send("Data saved! Thank you" + username);
            })
            .catch((e) => {
              res.send("Error!");
            });
        } catch (err) {
          next(err);
        }
      });
    });
  }
});

// 處理 login
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.post("/login", async (req, res, next) => {
  let { username, password } = req.body;
  try {
    let foundUser = await User.findOne({ username });
    console.log(foundUser);
    if (!foundUser) {
      res.send("User not found!");
    } else {
      bcrypt.compare(password, foundUser.password, (err, result) => {
        if(err){
          next(err)
        }
        if (result === true) {
          req.session.isVerified = true
          req.session.username = username
          res.redirect("/secret");
        } else {
          res.send("Password or username not correct.")
        }
      });
    }
  } catch (error) {
    next(e);
  }
});

app.get("/secret", requireLogin, (req, res) => {
    res.render("secret.ejs", req.session);
})
app.get("/logout", (req, res) => {
  req.session.isVerified = false
  res.send("You have signed out!")
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("something get wrong.");
});

app.listen(3000, () => {
  console.log("Server running on port 3000.");
});
