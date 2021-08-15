const { User } = require("../models/index");
const express = require("express");

const requireRole = async (routeRole, req, res, next, cd) => {
  try {
    console.log(req.body);
    const snapshot = await User.findOne({ email: req.body.userAuth.email });
    if (snapshot) {
      if (
        (routeRole == "admin" && !snapshot.isUser) ||
        (routeRole == "user" && snapshot.isUser)
      ) {
        cd(req, res, next);
      } else {
        return res.status(500).json({
          message: "Permission denied",
        });
      }
    } else {
      return res.status(404).json({
        message: "User not found",
      });
    }
  } catch (error) {
    return res.status(403).json({
      message: error.message,
    });
  }
};
module.exports= requireRole;
