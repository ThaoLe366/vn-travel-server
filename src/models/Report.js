const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const reportSchema = mongoose.Schema({
  reason: {
    type: String,
    require: true,
  },
  review: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "reviews",
  },
  reporter: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
  },
  isSeen: {
    type: Boolean,
    default: false,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
});

reportSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
module.exports = mongoose.model("reports", reportSchema);
