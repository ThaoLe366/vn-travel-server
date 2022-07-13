const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const router = express.Router();
const { Tag } = require("../models/Tag");
const { formatTimeUTC } = require("../utils/Timezone");

//@route GET v1/tags
//@desc Get all tags
//@access public
//@role all
router.get("/", async (req, res) => {
  try {
    const tagList = await Tag.find();
    return res.status(200).json({
      message: "Get all tag successfully",
      success: true,
      tags: tagList,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

//@route POST v1/tags
//@desc Create new tag
//@access private
//@role admin
router.post("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let tag = new Tag({
        name: req.body.name,
        engName: req.body.engName,
        isHidden: req.body.isHidden,
      });
      tag = await tag.save();
      return res.status(200).json({
        message: "Create tag successfully ",
        success: true,
        tag: tag,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
        success: false,
      });
    }
  })
);

//@route PUT v1/tag/:id
//@desc Update tag info
//@access private
//@role admin
router.put("/:tagId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {

      const tagUpdate = await Tag.findOneAndUpdate(
        {
          _id: req.params.tagId,
        },
        {
          name: req.body.name,
          engName: req.body.engName,
          isHidden: req.body.isHidden,
          updatedAt: formatTimeUTC()
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Update successfully",
            success: true,
            tag: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  })
);

//@route DELETE v1/tags/:tagId
//@desc Delete this tag
//@access private
//@role admin
router.delete("/:tagId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      const tagUpdate = await Tag.findOneAndUpdate(
        {
          _id: req.params.tagId,
        },
        {
          isHidden: true,
          updatedAt: formatTimeUTC()
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Delete successfully",
            success: true,
            tag: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  })
);

module.exports = router;
