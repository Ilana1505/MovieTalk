import mongoose from 'mongoose';

export interface iPost {
    title: string;
    content: string;
    sender: string;
}

const PostSchema = new mongoose.Schema<iPost>({
    title: { type: String, required: true },
    content: { type: String },
    sender: { type: String, required: true }
});

const PostModel = mongoose.model<iPost>('posts', PostSchema);
export default PostModel;