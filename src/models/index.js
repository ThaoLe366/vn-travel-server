const mongoose = require("mongoose");
const { STATUS } = require("./enum");

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    require: true,
    min: 1,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  favorite: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Place",
    default:[]
  },
  isUser: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
exports.User = mongoose.model("User", userSchema);

const placeSchema = mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    default: "",
  },
  longtitude: {
    type: mongoose.Schema.Types.Decimal128,
    require: true,
  },
  lattitude: {
    type: mongoose.Schema.Types.Decimal128,
    require: true,
  },
  tadId: [String],
  rate: {
    type: mongoose.Schema.Types.Decimal128,
    require: true,
  },
  reviewCount: mongoose.Schema.Types.Decimal128,
  weight: Number,
  province: String,
  status: {
    type: String,
    default: STATUS.PUBLIC,
  },
  closeTime: mongoose.Schema.Types.Decimal128,
  openTime: mongoose.Schema.Types.Decimal128,
  price: {
    type: [mongoose.Schema.Types.Decimal128],
  },
});

placeSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
exports.Place = mongoose.model("Place", placeSchema);
