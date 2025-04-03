import mongoose from "mongoose";

let cached = global.mongoose || {conn:null, Promise:null};

export default async function connectDB() {
    if(cached.conn) return cached.conn;
    if(!cached.promise){
        cached.promise = mongoose.connect(process.env.MONGODB_URI).then((mongoose) => mongoose)
    }
    try {
        cached.conn = await  cached.promise
    }catch(error){
            console.log("error connecting mongoDB:" ,error);
    }
    return cached.conn
}