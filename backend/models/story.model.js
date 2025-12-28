import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mediaUrl: {
        type: String
    },
    mediaType: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },
    text: {
        type: String
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export const Story = mongoose.model('Story', storySchema);
