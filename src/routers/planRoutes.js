const Plan = require('../models/Plan');
const User = require('../models/User');
const mongoose = require('mongoose').set('useFindAndModify', false);
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { formatTimeUTC, formatTimeUTC_ } = require('../utils/Timezone');
const Section = require('../models/Section');
const { createAddedTripAnnouncement } = require('./announmentRoutes');
const { ANNOUNCEMENT_TYPE } = require('../models/enum');

//@route GET v1/plans
//@desc get plan by userId
//@access private
//@role user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const planner = req.body.userAuth;
    let plans = [];
    plans = await Plan.find({ user: planner.id, isHidden: false }).populate([
      'sections',
      'members',
    ]);
    let plansInvite = await Plan.find({
      members: { $in: [planner.id] },
    }).populate(['sections', 'members']);

    if (plans) {
      return res.status(200).json({
        success: true,
        message: 'Get plan successfully',
        plans: [...plans, ...plansInvite],
      });
    }
    res.status(500).json({
      success: false,
      message: 'Get plan unsuccessfully',
    });
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});

//@route POST v1/plans
//@desc create new plan
//@access private
//@role user
router.post('/', requireAuth, async (req, res) => {
  try {
    const planner = req.body.userAuth;
    let plan = new Plan({
      name: req.body.name,
      start: new Date(formatTimeUTC_(req.body.start)),
      end: formatTimeUTC_(req.body.end),
      note: req.body.note,
      photoUrl:
        (req.body.photoUrl.startsWith('https://')
          ? req.body.photoUrl
          : `https://${req.body.photoUrl}`) || '',
      user: planner.id,
      members: req.body.members,
      status: req.body.status,
    });

    plan = await plan.save();
    plan = await Plan.populate(plan, ['user']);
    if (plan) {
      if (plan.members.length > 0) {
        let temp = {
          creator: plan.user,
          type: ANNOUNCEMENT_TYPE.TRIP_ADDED,
          receiver: req.body.members,
          plan: plan,
        };

        await createAddedTripAnnouncement(temp).then((data) => {
          if (data.success)
            return res.json({
              success: true,
              message: 'Create plan successfully',
              plan: plan,
            });
        });
      }
      else {
        return res.json({
          success: true,
          message: 'Create plan successfully',
          plan: plan,
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: 'Create plan unsuccessfully',
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});

//@route PUT v1/plans/:planId
//@desc update plan by planId
//@access private
//@role user

router.put('/:planId', requireAuth, async (req, res, next) => {
  try {
    let planer = req.body.userAuth;
    if (!mongoose.Types.ObjectId.isValid(req.params.planId))
      return res.status(400).json({
        success: false,
        message: 'Invalid planId',
      });

    //Get plan by id
    let originPlan = await Plan.findOne({
      _id: req.params.planId,
      user: planer.id,
    });

    if (!originPlan)
      return res.status(400).json({
        success: false,
        message: 'Invalid planId or user',
      });

    //Initialize updated plan

    let planUpdate = {
      name: req.body.name ? req.body.name : originPlan.name,
      start: req.body.start ? req.body.start : originPlan.start,
      end: req.body.end ? req.body.end : originPlan.end,
      note: req.body.note,
      photoUrl: req.body.photoUrl ? req.body.photoUrl : originPlan.photoUrl,
      updatedAt: formatTimeUTC(),
      members: req.body.members ? req.body.members : originPlan.members,
      status: req.body.status ? req.body.status : originPlan.status,
    };

    planUpdate = await Plan.findOneAndUpdate(
      { _id: req.params.planId, user: planer.id },
      planUpdate,
      { new: true }
    );
    planUpdate = await Plan.populate(planUpdate, ['members', 'user']);

    if (req.body.members) {
      // if (
      //   JSON.stringify(req.body.members) !== JSON.stringify(originPlan.members)
      // ) {
      console.log('Yes');
      let temp = {
        creator: planUpdate.user,
        type: ANNOUNCEMENT_TYPE.TRIP_ADDED,
        receiver: req.body.members,
        plan: planUpdate,
      };
      await createAddedTripAnnouncement(temp);
      // }
    }
    return res.json({
      success: true,
      message: 'Update plan successfully',
      plan: planUpdate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});

//@route PUT v1/plans/delete/:planId
//@desc update plan when user delete
//@access private
//@role user
router.delete('/:planId', requireAuth, async (req, res, next) => {
  try {
    let planer = req.body.userAuth;
    if (!mongoose.Types.ObjectId.isValid(req.params.planId))
      return res.status(400).json({
        success: false,
        message: 'Invalid planId',
      });

    let planUpdate = await Plan.findOneAndDelete({
      _id: req.params.planId,
      user: planer.id,
    });
    let result = await Section.deleteMany({ plan: req.params.planId });
    console.log(result);
    if (planUpdate) {
      res.json({
        success: true,
        message: 'Delete plan successfully',
        plan: planUpdate,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Delete plan unsuccessfully',
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal error server',
    });
  }
});

module.exports = router;
