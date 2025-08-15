import mongoose from "mongoose"

const uri = process.env.MONGODB_URI || "mongodb+srv://adita_rwt1:14920251@mongoongoing.ysjj1.mongodb.net/"

export const connectdb = async () => {
  try {
    await mongoose.connect(uri, {
      dbName: "LiveStream",
    })
    console.log("connected to mongodb")
  } catch (error) {
    console.log(error.message)
  }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(uri, { ...opts, dbName: "LiveStream" }).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
