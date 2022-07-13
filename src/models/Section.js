const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const sectionSchema = mongoose.Schema({
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "plans",
  },
  start: {
    type: Date,
    default: formatTimeUTC,
  },
  end: {
    type: Date,
    default: formatTimeUTC,
  },
  places: [
    {
      place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "places",
      },
      isVisited: {
        type: Boolean,
        default: false,
      },
      visitedTime: {
        type: Date,
      },
      expense: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updateddAt: {
    type: Date,
    default: formatTimeUTC,
  },
  note: {
    type: String,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
});

sectionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});

module.exports = mongoose.model("sections", sectionSchema);
