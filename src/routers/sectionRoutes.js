const Section = require("../models/Section");
const Plan = require("../models/Plan");
const Place = require("../models/Place");
const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS } = require("../models/enum");
const { AddPurchase } = require("recombee-api-client/lib/requests");
const recombee = require("recombee-api-client");
const dotenv = require("dotenv");
dotenv.config({
  path: "./config.env",
});
const rqs = recombee.requests;
const client = new recombee.ApiClient(
  process.env.RECOMMENDBEE_APP,
  process.env.RECOMMENDEE,
  {
    region: process.env.RECOMMENDBEE_REGION,
  }
);
//@route POST v1/sections
//@desc create new plan
//@access private
//@role user
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const planId = req.body.plan;
    if (!mongoose.Types.ObjectId.isValid(planId))
      return res.status(400).json({
        success: false,
        message: "Invalid planId",
      });

    let plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid planId",
      });
    }
    const timeUpdate = formatTimeUTC();
    let newSection = new Section({
      plan: planId,
      start: req.body.start,
      end: timeUpdate,
      places: req.body.places ? req.body.places : [],
      note: req.body.note,
    });

    newSection = await newSection.save();
    // Add list place
    if (req.body.places?.length > 0) {
      const userId = req.body.userAuth.id;
      const purchases = [];
      const placesId = req.body.places.map((item) => item.place._id);
      //Add to batch
      placesId.forEach((id) => {
        purchases.push(
          new rqs.AddPurchase(userId, id, { cascadeCreate: true })
        );
      });
      client
        .send(new rqs.Batch(purchases))
        .then((response) => console.log("62, add batch successful", response))
        .catch((error) => console.log("63 error in add batch ", error));
    }

    if (newSection) {
      let section = plan.sections;
      section.push(newSection._id);
      plan = await Plan.findOneAndUpdate(
        { _id: plan.id },
        { sections: section },
        { new: true }
      );
      // console.log(plan);
      newSection = await Section.populate(newSection, ["places.place"]);
      return res.json({
        success: true,
        message: "Create section successfully",
        section: newSection,
      });
    }
    res.status(500).json({
      success: false,
      message: "Create section unsuccessfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route GET v1/sections/plan/:planId
//@desc get all section of a plan by planId
//@access private
//@role user
router.get("/plan/:planId", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.planId))
      return res.status(400).json({
        success: false,
        message: "Invalid planId",
      });

    let plan = await Plan.findById(req.params.planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid planId",
      });
    }

    let sections = [];
    sections = await Section.find({
      plan: req.params.planId,
      isHidden: false,
    }).populate("places.place");
    if (sections)
      return res.json({
        success: true,
        message: "Get sections successfully",
        sections: sections,
      });

    res.status(500).json({
      success: false,
      message: "Get sections unsuccessfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route GET v1/sections/:sectionId
//@desc get section by sectionId
//@access private
//@role user
router.get("/:sectionId", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.sectionId))
      return res.status(400).json({
        success: false,
        message: "Invalid sectionId",
      });

    let section;
    section = await Section.findOne({
      _id: req.params.sectionId,
      isHidden: false,
    });
    if (section)
      return res.json({
        success: true,
        message: "Get section successfully",
        section: section,
      });

    res.status(404).json({
      success: false,
      message: "Section not found",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route PUT v1/sections/:sectionId/place/:placeId
//@desc add new place to section
//@access private
//@role user
router.put(
  "/:sectionId/place/:placeId",
  requireAuth,
  async (req, res, next) => {
    try {
      if (
        !(
          mongoose.Types.ObjectId.isValid(req.params.sectionId) &&
          mongoose.Types.ObjectId.isValid(req.params.placeId)
        )
      )
        return res.status(400).json({
          success: false,
          message: "Invalid sectionId or placeId",
        });

      const place = await Place.findOne({
        _id: req.params.placeId,
        isHidden: false,
      });
      if (!place)
        return res.status(400).json({
          success: false,
          message: "Place does not exist",
        });

      let section = await Section.findById(req.params.sectionId);
      let isExist = false;
      try {
        section.places.forEach(async (element) => {
          if (element.place == place.id) {
            isExist = true;
            return;
          }
        });
      } catch (error) {
        console.log(error);
      }

      if (isExist)
        return res.status(400).json({
          success: false,
          message: "Place already existed",
        });

      let destination = {
        place: place.id,
        isVisited: false,
        visitedTime: null,
      };
      section = await Section.findByIdAndUpdate(
        { _id: req.params.sectionId },
        { $addToSet: { places: destination }, updatedAt: Date.now() },
        { new: true }
      );
      //* Send data to recombee
      client
        .send(
          new AddPurchase(req.body.userAuth.id, place.id, {
            cascadeCreate: true,
          })
        )
        .then((response) => {
          console.log("238 success add new purchase in recommendee ", response);
        })
        .catch((error) => {
          console.log("241 ", error);
        });
      //* End send data to recombee
      if (section)
        return res.json({
          success: true,
          message: "Add new place to section successfully",
          section: section,
        });
      else
        res.status(500).json({
          success: false,
          message: "Add new place to section unsuccessfully",
        });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Internal error server",
      });
    }
  }
);

//@route PUT v1/sections/:sectionId
//@desc add new place to section
//@access private
//@role user
router.put("/:sectionId", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.sectionId))
      return res.status(400).json({
        success: false,
        message: "Invalid sectionId ",
      });

    let section = await Section.findById(req.params.sectionId);

    let destination = {
      start: req.body.start ? req.body.start : section.start,
      end: req.body.end ? req.body.end : section.end,
      note: req.body.note ? req.body.note : section.note,
      isHidden: req.body.isHidden ? req.body.isHidden : section.isHidden,
      places: req.body.places ? req.body.places : section.places,
      updatedAt: formatTimeUTC(),
    };
    //* Add to Recombe if add new place
    if (!destination.isHidden) {
      const placeIdInSection = section.places.map((i) => i._id);

      let placesId = destination.places.filter(
        (item) => !placeIdInSection.includes(item._id)
      );
      placesId = placesId.map((item) => item._id);
      const userId = req.body.userAuth.id;
      const purchases = [];
      //Add to batch
      placesId.forEach((id) => {
        purchases.push(
          new rqs.AddPurchase(userId, id, { cascadeCreate: true })
        );
      });
      client
        .send(new rqs.Batch(purchases))
        .then((response) => console.log("312, add batch successful", response))
        .catch((error) => console.log("313 error in add batch ", error));
    }
    //* End

    section = await Section.findByIdAndUpdate(
      { _id: req.params.sectionId },
      destination,
      { new: true }
    ).populate("places.place");

    if (section)
      return res.json({
        success: true,
        message: "Section updated successfully",
        section: section,
      });
    else
      res.status(500).json({
        success: false,
        message: "Section updated unsuccessfully",
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route Delete v1/sections/:sectionId
//@desc add new place to section
//@access private
//@role user
router.delete("/:sectionId", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.sectionId))
      return res.status(400).json({
        success: false,
        message: "Invalid sectionId ",
      });

    let sectionId = req.params.sectionId;

    let plan = await Plan.findOne({
      sections: {
        $elemMatch: { $in: sectionId },
      },
      isHidden: false,
    });

    let section = await Section.findOneAndDelete({ _id: sectionId });

    if (plan && section) {
      let sections = plan.sections;
      console.log(sections);
      sections = sections.filter(
        (item) => item.toString() !== sectionId.toString()
      );

      plan = await Plan.findOneAndUpdate(
        { _id: plan.id },
        { sections: sections },
        { new: true }
      );
    }

    if (section)
      return res.json({
        success: true,
        message: "Section updated successfully",
        section: section,
      });
    else
      res.status(500).json({
        success: false,
        message: "Section updated unsuccessfully",
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

module.exports = router;
