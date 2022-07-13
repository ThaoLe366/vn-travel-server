const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const contributeSchema = mongoose.Schema({
  content: {
    type: String,
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "places",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  isSeen: {
    type: Boolean,
    default: false,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
});

contributeSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
module.exports = mongoose.model("contributes", contributeSchema);
