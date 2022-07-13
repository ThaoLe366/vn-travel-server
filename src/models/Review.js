const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const reviewSchema = mongoose.Schema({
  title: {
    type: String,
    require: true,
  },
  content: {
    type: String,
    require: true,
  },
  rate: {
    type: Number,
    require: true,
    default: 0,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  likedUser: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  ],
  createAt: {
    type: Date,
    default: formatTimeUTC,
  },
  visitedTime: {
    type: Date,
    require: true,
  },

  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "places",
    require: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    require: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },

  images: [String],
});

reviewSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
module.exports = mongoose.model("reviews", reviewSchema);
