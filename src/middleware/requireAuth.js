const { OAuth2Client, auth } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: "./config.env" });
//Verify token
const googleAuth = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: [process.env.GOOGLE_CLIENT_ID],
  });

  return ticket.getPayload();
};

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  
  //If do not have token, return
  if (!authorization) {
    return res.status(401).json({
      message: "Access token not found",
    });
  }

  const token = authorization.split(" ")[1];
  //Try with token from google
  try {
    const user = await googleAuth(token);

    let userMap = await User.findOne({ email: user.email });

    //Checked account is active
    if (!userMap.isHidden) {
      req.body.userAuth = userMap;
      req.headers.authorization = token;
      next();
    } else {
      res.status(403).json({
        message: "Your account is blocked",
        success: false,
      });
    }
  } catch (error) {
    //Login by enter email and password
    try {
      let user;
      jwt.verify(token, process.env.SECRET_KEY, function (err, payload) {
        if (typeof payload != "undefined") {
          if (!payload.userAuth.isHidden) {
            user = payload.userAuth;
            req.body.userAuth = user;
            req.headers.authorization = token;
            next();
          } else {
            res.status(403).json({
              message: "Your account is blocked",
              success: false,
            });
          }
        } else {
          return res.status(403).json({
            message: "Authentication failed!",
            success: false,
          });
        }
        //Get info of accesstoken
        // else
        // try {
        // let urlGraphFacebook = `https://graph.facebook.com/me?access_token=${token}`;
        // console.log(urlGraphFacebook);
        // fetch(urlGraphFacebook, { method: "GET" })
        //   .then((res) => res.json())
        //   .then(async (response) => {
        //     console.log(response);
        // response {name,id}
        // const { name, id } = resspone;
        // if (typeof id == "undefined") {
        //   console.log(err.message);
        //   return res.status(401).json({
        //     message: "Authentication failed",
        //     success: false,
        //   });
        // }
        // else{

        //     let userMap = await User.findOne({ email: id });
        //     req.body.userAuth = userMap;
        //     // req.headers.authorization = token;
        //     next();
        // }
        // });
        // } catch (error) {
        //   console.log(err.message);
        //   return res.status(401).json({
        //     message: "Authentication failed!",
        //     success: false,
        //   });
        // }

      });
    } catch (err) {
      //TODO: temp wait for the better login with facebook

      console.log(err.message);
      return res.status(403).json({
        message: "Authentication failed",
      });
    }
  }
};
module.exports = requireAuth;
