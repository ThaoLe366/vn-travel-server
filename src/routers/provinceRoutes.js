const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const router = express.Router();
const { Province } = require("../models/Province");
const { formatTimeUTC } = require("../utils/Timezone");
//@route GET v1/provinces
//@desc Get all provinces
//@access public
//@role any
router.get("/", async (req, res) => {
  try {
    const provinceList = await Province.find();
    return res.status(200).json({
      message: "Get all province successfully",
      success: true,
      provinces: provinceList,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
});

//@route GET v1/provinces/public
//@desc Get all  provinces having isHidden = false
//@access public
//@role any
router.get("/public", async (req, res) => {
  try {
    const provinceList = await Province.find({ isHidden: false });
    return res.status(200).json({
      message: "Get all province successfully",
      success: true,
      provinces: provinceList,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
});

//@route GET v1/provinces/:provinceId
//@desc Get province by filter(id)
//@access public
//@role any

//@route POST v1/provinces
//@desc Create new province
//@access private
//@role admin
router.post("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let province = new Province({
        name: req.body.name,
        engName: req.body.engName,
        color: req.body.color,
        isHidden: req.body.isHidden,
        image: req.body.image,
      });

      province = await province.save();
      return res.status(200).json({
        message: "Create province successfully",
        success: true,
        province: province,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  })
);

//@route Put v1/provinces/:provinceId
//@desc Update province info
//@access private
//@role admin
router.put("/:provinceId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      const provinceUpdate = await Province.findOneAndUpdate(
        { _id: req.params.provinceId },
        {
          name: req.body.name,
          engName: req.body.engName,
          color: req.body.color,
          isHidden: req.body.isHidden,
          placeCount: req.body.placeCount,
          image: req.body.image,
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Update successfully",
            success: true,
            province: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  })
);

//@route DELETE v1/provinces
//@desc Delete provinces
//@access private
//@role
router.delete("/:provinceId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let provinceUpdate = await Province.findOneAndUpdate(
        { _id: req.params.provinceId },
        {
          isHidden: true,
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Delete province successfully",
            success: true,
            province: documents,
          });
        }
      );
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  })
);

//@route DELETE v1/provinces
//@desc Delete provinces
//@access private
//@role
router.delete("/delete/all", requireAuth, async (req, res, next) => {
  try {
    let provinceUpdate = await Province.deleteMany({ isHidden: false });
    res.json({
      success: true,
      message: "Detele successfully.",
      count: provinceUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
});

module.exports = router;
