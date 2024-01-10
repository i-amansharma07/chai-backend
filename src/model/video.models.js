import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; // phase1 is to import

//aggregator is used to make more complex queries and a advance topic inside the mongoose 

const videoSchema = new mongoose.Schema({
    videFile : {
        type : String, //from cloudinary's url
        required : true
    },
    thumbnail : {
        type : String, //from cloudinary's url
        required : true
    },
    title : {
        type : String,
        required : true
    },
    duration : {
        type : Number,
        required : true
    },
    views : {
        type : Number,
        default : 0
    },
    isPublished : {
       type : Boolean,
       default : true 
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    }
},{timestamps : true});

//now before exporting we need to use aggregate

//we can use our own plugin in with the help of mongoose as aggregate is new to mongoose so we need to add it as a plugin
videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.Model('Video',videoSchema);