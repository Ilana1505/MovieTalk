import mongoose from 'mongoose';

export interface iUser { 
  email: string; 
  password: string;
  _id?: string; 
  refreshTokens?: string[]; 
  fullName?: string;
}

const UserSchema = new mongoose.Schema<iUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshTokens: { type: [String], default: [] },
  fullName: { type: String }
});

const UserModel = mongoose.model<iUser>("user", UserSchema);
export default UserModel;