const Place = require("../models/Place");
const Contribute = require("../models/Contribute");
const User = require("../models/User");
const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC } = require("../utils/Timezone");

//@route GET v1/contributes
//@desc get all contributes
//@access private
//@role Admin
router.get("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let contributes = [];
      contributes = await Contribute.find({ isHidden: false })
        .populate("place", ["-__v"])
        .populate("user", ["-password"]);
      res.status(200).json({
        success: true,
        message: "Get contributes successfully",
        contributes: contributes,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Internal error server",
      });
    }
  })
);

//@route POST v1/contributes
//@desc create new contribute
//@access private
//@role Admin
router.post("/", requireAuth, async (req, res, next) =>
  requireRole("user", req, res, next, async (req, res) => {
    try {
      //Check place is existed
      const place = await Place.findById(req.body.place);
      if (!place) {
        return res.status(404).json({
          success: false,
          message: "Place not found ",
        });
      }

      let contributor = await User.findById(req.body.userAuth.id);
      if (!contributor)
        res.status(401).json({
          success: false,
          message: "User is not exist",
        });

      let contribute = new Contribute({
        content: req.body.content,
        place: req.body.place,
        user: contributor.id,
      });

      contribute = await contribute.save();
      if (contribute) {
        res.status(200).json({
          success: true,
          message: "Create contribute successfully",
          contribute: contribute,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Create contribute unsuccessfully",
        });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

//@route GET v1/contributes/:contributeId
//@desc get  contributes by contribute id
//@access private
//@role Admin
router.get("/:contributeId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res) => {
    try {
      //Validate placeId
      let contributeId = req.params.contributeId;
      if (!contributeId) {
        return res.status(400).json({
          success: false,
          message: "Missing id",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(contributeId))
        return res.status(400).json({
          success: false,
          message: "Invalid contribute id",
        });

      let contribute = await Contribute.findById(contributeId).populate(
        "place"
      );
      if (contribute) {
        return res.status(200).json({
          success: true,
          message: "Get contribute successfully",
          contributes: contribute,
        });
      } else
        res.status(404).json({
          success: false,
          message: "Contribute not found",
        });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

//@route GET v1/contributes/place/:placeId
//@desc get  contributes by place id
//@access private
//@role Admin
router.get("/place/:placeId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res) => {
    try {
      //Validate placeId
      let placeId = req.params.placeId;
      if (!placeId) {
        return res.status(400).json({
          success: false,
          message: "Missing placeId",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(placeId))
        return res.status(400).json({
          success: false,
          message: "Invalid place id",
        });

      let place = await Place.findOne({ _id: placeId });
      if (!place) {
        return res.status(400).json({
          success: false,
          message: "Place not found",
        });
      }

      let contributes = await Contribute.find({ place: placeId }).populate(
        "place"
      );
      if (contributes) {
        return res.status(200).json({
          success: true,
          message: "Get contribute successfully",
          contributes: contributes,
        });
      } else
        res.status(500).json({
          success: false,
          message: "Get contribute unsuccessfully",
        });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

//@route PUT v1/contributes
//@desc update isSeen status
//@access private
//@role Admin
router.put("/:contributeId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res) => {
    try {
      //Check place is existed

      let contributor = await User.findById(req.body.userAuth.id);
      if (!contributor)
        res.status(401).json({
          success: false,
          message: "User is not exist",
        });

      if (!mongoose.Types.ObjectId.isValid(req.params.contributeId))
        return res.status(400).json({
          success: false,
          message: "Invalid contribute id",
        });

      const contributeUpdatedCondition = { _id: req.params.contributeId };
      let contributeUpdate = {
        isSeen: req.body.isSeen,
        isHidden: req.body.isHidden,
        updatedAt: formatTimeUTC(),
      };

      contributeUpdate = await Contribute.findByIdAndUpdate(
        contributeUpdatedCondition,
        contributeUpdate,
        { new: true }
      );

      if (contributeUpdate) {
        res.status(200).json({
          success: true,
          message: "Update contribute successfully",
          contribute: contributeUpdate,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Update contribute unsuccessfully",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

module.exports = router;


