import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

/* 
Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js. 
It provides a way to interact with MongoDB in a more organized and intuitive manner, 
especially when working with Node.js and Express.

Here's why Mongoose is commonly used in Express and MongoDB applications:

1.Schema Definition: Mongoose allows you to define a schema for your data, specifying the structure, data types, and validation rules. This makes it easier to organize and manage your data.

2.Validation: With Mongoose, you can define validation rules for your data. This helps ensure that only valid data is stored in your database, enhancing the integrity of your application.

3.Middleware: Mongoose supports middleware functions that allow you to execute logic before or after certain events, like saving or querying data. This is useful for tasks such as data transformation or validation.

4.Query Building: Mongoose provides a powerful and flexible way to build and execute queries, making it easier to interact with MongoDB from your Express application.

5.Population: Mongoose allows you to reference other documents in your schema, facilitating relationships between different types of data. This is useful when dealing with more complex data structures.

6.Ease of Use: Overall, Mongoose simplifies the interaction with MongoDB, making it more developer-friendly and reducing the amount of boilerplate code you need to write.

*/

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true //to make the field searchable in the db (indexing concept in db)
    },
    fullName: {
        type: String,
        unique : true,
        trim : true,
        index : true
    },
    email: {
        type: String,
        required: true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true 
    },
    avatar: {
        type: String, // cloudinary url will be stored here
        required : true
    },
    coverImage: {
        type: String, // cloudinary url will be stored here
    },
    password: {
        type: String,
        required: [true,'Password is required'], //custom msg
    },
    otp : {
        type : String 
    },
    refreshToken: {
        type: String,
        // required: true,
    },
    watchHistory :[
        {
            type : Schema.Types.ObjectId,
            ref : 'Video'
        }
    ]

}, { timestamps: true });


//we utilise the power of hooks given us by mongoose just like we added plugin inside the video model for aggreagate

//this will run just before happening of some event like save, remove, update, delete, etc.
//first param - event name, second param - a call back which can't be arrow function due to "this" value inside arrow function (this will be async as it will take some cpu time)
userSchema.pre("save", async function(next){//next is because it is a middle ware, after doing the task  pass  call next function and pass the responsibility to other middleware 
   if(this.isModified('password')){ // this to only encrypt the pass when the password field is changed (like when creating an account or updating the pass)
    this.password = await bcrypt.hash(this.password,10) //first param is asks for input to be hashed, second param is for number of rounds rounds.
   }
    next() //calling the next at the end
}) 


//custom methods - for checking the password sent by user is same as the encrypted password inside the db (if same then true else false )
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}




// jwt is bearer token, those who have this token(bear the token) that person can access the data, JWT library can make the tokens by taking some inputs
userSchema.methods.generateAccessToken = function(){
    // it needs (payloadObj,secretKey,{expiresIn : expire time})
   return jwt.sign(
         {
            _id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// refresh token is same as access but it's liftime is more and have less info than access token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
           _id : this._id,
       },
       process.env.REFRESH_TOKEN_SECRET,
       {
           expiresIn : process.env.REFRESH_TOKEN_EXPIRY
       }
   )
}

export const User = mongoose.model('User', userSchema);