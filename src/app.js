import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// whenever we type 'use' then that means we are writing some configuration or some middleware thing
//app.use(cors()) this is sufficient but we can pass some options inside it in a object
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//to handle json data from the request and adding the size limit
//this indicates that we are accepting json data
app.use(express.json({ limit: "16kb" }));

/* 
This is a built-in middleware provided by the Express
 framework. It parses incoming requests with URL-encoded
  payloads and is typically used for processing form data submitted 
  via POST requests.
*/

//to handle data which comes inside the url.
//extended is used to handle the nested objects
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//to store files like images, pdf, favicons which will be stored inside
// the public folder (in case we do such things)
app.use(express.static("public"));

//to perform CRUD operations in client's browser
app.use(cookieParser());

// from here we will import our routes
import userRouter from "./routes/user.routes.js";

//standard way of routes declaration

//earlier we were directly writing the routes here like app.get() etc.
//but now as we have separated the router we will use a middleware for routing
//this is the standard practise like which version of api we are giving.
app.use("/api/v1/users", userRouter); //control will be passed to userRouter

/* this /users will be prefixed to the route in the router */

export default app;
