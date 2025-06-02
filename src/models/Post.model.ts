import mongoose from 'mongoose';

export interface iPost {
    title: string;
    description: string;
    review: string;
    image?: string; // קישור לתמונה (לא חובה)
    sender: string;
}

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true }, // שם הסרט
  description: { type: String, required: true }, // תיאור הסרט
  review: { type: String, required: true }, // הביקורת
  image: { type: String }, // קישור לתמונה (למשל מ־Cloudinary)
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 
}, { timestamps: true });


const PostModel = mongoose.model<iPost>('posts', PostSchema);
export default PostModel;