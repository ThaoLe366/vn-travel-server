const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerUI = require("swagger-ui-express");
const swaggerJSDocs = require("swagger-jsdoc");

const app = express();

//Config CORS
const cors = require("cors");
app.options("*", cors());

//Config env
dotenv.config({ path: "./config.env" });

//Middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use("/public/images", express.static("public/images"));
//CORS
app.use(cors());
//Base url: no slash at the end
const api = process.env.API_URL;

//Router
const authRouter = require("./src/routers/authRoutes");
const userRouter = require("./src/routers/userRoutes");
const placeRouter = require("./src/routers/placeRoutes");
const contributeRouter = require("./src/routers/contributeRoutes");
const planRouter = require("./src/routers/planRoutes");
const sectionRouter = require("./src/routers/sectionRoutes");
const tagRouter = require("./src/routers/tagRoutes");
const imageRouter = require("./src/routers/imageRoutes");
const provinceRouter = require("./src/routers/provinceRoutes");
const categoryRouter = require("./src/routers/categorieRoutes");
const reportRouter = require("./src/routers/reportRoutes");
const reviewRouter = require("./src/routers/reviewRoutes");
const explorerRouter = require("./src/routers/explorerRoutes");
const searchRouter = require("./src/routers/searchRoute");
const recommendeeRouter = require("./src/routers/recommendeeRoutes.js");
const { announcementRouter } = require("./src/routers/announmentRoutes");

//Config swagger
const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Hello World",
      version: "1.0.0",
    },
  },
  security: [
    {
      authAction: [],
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
  swaggerOptions: {
    authAction: {
      JWT: {
        name: "JWT",
        schema: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "",
        },
        value: "Bearer <JWT>",
      },
    },
  },
  //where get swagger config
  apis: ["./src/routers/userRoutes.js"], // files containing annotations as above
};
const swagger = swaggerJSDocs(options);

app.get(`/`, (req, res) => {
  res.status(200).json({
    message: "Welcome to Viet Nam Travel  3",
  });
});

//Direct router
app.use(`${api}/contributes`, contributeRouter);
app.use(`${api}/auths`, authRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/places`, placeRouter);
app.use(`${api}/plans`, planRouter);
app.use(`${api}/sections`, sectionRouter);
app.use(`${api}/tags`, tagRouter);
app.use(`${api}/images`, imageRouter);
app.use(`${api}/provinces`, provinceRouter);
app.use(`${api}/categories`, categoryRouter);
app.use(`${api}/reviews`, reviewRouter);
app.use(`${api}/reports`, reportRouter);
app.use(`${api}/explorers`, explorerRouter);
app.use(`${api}/search`, searchRouter);
app.use(`${api}/recommendee`, recommendeeRouter);
app.use(`${api}/annoucements`, announcementRouter);

//Get Swagger API
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swagger, { explorer: true })
);

//Connect mongo db
mongoose
  .connect(process.env.BASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log(" Mongoose connect");
  });

//Server config
app.listen(process.env.PORT || 5000, () => {
  console.log("***  localhost 5000");
});
