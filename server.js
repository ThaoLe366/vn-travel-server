const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerUI = require('swagger-ui-express');
const swaggerJSDocs = require('swagger-jsdoc');


const app = express();

//Config CORS
const cors=require('cors')
app.options('*', cors())

//Config env
dotenv.config({ path: "./config.env" });

//Middleware
app.use(express.json());
app.use(morgan("tiny"));

//Base url
const api=process.env.API_URL

//Router
const authRouter=require('./src/routers/authRoutes')
const userRouter=require('./src/routers/userRoutes')
const placeRouter=require('./src/routers/placeRoutes')

//Config swagger
const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
    },
    swaggerOptions: {
      authAction :{ JWT: {name: "JWT", schema: {type: "apiKey", in: "header", name: "Authorization", description: ""}, value: "Bearer <JWT>"} }
    },
    //where get swagger config
    apis: ['./src/routers/users.js'], // files containing annotations as above
  };
const swagger= swaggerJSDocs(options);

//Direct router
app.use(`${api}/auths`, authRouter)
app.use(`${api}/users`, userRouter)
app.use(`${api}/places`, placeRouter)
//Get Swagger API
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swagger));

//Connect mongo db
mongoose
  .connect(process.env.BASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Mongoose connect");
  });

//Server config
app.listen(5000, () => {
  console.log("***  localhost 5000");
});
