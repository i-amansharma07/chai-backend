import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId, //user who is subscribing
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId, // the owner of channel
        ref : "User"
    } 
},{timestamps : true})

export const Subscription = mongoose.Model("Subscription",subscriptionSchema)