const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");

const passport = require("passport");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const FacebookStrategy = require("passport-facebook").Strategy;
const fetch = require("node-fetch");
const { generateCode } = require("../utils/Timezone");
const sendMail = require("../utils/sendMail");
const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});
//Verify token
const googleAuth = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: [process.env.GOOGLE_CLIENT_ID],
  });

  return ticket.getPayload();
};

// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: "877302712882660",
//       clientSecret: "bb08ee2f5f9c72d9b9a17ca26052e90f",
//       callbackURL: "http://localhost:5000/auths/login/facebook/callback",
//       profileFields: ["id", "displayname"],
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       //   return cb(err, user);
//       // });
//       // const { email, first_name, last_name } = profile._json;
//       // const userData = {
//       //   email,
//       //   firstName: first_name,
//       //   lastName: last_name
//       // };
//       // console.log(profile.id);
//       console.log(accessToken, refreshToken, profile);
//       const userData = {};
//       cb(null, userData);
//     }
//   )
// );
//Create new user by email and password
router.post("/register", async (req, res) => {
  //genarate new password with salt = 10
  try {
    const salt = await bcrypt.genSaltSync(10);
    const createHashPassword = await bcrypt.hashSync(req.body.password, salt);
    let user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: createHashPassword,
    });

    const snapshot = await User.find({
      email: req.body.email,
    });
    if (snapshot.length > 0) {
      return res.status(400).json({
        engMessage: "Email already taken",
        viMessage: "Email đã tồn tại.",
        success: false,
      });
    }

    user = await user.save();
    user = await User.populate(user, ["recentSearch.place"]);

    const tokenGenerate = jwt.sign(
      {
        userAuth: {
          id: user.id,
          email: user.email,
          isUser: user.isUser,
          image: user.image,
          name: user.fullName,
          aboutMe: user?.aboutMe,
        },
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "24h",
      }
    );
    return res.status(200).json({
      engMessage: "User created successfully",
      viMessage: "Tại tài khoản thành công",
      success: true,
      user: user,
      token: tokenGenerate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//Login with email and password
router.post("/login/users", async (req, res) => {
  //simple check validation
  if (req.query.userRole) {
    try {
      const snapshot = await User.findOne({
        email: req.body.email,
      }).populate("recentSearch.place");
      if (!snapshot) {
        return res.status(403).json({
          success: false,
          engMessage: "Account not exist.",
          viMessage: "Tài khoản không tồn tại.",
        });
      }
      const passwordHash = snapshot.password;
      const enterPassword = req.body.password;

      bcrypt.compare(enterPassword, passwordHash, function (err, result) {
        if (result == true) {
          if (req.query.userRole == String(snapshot.isUser)) {
            console.log(snapshot);
            if (!snapshot.isHidden) {
              const tokenGenerate = jwt.sign(
                {
                  userAuth: {
                    id: snapshot.id,
                    email: snapshot.email,
                    isUser: snapshot.isUser,
                    image: snapshot.image,
                    name: snapshot.fullName,
                    aboutMe: snapshot?.aboutMe,
                  },
                },
                process.env.SECRET_KEY,
                {
                  expiresIn: "24h",
                }
              );
              return res.status(200).json({
                success: true,
                engMessage: "Login successfully.",
                viMessage: "Đăng nhập thành công.",
                token: tokenGenerate,
                user: snapshot,
              });
            } else {
              return res.status(403).json({
                engMessage:
                  "Your account is blocked.Please contact admin to unlock. Email: nguyenhoang13166@gmail.com",
                viMessage:
                  "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin: nguyenhoang13166@gmail.com",
                success: false,
              });
            }
          } else {
            return res.status(403).json({
              engMessage: "Role of user is not allowed",
              viMessage: "Vai trò không hợp lệ.",
              success: false,
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            engMessage: "Username or password are incorrect",
            viMessage: "Tên người dùng hoặc mật khẩu không đúng.",
          });
        }
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  } else {
    return res.status(500).json({
      message: "Role of user is not allowed",
      successful: false,
    });
  }
});

//Login with  google api
router.post("/login/google", async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        message: "Access token not found",
      });
    }
    const token = authorization.split(" ")[1];
    const user = await googleAuth(token);
    let snapshot = await User.findOne({
      email: user.email,
    });
    if (!snapshot) {
      if (String(req.query.userRole) === "true") {
        const salt = await bcrypt.genSaltSync(10);
        const createHashPassword = await bcrypt.hashSync("", salt);

        let newUser = new User({
          fullName: user.name,
          email: user.email,
          password: createHashPassword,
          image: user.picture,
        });

        newUser = await newUser.save();
        newUser = await User.populate(newUser, ["recentSearch.place"]);

        if (!newUser) {
          return res.status(500).json({
            message: "Cannot create user",
            success: false,
          });
        } else {
          return res.status(200).json({
            message: "Create user successfully",
            success: true,
            user: newUser,
            token: token,
          });
        }
      } else {
        res.status(401).json({
          message: "Permission deny",
          success: false,
        });
      }
    } else {
      if (req.query.userRole) {
        if (String(snapshot.isUser) == req.query.userRole) {
          if (!snapshot.isHidden) {
            //Check type login
            const passwordHash = snapshot.password;
            const dummy = "";
            snapshot = await User.populate(snapshot, [
              "recentSearch.place",
              "favorite",
            ]);
            bcrypt.compare(dummy, passwordHash, function (err, result) {
              if (result == true) {
                return res.status(200).json({
                  message: "User login",
                  success: true,
                  user: snapshot,
                  token: token,
                });
              } else {
                return res.status(403).json({
                  message: "Your account login in another way",
                  success: false,
                });
              }
            });
          } else {
            res.status(403).json({
              message: "Your account is blocked",
              success: false,
            });
          }

          //TODO: Update user
        } else {
          return res.status(403).json({
            message: "Permission deny",
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
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

router.get("/verify", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.body.userAuth.id).populate(
      "recentSearch.place"
    );

    return res.status(200).json({
      message: "Token is valid",
      success: true,
      user: user,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

router.post("/login/facebook", async (req, res) => {
  try {
    const { userID, accessToken } = req.body;
    // let checkUrl = `https://graph.facebook.com/debug_token/?input_token=${accessToken}&
    // access_token=[app_token_or_admin_token]`;
    // fetch(checkUrl, { method: "GET" })
    //   .then((res) => res.json())
    //   .then(async (response) => {

    //   });

    let urlGraphFacebook = `https://graph.facebook.com/${userID}?fields=id,name,email,picture&access_token=${accessToken}`;

    fetch(urlGraphFacebook, {
      method: "GET",
    })
      .then((res) => res.json())
      .then(async (resspone) => {
        const { name, id } = resspone;
        if (typeof name == "undefined" || typeof id == "undefined") {
          return res.status(401).json({
            message: "Authentication failed",
            success: false,
          });
        }
        const snapshot = await User.findOne({
          email: id,
        });
        //If facebook user id not exist, create one
        if (!snapshot) {
          let newUser = new User({
            fullName: name,
            email: id,
            password: "",
          });

          newUser = await newUser.save();
          if (!newUser) {
            return res.status(500).json({
              message: "Cannot create user",
              success: false,
            });
          } else {
            return res.status(200).json({
              message: "Create user successfully",
              success: true,
              user: newUser,
              token: accessToken,
            });
          }
        } else {
          if (req.query.userRole) {
            if (String(snapshot.isUser) == req.query.userRole) {
              return res.status(200).json({
                message: "User login successfully",
                success: true,
                user: snapshot,
                token: accessToken,
              });
            } else {
              return res.status(500).json({
                message: "Permission deny",
                success: false,
              });
            }
          } else {
            return res.status(500).json({
              message: "Permission deny",
              success: false,
            });
          }
        }
      })
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({
          success: false,
          message: "Invalid connection",
        });
      });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
//@route GET v1/auths/send-email/:userEmail/:code
//@desc Request send email to get code reset password
//@access public
//@role use
router.get("/send-email/:userEmail/:code", async (req, res) => {
  try {
    //Get code and generate new code to send in Email
    const clientCode = +req.params.code;
    const verifyCode = generateCode(clientCode);

    //Send to email
    const html = `<p>Your verify code: ${verifyCode} </p>`;
    sendMail(req.params.userEmail, "VNTravel - Verify forgot password", html);
    return res.status(200).json({
      message: "Send verify code successful",
      success: true,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route GET v1/auths/passwords/verify/:code/:verifyCode
//@desc Verify correct code
//@access public
//@role all
router.get("/passwords/verify/:code/:verifyCode", async (req, res) => {
  try {
    //Verify code
    const code = +req.params.code;
    const resultVerify = generateCode(code);
    const verifyCode = req.params.verifyCode;
    if (resultVerify == verifyCode) {
      res.status(200).json({
        message: "Verify code correct",
        success: true,
      });
    } else {
      res.status(403).json({
        message: "Incorrect code",
        success: false,
      });
    }
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route PUT v1/auths/passwords
//@desc Change password with code and key
//@access PUBLIC
//@role all
router.put("/passwords", async (req, res) => {
  try {
    //Body {code:"", verifyCode:"", password,"", email:""}
    //Verify code
    const code = +req.body.code;
    const resultVerify = generateCode(code);
    const verifyCode = req.body.verifyCode;

    if (resultVerify == verifyCode) {
      //Hash password
      const salt = await bcrypt.genSaltSync(10);
      const newPasswordHash = await bcrypt.hashSync(req.body.password, salt);
      const user = await User.findOneAndUpdate(
        { email: req.body.email },
        { password: newPasswordHash },
        { new: true }
      ).exec(function (err, documents) {
        if (!err) {
          return res.status(200).json({
            message: "Changing password successful",
            success: true,
          });
        } else {
          console.log("Error ", err);
          return res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
      });
    } else {
      res.status(403).json({
        message: "Incorrect code",
        success: false,
      });
    }
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route GET v1/auths/exists/:email
//@desc Check email is exist in system
//@access public
//@role all
router.get("/exists/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      res.status(200).json({
        message: "User not found",
        success: false,
        isExist: false,
      });
    } else {
      const passwordHash = user.password;
      const dummy = "";

      bcrypt.compare(dummy, passwordHash, function (err, result) {
        if (result == true) {
          //Login with some method like: Google... can not change password
          return res.status(200).json({
            message: "Your account login in another way",
            success: false,
            isExist: false,
          });
        } else {
          return res.status(200).json({
            message: "Having user",
            success: false,
            isExist: true,
          });
        }
      });
    }
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

module.exports = router;
