const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const router = express.Router();
const Explorer = require("../models/Explorer");
const { formatTimeUTC } = require("../utils/Timezone");

//@route POST v1/explorer
//@desc Post explorer
//@access private
//@role admin
router.post("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let explorer = new Explorer({
        title: req.body.title,
        description: req.body.description,
        engTitle: req.body.engTitle,
        engDescription: req.body.engDescription,
        banner: req.body.banner,
        tags: req.body.tags,
        isHidden: req.body.isHidden,
      });

      explorer = await explorer.save();
      Explorer.populate(explorer, ["tags"], function (err) {
        return res.status(200).json({
          success: true,
          message: "Explorer created successfully",
          explorer,
        });
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

//@route GET v1/explorers/private
//@desc Get all explorer (public vs private)
//@access public
//@role admin
router.get("/private", async (req, res) => {
    try {
      let explorers = [];
      explorers = await Explorer.find().populate("tags").exec();

      return res.status(200).json({
        success: true,
        message: "Get explorers successfully",
        explorers: explorers,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

//@route GET v1/explorers
//@desc Get all explorer (public )
//@access public
//@role admin
router.get("/", async (req, res) => {
  try {
    let explorers = [];
    explorers = await Explorer.find({ isHidden: false })
      .populate("tags")
      .exec();

    return res.status(200).json({
      success: true,
      message: "Get explorers successfully",
      explorers: explorers,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//@route PUT v1/explorers/:explorerId
//@desc Update explorer
//@access private
//@role admin
router.put("/:explorerId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    const { tags, isHidden } = req.body;
    try {
      let explorer = {
        title: req.body.title,
        description: req.body.description,
        engTitle: req.body.engTitle,
        engDescription: req.body.engDescription,
        banner: req.body.banner,
        tags,
        isHidden,
        updatedAt: formatTimeUTC(),
      };
      explorer = await Explorer.findOneAndUpdate(
        {
          _id: req.params.explorerId,
        },
        explorer,
        { new: true }
      );
      Explorer.populate(explorer, ["tags"], function (err) {
        return res.status(200).json({
          success: true,
          message: "Updated explorers successfully",
          explorer: explorer,
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  })
);

module.exports = router;
