const User = require("../models/User");
const Place = require("../models/Place");
const express = require("express");
const router = express.Router();
const https = require("http");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { UserRefreshClient } = require("google-auth-library");
const { formatTimeUTC } = require("../utils/Timezone");
const bcrypt = require("bcrypt");
const axios = require("axios");

const { request } = require("express");

const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});
// Recommendation system
const recombee = require("recombee-api-client");
const { AddDetailView } = require("recombee-api-client/lib/requests");
const {
  AddCartAddition,
} = require("recombee-api-client/lib/requests/add-cart-addition");
const {
  DeleteCartAddition,
} = require("recombee-api-client/lib/requests/delete-cart-addition");
const rqs = recombee.requests;
const client = new recombee.ApiClient(
  process.env.RECOMMENDBEE_APP,
  process.env.RECOMMENDEE,
  {
    region: process.env.RECOMMENDBEE_REGION,
  }
);

//@route GET v1/users
//@desc get all users
//@access private
//@role any
router.get("/", requireAuth, async (req, res) => {
  try {
    let userList = [];
    if (req.query.populate == "true") {
      //Get object foreign key
      userList = await User.find().select("-password").populate("favorite");
    } else {
      userList = await User.find()
        .select("-password")
        .populate("favorite", ["-__v"])
        .populate("friends");
    }

    //Not found
    if (!userList) {
      return res.status(404).json({
        success: false,
        message: "Users not found",
        users: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get all users sucessfully",
      users: userList,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route GET v1/users/favorite
//@desc get favorite of user
//@access private
//@role user
router.get("/favorite", requireAuth, async (req, res) => {
  try {
    let userId = req.body.userAuth.id;

    await User.findById(userId)
      .select("-password")
      .populate({
        path: "favorite",
        populate: [
          {
            path: "category",
          },
          { path: "province" },
          { path: "tags" },
        ],
      })
      .exec(function (err, documents) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Get users favorite successfully",
            favorite: documents.favorite,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
      });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route PUT v1/users/favorite/:placeId
//@desc add new favorite place
//@access private
//@role user
router.put("/favorite/:placeId", requireAuth, async (req, res) => {
  try {
    const place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }
    //TODO: Check place is existed in favorite
    let user = await User.findById(req.body.userAuth.id);
    let index = user.favorite.indexOf(req.params.placeId);
    const userUpdatedCondition = { _id: req.body.userAuth.id };

    if (index > 0) {
      client
        .send(new DeleteCartAddition(req.body.userAuth.id, req.params.placeId))
        .then((response) => {
          console.log("134 delete add item to Car in recombee ", response);
        })
        .catch((error) => {
          console.log("283 ", error);
        });

      user = await User.findOneAndUpdate(
        userUpdatedCondition,
        { $pull: { favorite: req.params.placeId } },
        { new: true }
      ).populate("recentSearch.place");

      return res.status(200).json({
        success: true,
        add: false,
        message: "Delete success",
        user: user,
      });
    } else {
      client
        .send(
          new AddCartAddition(req.body.userAuth.id, req.params.placeId, {
            cascadeCreate: true,
          })
        )
        .then((response) => {
          console.log("166 success add cart addition ", response);
        })
        .catch((error) => {
          console.log("170 ", error);
        });
      await User.findByIdAndUpdate(
        userUpdatedCondition,
        { $addToSet: { favorite: req.params.placeId } },
        { new: true }
      )
        .populate("recentSearch.place")
        .exec(function (err, user) {
          if (!err) {
            return res.status(200).json({
              success: true,
              message: "Update success",
              user: user,
              add: true,
            });
          } else {
            res.status(500).json({
              success: false,
              message: "Internal error server",
            });
          }
        });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
//@route PUT v1/users
//@desc Disable account user
//@access private
//@role admin
router.put("/:userId/status", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      const userUpdatedCondition = { _id: req.body.id };
      await User.findByIdAndUpdate(
        userUpdatedCondition,
        { $set: { isHidden: req.body.isHidden } },
        { new: true },
        function (err, documents) {
          if (!err) {
            User.populate(documents, ["favorite"], function (err) {
              return res.status(200).json({
                success: true,
                message: "Update success",
                user: documents,
              });
            });
          }
        }
      );
    } catch (error) {
      console.log(err.message);
      res.status(500).json({
        success: false,
        message: "Internal error server",
      });
    }
  })
);

//@route POST v1/users/profiles
//@desc update profile of user
//@access private
//@role user
router.post("/profiles", requireAuth, async (req, res, next) => {
  //Just update profile of this token
  let userId = req.body.userAuth.id;
  console.log(req.body);
  await User.findByIdAndUpdate(
    { _id: userId },
    {
      $set: {
        fullName: req.body.fullName,
        image: req.body.image,
        aboutMe: req.body.aboutMe,
      },
    },
    { new: true }
  )
    .populate("recentSearch.place")
    .exec(function (err, documents) {
      if (!err) {
        res.status(200).json({
          message: "Update success",
          success: true,
          user: documents,
        });
      } else {
        res.status(500).json({
          message: "Internal error server",
          success: false,
        });
      }
    });
});

//@route PUT v1/users/recentView/:placeId
//@desc add new favorite place
//@access private
//@role user
router.put("/recentSearch/:placeId", requireAuth, async (req, res) => {
  try {
    let place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }

    //Save to viewCount in Place
    place = await Place.findByIdAndUpdate(
      req.params.placeId,
      {
        viewCount: place.viewCount + 1,
      },
      { new: true }
    );

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    const user = await User.findById(req.body.userAuth.id);
    let recentPlace = user.recentSearch;
    let existed = recentPlace.find((item) => {
      return item.place.toString() === req.params.placeId.toString();
    });
    const itemRecent = { place: req.params.placeId, time: formatTimeUTC() };

    if (existed) {
      recentPlace = recentPlace.filter(
        (item) => item.place.toString() !== req.params.placeId.toString()
      );

      recentPlace.push(itemRecent);
      recentPlace = recentPlace.sort((a, b) => b.time - a.time);
      let userUpdate = await User.findByIdAndUpdate(
        userUpdatedCondition,
        { recentSearch: recentPlace },
        { new: true }
      );
      // Add to recommend system
      // rqs.AddDetailView( );

      User.populate(userUpdate, ["recentSearch.place"]).then((user_) => {
        return res.status(200).json({
          success: true,
          message: "That place existed",
          user: user_,
        });
      });
    } else {
      if (recentPlace.length >= 6) recentPlace = recentPlace.slice(0, 5);
      recentPlace.push({ place: req.params.placeId, time: formatTimeUTC() });
      recentPlace.sort((a, b) => b.time - a.time);
      let userUpdate = await User.findByIdAndUpdate(
        userUpdatedCondition,
        { recentSearch: recentPlace },
        { new: true }
      );

      User.populate(userUpdate, ["recentSearch.place"]).then((user) => {
        return res.status(200).json({
          success: true,
          message: "Update success",
          user: user,
        });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route GET v1/users/recentView
//@desc add new favorite place
//@access private
//@role user
router.get("/recentSearch", requireAuth, async (req, res) => {
  try {
    const userId = req.body.userAuth.id;
    let user = await User.findById(userId).populate("recentSearch.place");
    return res.status(200).json({
      success: true,
      message: "Update success",
      places: user.recentSearch,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route DELETE v1/users/favorite/:placeId
//@desc remove favorite place
//@access private
//@role user
router.delete("/favorite/:placeId", requireAuth, async (req, res) => {
  try {
    const place = await Place.findById(req.params.placeId);
    if (!place) {
      return res.status(404).json({
        message: "Place not found ",
      });
    }
    //TODO: Check place is existed in favorite

    const userUpdatedCondition = { _id: req.body.userAuth.id };
    client
      .send(
        new DeleteCartAddition(req.body.userAuth.id, req.params.placeId, {
          cascadeCreate: true,
        })
      )
      .then((response) => {
        console.log("400 success Delete cart addition ", response);
      })
      .catch((error) => {
        console.log("403 ", error);
      });
    await User.findByIdAndUpdate(
      userUpdatedCondition,
      { $pull: { favorite: req.params.placeId } },
      { new: true }
    )
      .populate("favorite")
      .populate("recentSearch.place")
      .exec(function (err, user) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Update success",
            user: user,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
      });
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//TODO: change password
//@route POST v1/users/loginPassword
//@desc Check is user use email and password to login
//@access private
//@role usr
router.get("/loginPassword/:email", async (req, res, next) => {
  try {
    //Get user
    const snapshot = await User.findOne({
      email: req.params.email,
    });
    const passwordHash = snapshot.password;
    const dummy = "";

    //Check password equal default password
    bcrypt.compare(dummy, passwordHash, function (err, result) {
      if (result == true) {
        //Login with some method like: Google... can not change password
        return res.status(200).json({
          message: "Login with Google",
          success: true,
          isCanChangePassword: false,
        });
      } else {
        return res.status(200).json({
          message: "Login with User name and password",
          success: true,
          isCanChangePassword: true,
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
});
//@route PUT v1/users/password
//@desc Change password
//@access private
//@role user
router.put("/password", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(401).json({
      message: "Authentication failed!",
      success: false,
    });
  }

  // const passwordHash = user.password;// Chaneg to user in database 
  const userInDatabase = await User.findById(user._id);
  console.log(479, userInDatabase);
  const passwordHash = userInDatabase.password;
  console.log(481, req.body);
  const passwordCheck = req.body.password;
  const salt = await bcrypt.genSaltSync(10);

  const newPasswordHash = await bcrypt.hashSync(req.body.newPassword, salt);
  //Check password equal default password
  await bcrypt.compare(passwordCheck, passwordHash, function (err, result) {
    console.log(488, result);
    if (result == true ) {
      User.findOneAndUpdate(
        { email: req.body.email },
        {
          password: newPasswordHash,
        },
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
      //Login with some method like: Google... can not change password
    } else {
      //CODE 406: Not acceptable
      return res.status(204).json({
        message: "Incorrect password",
        success: false,
      });
    }
  });
});

router.post("/translate", (req, res) => {
  var q = req.body.q;
  var lang = req.body.lang ? req.body.lang : "vi";
  const response = axios
    .post(
      "https://translation.googleapis.com/language/translate/v2",
      {},
      {
        params: {
          q: q,
          target: lang,
          key: "AIzaSyAAWuBzltf546OYRpBf7x8Ii2l6-b5RSrw",
        },
      }
    )
    .then((response) => {
      res.json({
        success: true,
        message: "Success",
        data: response.data.data.translations[0].translatedText,
      });
    })
    .catch((err) => {
      console.log("rest api error", err);
      res
        .status(400)
        .json({ message: "Some error happen", data: "", success: false });
    });
});

//@route GET v1/users/friends
//@desc get friends of user
//@access private
//@role user
router.get("/friends", requireAuth, async (req, res) => {
  try {
    let userId = req.body.userAuth.id;
    // let userId= req.params.userId;

    await User.findById(userId)
      .select("-password")
      .populate({
        path: "friends",
      })
      .exec(function (err, documents) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Get user friends successfully",
            friends: documents.friends,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
      });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});


//For demo recombee
router.get("/profileInfo/:userId", async (req, res) => {
  try {
    let userId = req.params.userId;
    // let userId= req.params.userId;

    await User.findById(userId)
      .select("-password")
 
      .exec(function (err, documents) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: "Get user profile info  successfully",
            friends: documents,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Internal error server",
          });
        }
      });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
module.exports = router;
