import mongoose, { Document, Schema } from "mongoose";

export interface iPost extends Document {
  title: string;
  description: string;
  review: string;
  image?: string;
  sender: mongoose.Types.ObjectId;
  likes: string[]; // userIds
  comments: mongoose.Types.ObjectId[]; // comment IDs
}

const PostSchema = new Schema<iPost>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    review: { type: String, required: true },
    image: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: "user", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "user", default: [] }],
    comments: { type: [Schema.Types.ObjectId], ref: "Comment", default: [] },
  },
  { timestamps: true }
);

const PostModel = mongoose.model<iPost>("posts", PostSchema);
export default PostModel;
