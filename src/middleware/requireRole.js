const User = require("../models/User");
const express = require("express");

const requireRole = async (routeRole, req, res, next, cd) => {
  try {
    const snapshot = await User.findOne({ email: req.body.userAuth.email });
    if (snapshot) {
      if (
        (routeRole == 'admin' && !snapshot.isUser) ||
        (routeRole == 'user' && snapshot.isUser)
      ) {

        cd(req, res, next);
      } else {
        return res.status(500).json({
          message: "Permission denied",
          success: false
        });
      }
    } else {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }
  } catch (error) {

    console.log(error)
    return res.status(403).json({
      message: error.message,
      success: false
    });
  }
};
module.exports = requireRole;
