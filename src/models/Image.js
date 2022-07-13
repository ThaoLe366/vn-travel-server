const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");
const { CATEGORYIMAGE } = require("./enum");

const imageSchema = mongoose.Schema({
  url: {
    type: String,
    require: true,
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "places",
    default: null,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  category: {
    type: String,
    default: CATEGORYIMAGE.PLACE,
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    default: ''
  },
  isHidden:{
    type:Boolean,
    default:false
  }
});

imageSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
}); 

exports.Image = mongoose.model("images", imageSchema);
