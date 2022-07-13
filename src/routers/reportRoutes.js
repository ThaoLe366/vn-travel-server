const Report = require("../models/Report");

const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC } = require("../utils/Timezone");

//@route GET v1/reports
//@desc get all reports
//@access private
//@role admin

router.get("/", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let reports = [];
      reports = await Report.find({ isHidden: false })
        .populate("reporter", ["fullName", "email", "isHidden", "_id", "image"])
        .populate("review")
        .populate("user")
        .exec();
      return res.status(200).json({
        message: "Get all report successfully",
        success: true,
        reports: reports,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal error server",
        success: false,
      });
    }
  })
);

//@route POST v1/report
//@desc create report
//@access public
//@role user
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const reporter = req.body.userAuth;
    let newReport = new Report({
      reason: req.body.reason,
      review: req.body.review,
      reporter: reporter.id,
    });
    newReport = await newReport.save();
    res.json({
      success: true,
      message: "Create report successfully",
      report: newReport,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal error server",
      success: false,
    });
  }
});

//@route PUT v1/reports/:reportId``
//@desc update reports by id
//@access private
//@role admin
router.put("/:reportId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      let report = {
        isSeen: req.body.isSeen,
        isHidden: req.body.isHidden,
        updatedAt: formatTimeUTC(),
      };
      report = await Report.findOneAndUpdate(
        {
          _id: req.params.reportId,
        },
        report,
        { new: true }
      );
      res.json({
        success: true,
        message: "Update report successfully",
        report: report,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal error server",
        success: false,
      });
    }
  })
);

module.exports = router;
