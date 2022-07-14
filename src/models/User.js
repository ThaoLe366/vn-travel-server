const mongoose = require("mongoose");
const { formatTimeUTC } = require("../utils/Timezone");

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    require: true,
    min: 1,
  },
  aboutMe: {
    type: String,
    require: false,
    default: "",
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  favorite: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "places",
    },
  ],
  isUser: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: formatTimeUTC,
  },
  image: {
    type: String,
    default: "https://hinhnen123.com/wp-content/uploads/2021/06/avt-cute-9.jpg",
  },
  isHidden: {
    type: Boolean,
    default: false,
  },

  //!ADD NEW FIELDS
  recentSearch: [
    {
      place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "places",
      },
      time: {
        type: Date,
        default: formatTimeUTC,
      },
    },
  ],

  //! V2 - NEW FIELDS
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  ],

  //!V2 - NEW FIELDS
  friendsRequested: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: [],
    },
  ],
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  },
});
module.exports = mongoose.model("users", userSchema);
