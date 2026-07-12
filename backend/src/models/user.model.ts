import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.statics.hashPassword = async function (password: string) {
  return bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.__v;

  return obj;
};

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
