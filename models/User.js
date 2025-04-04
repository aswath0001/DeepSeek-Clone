import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: false }, // Made not required
    email: { 
      type: String, 
      required: true,
      validate: {
        validator: (v) => v === null || /.+@.+\..+/.test(v),
        message: "Invalid email format"
      }
    },
    image: { type: String, required: false }
  },
  {
    timestamps: true,
    strict: false // Allows storing partial Clerk data
  }
);

// Handle duplicate key errors
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('User already exists'));
  } else {
    next(error);
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);