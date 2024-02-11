//require('dotenv').config({path : './env'}) breaks the code cosistency of using import statement
import dotenv from "dotenv" //also make changes inside the package.json script tag (dev)
import connectDB from "./db/index.js" //somtimes had to mention the extension as well
import app from './app.js'

dotenv.config({
   path: './.env'
})

// mongoose will connect our server with database i.e mongodb

/* points to be noted

1. while connecting to the db there is always a chance for some errors so try to wrap them up inside
   a try catch block or inside promises by using .then and  .catch

2. db will always in some other component means : it will always take some time to do db operations like
   connecting db or req res things, so always use async await while dealing with db.

*/


// first appraoch (putting all the connection code inside the index.js file)
/*
import mongoose from "mongoose";
import {DB_NAME} from "./constants"
import express from "express";
const app = express()

(async ()=>{

try {

   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

   //this is the listener listen to the error which can occus when
   //our express app is not able to connect with db
   app.on('error',(error)=>{
      console.log('Err : ',error);
      throw error
   })


   app.listen(process.env.PORT,()=>{
      console.log(`App is listening at port : ${process.env.PORT}`);
   })

} catch (error) {
   console.error('Some Error Occurred : ',error)
}


})() //iffy (creating and calling fucntion at once)
*/


//second apprach (modular approach, connection code is written inside the db/index.js)
connectDB()
   .then(() => {

      //mogo db has been connected now start the app
      initaiteApp()

   }).catch((error) => {
      console.log('Mongo Db failed to connect!!! : ', error);
   })

function initaiteApp() {
   const port = process.env.PORT || 8000;

   //here we first listen to an error event better
   //to do before listening to port
   app.on('error', (error) => {
      console.log('Err : ', error);
      throw error
   })

   app.listen(port, () => {
      console.log(`app is runnig at port : ${process.env.PORT}`);
   })
}