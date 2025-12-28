import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    isAI: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        default: null
    },
    groupDescription: {
        type: String,
        default: null
    },
    groupAdmin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    groupOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    groupSettings: {
        isPrivate: {
            type: Boolean,
            default: false
        },
        allowMemberInvites: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        muteNotifications: {
            type: Boolean,
            default: false
        }
    },
    groupAvatar: {
        type: String,
        default: null
    }
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);