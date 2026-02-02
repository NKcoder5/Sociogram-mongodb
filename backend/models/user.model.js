import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            // Password is only required for email/password authentication (not Firebase OAuth)
            return this.provider === 'email';
        }
    },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female'] },
    isPrivate: { type: Boolean, default: false },
    firebaseUid: { type: String, unique: true, sparse: true },
    provider: { type: String, default: 'email' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);