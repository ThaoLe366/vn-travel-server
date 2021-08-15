const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const dotenv=require('dotenv')

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
  if (!authorization) {
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
  const token = authorization.split(" ")[1];
  try {
    const user = await googleAuth(token);
    req.body.userAuth = user;
    req.headers.authorization = token;
    next();
  } catch (error) {
    //Login by enter email and password
    try {
      let user;
      jwt.verify(
        token,
        process.env.SECRET_KEY,
        function (err, payload) {
          console.log(payload);
          user=  payload.userAuth;
          req.body.userAuth = user;
          req.headers.authorization = token;
          next();
        }
      );
      
   
    } catch (err) {
      console.log(err)
      const errorMessage = error.message;
      return res.status(401).json({
        message: errorMessage,
      });
    }

    // const errorMessage = error.message;
    // return res.status(401).json({
    //   message: errorMessage,
    // });
  }
};
module.exports = requireAuth;
