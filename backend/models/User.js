import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const shippingInfoSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: ""
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    district: {
      type: String,
      trim: true,
      default: ""
    },
    ward: {
      type: String,
      trim: true,
      default: ""
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ""
    },
    shippingInfo: {
      type: shippingInfoSchema,
      default: () => ({})
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword() {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
