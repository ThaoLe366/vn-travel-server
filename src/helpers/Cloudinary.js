const cloudinary = require("cloudinary").v2;
const dotenv =require('dotenv')

//Config env
dotenv.config({ path: "./config.env" });

//Config to cloudinary store
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

module.exports = {
  uploadSingle: (file) => {
    return new Promise((resolve) => {
      cloudinary.uploader
        .upload(file, {
          folder: "places",
        })
        .then((result) => {
          if (result) {
            const fs = require('fs');
            fs.unlinkSync(file);
            resolve ({ url: result.secure_url });
          }
        });
    });
  },
};
