import mongoose from 'mongoose';

export interface iPost {
    title: string;
    description: string;
    review: string;
    image?: string; // קישור לתמונה (לא חובה)
    sender: string;
    likes?: string[]; // array of userIds
    comments?: mongoose.Schema.Types.ObjectId[]; // array of comment IDs
}

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true }, // שם הסרט
  description: { type: String, required: true }, // תיאור הסרט
  review: { type: String, required: true }, // הביקורת
  image: { type: String }, // קישור לתמונה (למשל מ־Cloudinary)
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 
  likes: { type: [String], default: [] }, // array of userIds
comments: { type: [mongoose.Schema.Types.ObjectId], ref: "Comment", default: [] }
}, { timestamps: true });


const PostModel = mongoose.model<iPost>('posts', PostSchema);
export default PostModel;