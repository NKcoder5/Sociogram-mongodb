import mongoose from "mongoose";

const storyViewSchema = new mongoose.Schema({
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique view per user per story
storyViewSchema.index({ storyId: 1, userId: 1 }, { unique: true });

export const StoryView = mongoose.model('StoryView', storyViewSchema);
