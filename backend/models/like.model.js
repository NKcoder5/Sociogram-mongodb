import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
}, { timestamps: true });

// Ensure unique like per user per post
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);
