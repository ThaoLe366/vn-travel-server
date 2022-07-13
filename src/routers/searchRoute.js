const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { PLAN_STATUS } = require('../models/enum');
const Plan = require('../models/Plan');
const User = require('../models/User');
const router = express.Router();

//@route GET v1/search/friends
//@desc get information of user
//@access public
//@role any
router.get('/:userId/friends', async (req, res) => {
  try {
    let userId = req.params.userId;

    await User.findById(userId)
      .select('-password')
      .populate({
        path: 'favorite',
        populate: [
          {
            path: 'category',
          },
          { path: 'province' },
          { path: 'tags' },
        ],
      })
      .populate({
        path: 'friends',
      })
      .exec(function (err, documents) {
        if (!err) {
          return res.status(200).json({
            success: true,
            message: 'Get users information successfully',
            user: documents,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Internal error server',
          });
        }
      });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});

//@route GET v1/search/:userId/plans
//@desc get plan of trip of user, with plan public
//@access public
//@role any
router.get('/:userId/plans', async (req, res, next) => {
  try {
    const planner = req.params.userId;
    let plans = [];
    plans = await Plan.find({
      user: planner,
      isHidden: false,
      status: PLAN_STATUS.PUBLIC,
    })
      .populate('sections')
      .populate('members');
    if (plans) {
      return res.status(200).json({
        success: true,
        message: 'Get plan successfully',
        plans: plans,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Get plan unsuccessfully',
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});

//@route GET v1/search?email=?
//@desc get all email user
//@access public
//@role any
router.get('/', requireAuth, async (req, res) => {
  let userId = req.body.userAuth.id;
  try {
    let users = await User.find({
      email: { $regex: new RegExp('^' + req.query.email, 'i') },
    });
    let exposeCurrentUser = users.filter((user) => user._id != userId);
    return res.status(200).json({
      success: true,
      message: 'Find email success',
      users: exposeCurrentUser,
      count: exposeCurrentUser.length,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});
module.exports = router;
