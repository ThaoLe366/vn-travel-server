const Place = require("../models/Place");
const Review = require("../models/Review");

const updateRateVoting = async (placeId) => {
  try {
    //Find rate and weight base.
    const placeUpdateRating = await Place.findById(placeId);
    //ReCalculate
    const reviewsOfPlace = await Review.find({
      place: placeId,
      isHidden: false,
    });

    let sum = 0,
      count = reviewsOfPlace.length;
    reviewsOfPlace.forEach((rv) => {
      sum += rv.rate;
    });
    let updatedRate =
      (sum + placeUpdateRating.rate * placeUpdateRating.weight) /
      (count + placeUpdateRating.weight);

    return Place.findOneAndUpdate(
      { _id: placeId },
      {
        rateVoting: updatedRate,
      },
      { new: true }
    );
  } catch (error) {
    return { success: false };
  }
};

module.exports = updateRateVoting;
