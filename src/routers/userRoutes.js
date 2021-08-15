const { User, Place } = require("../models/index");
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

/**
 * @swagger
 *  /api/users:
 *    get:
 *      summary: Retrieves all user
 *      tags: [User APIs]
 *      parameters:
 *      - in: path
 *        name: userId
 *        schema:
 *          type: string
 *        required: true
 *        description: User ID
 *      security:
 *        - JWT: []
 *      authentication:
 *        Bearer: []
 *      responses:
 *        "200":
 *          description: Corporate org structure for a client
 */

router.get("/", async (req, res) => {
  try {
    let userList = "";
    if (req.query.populate=='true') {
      //Get object foreign key
      userList = await User.find().select("-password").populate("favorite");
    } else {
      userList = await User.find().select("-password");
    }
    if (!userList) {
      return res.status(500).json({
        message: "Cannot get users list",
        count: 0,
        users: null,
      });
    }
    return res.status(200).json({
      message: "List all user",
      count: userList.length,
      users: userList,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

//Add new favorite place
router.put("/:userId/favorite/:placeId", requireAuth, async (req, res) => {
  if (req.body.userAuth.id != req.params.userId) {
    return res.status(400).json({
      message: "Invalid User Id",
    });
  }
  const place = await Place.findById(req.params.placeId);
  if (!place) {
    return res.status(400).json({
      message: "Place invalid ",
    });
  }
  const userUpdate = await User.updateOne(
    { _id: req.params.userId },
    { $addToSet: { favorite: req.params.placeId } }
  );
  return res.status(200).json({
    message: "Update successfull",
  });
});

module.exports = router;
