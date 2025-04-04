import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true
    },
    image: { type: String }
  },
  {
    timestamps: true,
    strict: false // Allows storing Clerk's full payload
  }
);

// Add indexes
userSchema.index({ email: 1 }, { unique: true });

// Handle duplicate key errors
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);