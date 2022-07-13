const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Image } = require("../models/Image");
const requireAuth = require("../middleware/requireAuth");
const { formatTimeUTC } = require("../utils/Timezone");
const Cloudinary = require("../helpers/Cloudinary");

//Format file's name and path to save images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

//filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype==='video/mp4') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 9,
  },
  fileFilter: fileFilter,
});

//@route GET v1/images/
//@desc Get image by filter
//@access public
//@role any
router.get("/", async (req, res) => {
  try {
    let filterByPlace = req.query.placeId;
    let filterByReview = req.query.reviewId;
    let filterById = req.query.imageId;
    let imageList = [];
    if (filterByPlace) {
      imageList.push(await Image.find({ place: filterByPlace }));
      console.log(imageList);
    }
    if (filterByReview) {
      imageList.push(await Image.find({ review: filterByReview }));
    }
    if (filterById) {
      imageList.push(await Image.find({ _id: filterById }));
    }
    return res.status(200).json({
      message: "Get images successfully",
      success: true,
      images: imageList,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
});

//@route POST v1/images
//@desc Upload image
//@access authenticate
//@role admin || user
router.post(
  "/",
  requireAuth,
  upload.single("placeImage"),
  async (req, res, next) => {
    try {
      let image;
      Cloudinary.uploadSingle(req.file.path).then(async (result) => {
        image = new Image({
          place: req.body.place,
          category: req.body.category,
          review: req.body.review,
          url: result.url,
          isHidden: false,
          id: result.id,
        });
        image = await image.save();
        return res.status(200).json({
          message: "Create image successfully",
          success: true,
          image: image,
        });
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  }
);
//@route DELETE v1/images
//@desc Delete images by filter (review or )
//@access private
//@role admin
router.delete("/:imageId", requireAuth, async (req, res, next) =>
  requireRole("admin", req, res, next, async (req, res, next) => {
    try {
      await Image.findOneAndUpdate(
        { _id: req.params.imageId },
        {
          isHidden: true,
          updatedAt: formatTimeUTC(),
        },
        { new: true },
        function (err, documents) {
          return res.status(200).json({
            message: "Delete images successfully",
            success: true,
            category: documents,
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

module.exports = router;
