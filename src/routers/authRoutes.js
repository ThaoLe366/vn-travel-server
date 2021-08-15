const { User } = require("../models/index");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const dotenv=require('dotenv')

dotenv.config({ path: "./config.env" });
//Create new user by email and password
router.post("/register", async (req, res) => {
  //genarate new password with salt = 10
  const salt = await bcrypt.genSaltSync(10);
  const createHashPassword = await bcrypt.hashSync(req.body.password, salt);
  let user = new User({
    fullName: req.body.fullName,
    email: req.body.email,
    password: createHashPassword,
  });
  const snapshot = await User.find({ email: req.body.email });
  if (snapshot.length > 0) {
    return res.status(500).json({
      message: "User exist",
      count: 0,
      users: [],
    });
  }
  user = await user.save();

  if (!user) {
    return res.status(500).json({
      message: "Cannot create user",
      count: 0,
      users: [],
    });
  }

  return res.status(200).json({
    message: "Create user successfully",
    count: 1,
    users: { user },
  });
});

//Login with email and password
router.post("/login/users", async (req, res) => {
  const snapshot = await User.findOne({ email: req.body.email });
  if (snapshot.length < 0) {
    console.log(snapshot);
    return res.status(500).json({
      message: "User not exist",
      count: 0,
      users: [],
    });
  }
  const passwordHash = snapshot.password;
  const enterPassword = req.body.password;
  bcrypt.compare(enterPassword, passwordHash, function (err, result) {
    if (result == true) {
      const tokenGenerate = jwt.sign(
        {
         
          userAuth:snapshot
        },
        process.env.SECRET_KEY,
        {expiresIn: '1h' }
      );
      return res.status(200).json({
        message: "Login successfully",
        count: 1,
        token: tokenGenerate,
      });
    } else {
      return res.status(500).json({
        message: "Password are incorrect",
        count: 0,
        users: [],
      });
    }
  });
});

//Login with  google api
router.post("/login", requireAuth, async (req, res, next) => {
  const snapshot = await User.findOne({ email: req.body.email });
  if (!snapshot) {
    let newUser = new User({
      fullName: req.body.userAuth.fullName,
      email: req.body.email,
      password: "",
    });

    newUser = await newUser.save();

    if (!user) {
      return res.status(500).json({
        message: "Cannot create user",
        count: 0,
        users: [],
      });
    } else {
      return res.status(200).json({
        message: "Create user successfully",
        count: 1,
        users: newUser,
      });
    }
  } else {
    if (req.query.userRole) {
      if (snapshot.isUser == req.query.userRole) {
        //TODO: Update user
        return res.status(200).json({
          message: "User login",
          count: 1,
          user: snapshot,
          token: req.headers.authorization,
        });
      } else {
        return res.status(500).json({
          message: "Bad information",
          count: 0,
          users: [],
        });
      }
    } else {
      return res.status(500).json({
        message: "Missing role of user ",
      });
    }
  }
});
module.exports = router;
