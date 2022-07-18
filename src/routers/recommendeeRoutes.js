const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config({
  path: './config.env',
});
// Recommendation system
const recombee = require('recombee-api-client');
const {
  DeleteItem,
  DeleteUser,
  ResetDatabase,
  AddItemProperty,
  AddDetailView,
  AddCartAddition,
  AddPurchase,
  AddRating,
  RecommendUsersToUser,
} = require('recombee-api-client/lib/requests');
const User = require('../models/User');
const { response } = require('express');
const Section = require('../models/Section');
const Plan = require('../models/Plan');
const Review = require('../models/Review');
const Place = require('../models/Place');
const rqs = recombee.requests;
const client = new recombee.ApiClient(
  process.env.RECOMMENDBEE_APP,
  process.env.RECOMMENDEE,
  {
    region: process.env.RECOMMENDBEE_REGION,
  }
);

// Delete a item
router.delete('/items/:id', async (req, res) => {
  try {
    client
      .send(new DeleteItem(req.params.id))
      .then(async (result) => {
        return res.status(200).json({
          success: true,
          message: 'Delete item successfull',
          result: result,
        });
      })
      .catch((error) => {
        console.log('28 Recommend delete item error', error);
        return res.status(500).json({
          success: false,
          message: 'Error happen',
          result: '',
        });
      });
  } catch (error) {}
});

//Delete a user
router.delete('/user/:id', async (req, res) => {
  try {
    client
      .send(new DeleteUser(req.params.id))
      .then(async (result) => {
        return res.status(200).json({
          success: true,
          message: 'Delete user successfull',
          result: result,
        });
      })
      .catch((error) => {
        console.log('52 Recommend delete user error', error);
        return res.status(500).json({
          success: false,
          message: 'Error happen',
          result: '',
        });
      });
  } catch (error) {}
});

// Reset and clear all
router.delete('/reset', async (req, res) => {
  try {
    client
      .send(new ResetDatabase())
      .then((result) => {
        return res.status(200).json({
          success: true,
          message: 'Delete user successfull',
          result: result,
        });
      })
      .catch((error) => {
        console.log('52 Recommend reset database error', error);
        return res.status(500).json({
          success: false,
          message: 'Error happen',
          result: '',
        });
      });
  } catch (error) {}
});
// Add new properties
router.post('/:proName', async (req, res) => {
  try {
    client
      .send(new AddItemProperty(req.params.proName, 'string'))
      .then((result) => {
        return res.status(200).json({
          success: true,
          message: 'Add new attribute successful',
          result: result,
        });
      })
      .catch((error) => {
        console.log('106 Add new attribute error', error);
        return res.status(500).json({
          success: false,
          message: 'Error happen',
          result: '',
        });
      });
  } catch (error) {
    console.log('114 Add new attribute error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});
// Backup ViewDetail and Favorite
router.get('/details', async (req, res) => {
  try {
    const users = await User.find();
    const userInfo = [];
    const userFavorite = [];

    users.forEach((user) => {
      user?.recentSearch.forEach((i) => {
        userInfo.push(
          new AddDetailView(user._id, i.place, {
            timestamp: i.time,
            cascadeCreate: true,
          })
        );
      });
      user?.favorite.forEach((f) => {
        userFavorite.push(
          new AddCartAddition(user._id, f, {
            timestamp: f.updatedAt,
            cascadeCreate: true,
          })
        );
      });
    });

    return client.send(new rqs.Batch(userInfo)).then((response) => {
      return res.status(200).json({
        success: true,
        result: response,
      });
    });
  } catch (error) {
    console.log('139 Migrate View Details error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});

// Backup purchase
router.get('/purchase', async (req, res) => {
  try {
    const plans = await Plan.find();
    const purchases = [];

    plans.forEach((plan) => {
      plan.sections.forEach((sec) => {
        purchases.push(
          new AddPurchase(plan.user, sec, {
            timestamp: plan.updatedAt,
            cascadeCreate: true,
          })
        );
      });
    });

    return client.send(new rqs.Batch(purchases)).then((response) => {
      return res.status(200).json({
        success: true,
        result: response,
      });
    });
  } catch (error) {
    console.log('190 Migrate Purchase error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});

// Backup review
router.get('/rating', async (req, res) => {
  try {
    const reviews = await Review.find();
    const sReview = [];

    reviews.forEach((r) => {
      sReview.push(
        new AddRating(r.user, r.place, (r.rate - 3) / 2, {
          timestamp: r.createAt,
          cascadeCreate: true,
        })
      );
    });

    return client.send(new rqs.Batch(sReview)).then((response) => {
      return res.status(200).json({
        success: true,
        result: response,
      });
    });
  } catch (error) {
    console.log('190 Migrate Purchase error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});

// Update place geometry
router.get('/updateGeometry', async (req, res) => {
  try {
    const places = await Place.find();
    places.forEach(
      (place) =>
        (place.geometry = {
          type: 'Point',
          coordinates: [place.longtitude, place.lattitude],
        })
    );
    console.log('Places ', places);
    for (let i = 0; i < places.length; i++) {
      const placeUpdate = await Place.findOneAndUpdate(
        { _id: places[i]._id },
        {
          $set: {
            geometry: {
              type: 'Point',
              coordinates: [places[i].longtitude, places[i].lattitude],
            },
          },
        }
      );
    }
  } catch (error) {
    console.log('190 updateGeometry Purchase error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});

//Get user same user
router.get('/getUserToUser/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    return await client
      .send(new RecommendUsersToUser(userId, 3))
      .then(async (result) => {
        // console.log(result);
        const user = result?.recomms.map((item) => item.id);
        let userRecommend = await User.find({
          _id: { $in: user },
        });
        return res.status(200).json({
          userRecommend,
        });
      });
  } catch (error) {
    console.log('190 updateGeometry Purchase error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
//Get user same user
router.get('/searchFuzzy/:keyword', async (req, res) => {
  try {
    console.log(req.params.keyword);
    const regex = new RegExp(escapeRegex(req.params.keyword), 'gi');

    console.log(req.params.keyword);
    return await Place.find(
      {
        name: regex,
      },
      function (err, places) {
        if (err) {
          console.log(err);
          return res.status(500).json({
            err,
          });
        } else {
          console.log(places);
          return res.status(200).json({
            places,
          });
        }
      }
    );

    // return await Place.aggregate([
    //   {
    //     $search: {
    //       "text": {
    //         "query": req.params.keyword,
    //         "path": "description",
    //         "fuzzy": {
    //            "maxEdits": 1
    //          }
    //       }
    //     }
    //    }
    //  ], (err, data)=>{
    //   if(err){
    //     return res.status(400).send(err);
    //   }
    //   else {
    //     res.status(200).send(data);
    //   }
    //  })
  } catch (error) {
    console.log('190 updateGeometry Purchase error', error);
    return res.status(500).json({
      success: false,
      message: 'Error happen',
      result: '',
    });
  }
});

module.exports = router;
