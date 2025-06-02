import mongoose from 'mongoose';

export interface iUser { 
  email: string; 
  password: string;
  _id?: string; 
  fullName?: string;
  profilePicture?: string;
  refreshTokens?: string[]; 
}

const UserSchema = new mongoose.Schema<iUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: "" },
  profilePicture: { type: String, default: "" },
  refreshTokens: { type: [String], default: [] }
});

const UserModel = mongoose.model<iUser>("user", UserSchema);
export default UserModel;