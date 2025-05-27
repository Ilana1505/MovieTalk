import mongoose from 'mongoose';

export interface iComment {
  comment: string;
  postId: string;
  sender: string;
}

const CommentSchema = new mongoose.Schema<iComment>({
  comment: { type: String, required: true },
  postId: { type: String, required: true },
  sender: { type: String, required: true }
});

const CommentModel = mongoose.model<iComment>('comments', CommentSchema);

export default CommentModel;