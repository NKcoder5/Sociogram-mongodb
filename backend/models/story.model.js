import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String,
        required: true
    },
    mediaUrl: {
        type: String
    },
    mediaType: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'image'
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
