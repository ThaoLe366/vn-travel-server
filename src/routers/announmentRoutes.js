const Plan = require("../models/Plan");
const User = require("../models/User");
const mongoose = require("mongoose").set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { Announcement } = require("../models/Announcement");
const { ANNOUNCEMENT_TYPE } = require("../models/enum");
const { isValidObjectId } = require("mongoose");
// const mongoose = require('mongoose');
//@route GET v1/announcements
//@desc get announcements by userId
//@access private
//@role user
router.get("/:filter", requireAuth, async (req, res) => {
  try {
    const user = req.body.userAuth;
    let announcements = [];
    let filterData;
    if (req.params.filter === "all") {
      filterData = {
        receiver: user.id,
        isHidden: false,
      };
    } else {
      filterData = {
        receiver: user.id,
        isHidden: false,
        unread: req.params.filter === "unread",
      };
    }
    announcements = await Announcement.find(filterData)
      .sort({ updatedAt: -1 })
      .populate("creator", ["fullName", "email", "id", "image", "_id"])
      .populate("receiver", ["fullName", "email", "id", "image", "_id"])
      .populate("plan");
    return res.status(200).json({
      success: true,
      message: "Get announcements successfully",
      announcements,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

const createAddedTripAnnouncement = async (req) => {
  try {
    let announcement = new Announcement({
      image: req.creator.image,
      receiver: req.receiver,
      type: ANNOUNCEMENT_TYPE.TRIP_ADDED,
      creator: req.creator.id,
      title: "Bạn đã được mời vào một chuyến đi mới.",
      engTitle: "You was added to a trip.",
      engContent: `${req.creator.fullName} have added you to '${req.plan.name}' trip. Click to view detail.`,
      content: `${req.creator.fullName} đã thêm bạn vào chuyến đi '${req.plan.name}'. Chọn để xem chi tiết.`,
      plan: req.plan.id,
    });
    announcement = await announcement.save();
    return {
      success: true,
      message: "Create announcements successfully",
      announcement: announcement,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Internal error server",
    };
  }
};

//@route POST v1/annoncements/trip_added
//@desc get plan by userId
//@access
//@role user
router.post(
  `/${ANNOUNCEMENT_TYPE.TRIP_ADDED}`,
  requireAuth,
  async (req, res) => {
    try {
      let announcement = new Announcement({
        image: req.creator.image,
        receiver: req.receiver.id,
        type: ANNOUNCEMENT_TYPE.TRIP_ADDED,
        creator: req.creator.id,
        title: "Bạn nhận được lời mời tham gia vào chuyến đi",
        engTitle: "You was added to a trip.",
        content: `${req.creator.fullName} đã thêm bạn vào chuyến đi '${req.plan.name}'. Chọn để xem chi tiết.`,
        engContent: `${req.creator.fullName} have added you to '${req.plan.name}' trip. Click to view detail.`,
        plan: req.plan.id,
      });

      announcement = await announcement.save();
      console.log(announcement);
      return res.status(200).json({
        success: true,
        message: "Create announcements successfully",
        announcement: announcement,
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

const createAcceptFriendAnnouncement = async (req) => {
  try {
    let announcement = new Announcement({
      receiver: req.body.receiver.id,
      type: ANNOUNCEMENT_TYPE.ACCEPT_FRIEND,
      creator: req.body.creator.id,
      title: "Một kết nối mới đã được thành lập.",
      engTitle: "Successful connection",
      content: `${req.body.creator.fullName} đã đồng ý kết bạn với bạn.`,
      engContent: `${req.body.creator.fullName} agree to make friend with you.`,
    });
    announcement = await announcement.save();
    return {
      success: true,
      message: "Create announcements successfully",
      announcement: announcement,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal error server",
    };
  }
};

//@route PUT v1/annoncements
//@desc Update announcement
//@access
//@role user
router.put("/:announcementId", requireAuth, async (req, res) => {
  try {
    let updatedData = req.body;
    let announcementId = req.params.announcementId;
    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      updatedData,
      { new: true }
    );
    if (announcement) {
      res.json({
        message: "Update successfully",
        success: true,
        announcement,
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

//@route POST v1/annoncements/accept_friend
//@desc get plan by userId
//@access
//@role user

router.post(
  `/${ANNOUNCEMENT_TYPE.ACCEPT_FRIEND}/:announcementId`,
  requireAuth,
  async (req, res) => {
    try {
      // const userUpdateFriends = [req.body.receiver.id, req.body.creator.id];

      // const updateResult = await User.updateMany(
      //   { _id: { $in: [req.body.receiver.id, req.body.creator.id] } },
      //   {
      //     $cond: {
      //       if: {
      //         $eq: ['_id', req.body.receiver.id],
      //       },
      //       then: {
      //         $push: { friends: req.body.creator.id },
      //       },
      //       else: { $push: { friends: req.body.receiver.id } },
      //     },
      //   }
      // );

      const updateReceiver = await User.findByIdAndUpdate(
        { _id: req.body.creator.id },
        {
          $addToSet: { friends: req.body.receiver.id },
          updatedAt: Date.now(),
        },
        { new: true }
      );
      const updateCreator = await User.findByIdAndUpdate(
        { _id: req.body.receiver.id },
        {
          $addToSet: { friends: req.body.creator.id },
          updatedAt: Date.now(),
          $pull: {
            friendsRequested: req.body.creator.id,
          },
        },
        { new: true }
      );
      if (!updateCreator || !updateReceiver) {
        res.status(500).json({
          success: false,
          message: "Internal error server",
        });
      }

      await Announcement.findByIdAndDelete(req.params.announcementId);
      let announcement = new Announcement({
        receiver: req.body.receiver.id,
        type: ANNOUNCEMENT_TYPE.ACCEPT_FRIEND,
        creator: req.body.receiver.id,
        title: "Một kết nối mới đã được thành lập.",
        engTitle: "Connected succecssfully",
        content: `${req.body.creator.fullName} và bạn từ bây giờ đã trở thành bạn bè của nhau.`,
        engContent: `${req.body.creator.fullName} and you have become friend now.`,
      });
      announcement = await announcement.save();
      announcement = new Announcement({
        receiver: req.body.creator.id,
        type: ANNOUNCEMENT_TYPE.ACCEPT_FRIEND,
        creator: req.body.receiver.id,
        title: "Một kết nối mới đã được thành lập.",
        engTitle: "Connected succecssfully",
        content: `${req.body.receiver.fullName} và bạn từ bây giờ đã trở thành bạn bè của nhau.`,
        engContent: `${req.body.receiver.fullName} and you have become friend now.`,
      });
      announcement = await announcement.save();
      return res.status(200).json({
        success: true,
        message: "Create announcements successfully",
        announcement: announcement,
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
//@route POST v1/announcements/friend_added
//@desc send required connect
//@access
//@role user
router.post(
  `/${ANNOUNCEMENT_TYPE.FRIEND_ADDED}`,
  requireAuth,
  async (req, res) => {
    try {
      //Create announcement
      let announcement = new Announcement({
        receiver: req.body.receiver.id,
        type: ANNOUNCEMENT_TYPE.FRIEND_ADDED,
        creator: req.body.creator.id,
        title: "Bạn có yêu cầu kết bạn mới",
        engTitle: "Add friend request ",
        content: `${req.body.creator.fullName} đã gửi lời mới kết bạn với bạn. Đồng ý nha?`,
        engContent: `${req.body.creator.fullName} want to make friend with you. Are you agree?`,
      });
      console.log(req.body);
      announcement = await announcement.save();
      const updateCreator = await User.findByIdAndUpdate(
        { _id: req.body.receiver.id },
        {
          $addToSet: { friendsRequested: req.body.creator.id },
          updatedAt: Date.now(),
        },
        { new: true }
      );
      if (!updateCreator || !announcement) {
        res.status(500).json({
          success: false,
          message: "Internal error server",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Create announcements successfully",
        announcement: announcement,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal error server",
      });
    }
  }
);

module.exports = {
  announcementRouter: router,
  createAcceptFriendAnnouncement,
  createAddedTripAnnouncement,
};
