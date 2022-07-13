const Review = require("../models/Review");

const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const Place = require("../models/Place");
const { formatTimeUTC, formatTimeUTC_ } = require("../utils/Timezone");
const updateRateVoting = require("../helpers/updateRateVoting");
const recombee = require("recombee-api-client");
const dotenv = require("dotenv");
const { AddRating } = require("recombee-api-client/lib/requests");
dotenv.config({
  path: "./config.env",
});
const client = new recombee.ApiClient(
  process.env.RECOMMENDBEE_APP,
  process.env.RECOMMENDEE,
  {
    region: process.env.RECOMMENDBEE_REGION,
  }
);
//@route POST v1/reviews
//@desc create review
//@access private
//@role userS

//TODO: SORT AND UPDATE REVIEW STATUS OF PLACES
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const reviewer = req.body.userAuth;
    //Validate
    const { title, content, rate, visitedTime, images, place } = req.body;
    if (!(title && content && rate && visitedTime && place))
      return res.status(400).json({
        success: false,
        message: "Missing some fields",
      });

    let newReview = new Review({
      title: title,
      content: content,
      rate: rate,
      visitedTime: formatTimeUTC_(new Date(visitedTime)),
      user: reviewer.id,
      place: place,
      images: images,
    });

    newReview = await newReview.save();

    // Add to recommendee

    client
      .send(
        new AddRating(reviewer.id, place, (rate - 3) / 2, {
          cascadeCreate: true,
        })
      )
      .then((response) => {
        console.log("55 success rating in recommendee ", response);
      })
      .catch((error) => {
        console.log("59 ", error);
      });

    const placeUpdateRating = await Place.findById(place);
    let reviewStatus = placeUpdateRating.reviewStatus;

    switch (rate) {
      case 1:
        reviewStatus = { ...reviewStatus, terrible: reviewStatus.terrible + 1 };
        break;
      case 2:
        reviewStatus = { ...reviewStatus, poor: reviewStatus.poor + 1 };
        break;
      case 3:
        reviewStatus = { ...reviewStatus, average: reviewStatus.average + 1 };
        break;
      case 4:
        reviewStatus = { ...reviewStatus, good: reviewStatus.good + 1 };
        break;
      case 5:
        reviewStatus = {
          ...reviewStatus,
          excellent: reviewStatus.excellent + 1,
        };
        break;
      default:
        break;
    }
    let place_ = await Place.findOneAndUpdate(
      { _id: place },
      {
        reviewStatus: reviewStatus,
        reviewCount: placeUpdateRating.reviewCount + 1,
      },
      { new: true }
    );

    if (newReview) {
      const resultUpdateVoting = await updateRateVoting(place);

      if (resultUpdateVoting) {
        return res.json({
          success: true,
          message: "Create review successfully",
          review: newReview,
        });
      } else
        return res.status(500).json({
          success: false,
          message: "Create review successfully",
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

//@route GET v1/reviews/:placeId
//@desc GET review by placeId
//@access private
//@role
router.get("/:placeId", async (req, res, next) => {
  try {
    const placeId = req.params.placeId;
    if (!mongoose.Types.ObjectId.isValid(placeId))
      return res.status(400).json({
        success: false,
        message: "Invalid placeId",
      });

    let reviews = [];
    reviews = await Review.find({ place: placeId, isHidden: false }).populate(
      "user",
      ["_id", "image", "fullName"]
    );
    if (reviews) {
      return res.json({
        success: true,
        message: "Get reviews successfully",
        reviews: reviews,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Get reviews unsuccessfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

//@route PUT v1/reviews/like/:reviewId
//@desc update like count  by reviewId
//@access private
//@role user

router.put("/liked/:reviewId", requireAuth, async (req, res, next) => {
  try {
    const user = req.body.userAuth;

    const reviewId = req.params.reviewId;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({
        success: false,
        message: "Invalid reviewId",
      });

    let review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review can not found",
      });
    }

    if (review.likedUser.includes(user.id)) {
      //user unliked
      const index = review.likedUser.indexOf(user.id);
      if (index > -1) {
        review.likedUser.splice(index, 1);
      }
      review.likeCount--;
      review.updatedAt = formatTimeUTC();
      const result = await Review.findOneAndUpdate({ _id: review.id }, review, {
        new: true,
      });
      await Review.populate(result, "user");
      if (result)
        return res.json({
          success: true,
          message: "Update like review successfully",
          review: result,
        });
      return res.status(500).json({
        success: false,
        message: "Update like review unsuccessfully",
      });
    } else {
      //user liked review
      console.log(user.id);
      review.likedUser.push(user.id);
      review.likeCount++;
      review.updatedAt = formatTimeUTC();
      const result = await Review.findOneAndUpdate({ _id: review.id }, review, {
        new: true,
      });
      await Review.populate(result, "user");

      if (result)
        return res.json({
          success: true,
          message: "Update like review successfully",
          review: result,
        });
      return res.status(500).json({
        success: false,
        message: "Update like review unsuccessfully",
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

//@route PUT v1/reviews/delete/:reviewId
//@desc update isHidden by reviewId
//@access private
//@role user

router.put("/delete/:reviewId", requireAuth, async (req, res, next) => {
  try {
    let reviewer = req.body.userAuth;
    if (!mongoose.Types.ObjectId.isValid(req.params.reviewId))
      return res.status(400).json({
        success: false,
        message: "Invalid reviewId",
      });

    let reviewUpdate = {
      isHidden: req.body.isHidden,
      updatedAt: formatTimeUTC(),
    };

    reviewUpdate = await Review.findOneAndUpdate(
      { _id: req.params.reviewId },
      reviewUpdate,
      { new: true }
    );
    console.log(reviewUpdate);

    if (reviewUpdate) {
      res.status(200).json({
        success: true,
        message: "Delete review successfully",
        review: reviewUpdate,
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

module.exports = router;
