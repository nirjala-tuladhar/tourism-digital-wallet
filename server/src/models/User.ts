import bcrypt from "bcrypt";
import mongoose, { HydratedDocument, Schema } from "mongoose";

export type UserAttrs = {
  name: string;
  email: string;
  password: string;
};

export type UserMethods = {
  comparePassword(candidatePassword: string): Promise<boolean>;
};

export type UserDocument = HydratedDocument<UserAttrs, UserMethods>;

const userSchema = new Schema<UserAttrs, mongoose.Model<UserAttrs, object, UserMethods>, UserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const user = ret as {
          password?: string;
          __v?: number;
        };

        delete user.password;
        delete user.__v;
        return user;
      },
    },
  },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserAttrs, mongoose.Model<UserAttrs, object, UserMethods>>(
  "User",
  userSchema,
);
