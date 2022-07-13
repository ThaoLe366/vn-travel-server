const mongoose = require("mongoose");
const currentTime = Date.now();
const { formatTimeUTC } = require("../utils/Timezone");
const { PLAN_STATUS } = require("./enum");
const planSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  start: {
    type: Date,
    default: currentTime,
  },
  end: {
    type: Date,
    default: currentTime,
  },
  note: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },

  photoUrl: {
    type: String,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "users",
  },

  sections: [
    {
      type: mongoose.Types.ObjectId,
      ref: "sections",
    },
  ],

  //! V2 - NEW FIELDS
  members: [
    {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
  ],

  status: {
    type: String,
    default: PLAN_STATUS.PUBLIC,
  },
});

planSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
module.exports = mongoose.model("plans", planSchema);
