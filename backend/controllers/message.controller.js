import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getSocketInstance } from "../config/socket.js";
import aiChatService from '../services/aiChat.service.js';

// Send message
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { message, file } = req.body;

        console.log('📨 Send message request:', {
            senderId,
            receiverId,
            hasMessage: !!message,
            hasFile: !!file
        });

        if (!senderId || !receiverId || (!message && !file)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data'
            });
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
            isGroupChat: false
        });

        // Create conversation if it doesn't exist
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                isGroupChat: false
            });
        }

        // Create new message
        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            conversationId: conversation._id,
            content: message || '',
            messageType: file ? 'file' : 'text',
            file: file ? {
                url: file.url,
                name: file.name,
                type: file.type,
                size: file.size
            } : undefined
        });

        // Update conversation
        conversation.messages.push(newMessage._id);
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'id username profilePicture')
            .populate('receiver', 'id username profilePicture');

        // Transform for frontend
        const transformedMessage = {
            ...populatedMessage.toObject(),
            id: populatedMessage._id,
            senderId: populatedMessage.sender._id,
            receiverId: populatedMessage.receiver?._id
        };

        // Emit real-time message via socket
        const io = getSocketInstance();
        if (io) {
            io.to(conversation._id.toString()).emit('receiveMessage', transformedMessage);
            io.to(`user_${receiverId}`).emit('newMessage', transformedMessage);
            io.to(`user_${senderId}`).emit('messageSent', transformedMessage);
        }

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: transformedMessage
        });

    } catch (error) {
        console.error('❌ Send message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// Send message to an existing conversation (group or direct) by conversationId
export const sendMessageToConversation = async (req, res) => {
    try {
        const senderId = req.id;
        const { conversationId } = req.params;
        const { message, file } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.includes(senderId);
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant of this conversation' });
        }

        const newMessage = await Message.create({
            sender: senderId,
            conversationId,
            content: message || '',
            messageType: file ? 'file' : 'text',
            file: file ? {
                url: file.url,
                name: file.name,
                type: file.type,
                size: file.size
            } : undefined
        });

        // Update conversation
        conversation.messages.push(newMessage._id);
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'id username profilePicture');

        // Transform for frontend
        const transformedMessage = {
            ...populatedMessage.toObject(),
            id: populatedMessage._id,
            senderId: populatedMessage.sender._id
        };

        // Emit real-time to conversation room
        const io = getSocketInstance();
        if (io) {
            io.to(conversationId).emit('receiveMessage', transformedMessage);
        }

        return res.status(200).json({ success: true, data: transformedMessage });
    } catch (error) {
        console.log('Send to conversation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get messages for a conversation (direct message pairing)
export const getMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
            isGroupChat: false
        }).populate({
            path: 'messages',
            populate: [
                { path: 'sender', select: 'id username profilePicture' },
                { path: 'receiver', select: 'id username profilePicture' }
            ],
            options: { sort: { createdAt: 1 } }
        });

        if (!conversation) {
            return res.status(200).json({
                success: true,
                messages: []
            });
        }

        // Transform messages for frontend
        const transformedMessages = conversation.messages.map(msg => ({
            ...msg.toObject(),
            id: msg._id,
            senderId: msg.sender?._id,
            receiverId: msg.receiver?._id
        }));

        return res.status(200).json({
            success: true,
            messages: transformedMessages
        });
    } catch (error) {
        console.log('Get messages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get messages by conversationId
export const getMessagesByConversation = async (req, res) => {
    try {
        const userId = req.id;
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate({
                path: 'messages',
                populate: [
                    { path: 'sender', select: 'id username profilePicture' },
                    { path: 'receiver', select: 'id username profilePicture' }
                ],
                options: { sort: { createdAt: 1 } }
            });

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.includes(userId);
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant of this conversation' });
        }

        // Transform messages for frontend
        const transformedMessages = conversation.messages.map(msg => ({
            ...msg.toObject(),
            id: msg._id,
            senderId: msg.sender?._id,
            receiverId: msg.receiver?._id
        }));

        return res.status(200).json({ success: true, messages: transformedMessages });
    } catch (error) {
        console.log('Get messages by conversation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: { $in: [req.id] }
        })
            .populate('participants', 'id username profilePicture')
            .populate('lastMessage')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'id username profilePicture' }
            })
            .populate('groupOwner', 'id username profilePicture')
            .sort({ updatedAt: -1 });

        // Transform for frontend: wrap participants in a 'user' object and add 'id'
        const transformedConversations = conversations.map(conv => {
            const convObj = conv.toObject();
            return {
                ...convObj,
                id: convObj._id,
                participants: convObj.participants.map(p => ({
                    user: { ...p, id: p._id }
                })),
                lastMessage: convObj.lastMessage ? {
                    ...convObj.lastMessage,
                    id: convObj.lastMessage._id,
                    senderId: convObj.lastMessage.sender?._id || convObj.lastMessage.sender
                } : null
            };
        });

        return res.status(200).json({
            success: true,
            conversations: transformedConversations
        });
    } catch (error) {
        console.log('Get conversations error:', error);
        return res.status(200).json({
            success: true,
            conversations: []
        });
    }
};

// Create group conversation
export const createGroupChat = async (req, res) => {
    try {
        let { participants, groupName } = req.body;
        const adminId = req.id;

        if (Array.isArray(participants)) {
            participants = participants.map(p => typeof p === 'string' ? p : p?.id || p?.userId).filter(Boolean);
        }

        if (!participants || participants.length < 1) {
            return res.status(400).json({
                success: false,
                message: 'Group must have at least 1 participant besides you'
            });
        }

        const conversation = await Conversation.create({
            isGroupChat: true,
            groupName,
            participants: [adminId, ...participants],
            groupAdmin: [adminId],
            groupOwner: adminId
        });

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'id username profilePicture');

        return res.status(201).json({
            success: true,
            conversation: populatedConversation
        });
    } catch (error) {
        console.log('Create group chat error:', error);
        return res.status(400).json({
            success: false,
            message: 'Invalid group creation payload'
        });
    }
};

// Delete message
export const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (message.sender.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this message'
            });
        }

        await Message.findByIdAndDelete(messageId);

        // Remove from conversation
        await Conversation.findByIdAndUpdate(message.conversationId, {
            $pull: { messages: messageId }
        });

        // Emit socket event
        const io = getSocketInstance();
        if (io) {
            io.to(message.conversationId.toString()).emit('messageDeleted', { messageId });
        }

        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.log('Delete message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Mark a message as read
export const markMessageRead = async (req, res) => {
    try {
        const userId = req.id;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

        // Ensure user is participant of conversation
        const convo = await Conversation.findById(message.conversationId);
        const isParticipant = convo?.participants.includes(userId);
        if (!isParticipant) return res.status(403).json({ success: false, message: 'Forbidden' });

        // Update read status in message if not already read by this user
        await Message.updateOne(
            { _id: messageId, "readBy.userId": { $ne: userId } },
            { $addToSet: { readBy: { userId, readAt: new Date() } } }
        );

        // Emit read receipt
        const io = getSocketInstance();
        if (io) io.to(message.conversationId.toString()).emit('messageRead', { messageId, userId, readAt: new Date() });

        return res.status(200).json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.log('Mark message read error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Handle typing indicators
export const handleTyping = async (req, res) => {
    try {
        const senderId = req.id;
        const { receiverId, conversationId, isTyping } = req.body;

        const io = getSocketInstance();
        if (io) {
            if (conversationId) {
                // Group chat typing
                io.to(conversationId).emit('typing', {
                    senderId,
                    conversationId,
                    isTyping
                });
            } else if (receiverId) {
                // Direct message typing
                io.to(`user_${receiverId}`).emit('typing', {
                    senderId,
                    receiverId,
                    isTyping
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Typing status sent'
        });
    } catch (error) {
        console.log('Handle typing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Upload file for messages
// Add message reaction
export const addMessageReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const userId = req.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if reaction already exists
        const existingReaction = message.reactions?.find(r => r.userId.toString() === userId && r.emoji === emoji);
        if (existingReaction) {
            return res.status(400).json({
                success: false,
                message: 'Reaction already exists'
            });
        }

        await Message.findByIdAndUpdate(messageId, {
            $push: { reactions: { userId, emoji } }
        });

        return res.status(200).json({
            success: true,
            message: 'Reaction added'
        });
    } catch (error) {
        console.log('Add reaction error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Remove message reaction
export const removeMessageReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const userId = req.id;

        await Message.findByIdAndUpdate(messageId, {
            $pull: { reactions: { userId, emoji } }
        });

        return res.status(200).json({
            success: true,
            message: 'Reaction removed'
        });
    } catch (error) {
        console.log('Remove reaction error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get message reactions
export const getMessageReactions = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId)
            .populate('reactions.userId', 'id username');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Group reactions by emoji
        const groupedReactions = message.reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = [];
            }
            acc[reaction.emoji].push(reaction.userId);
            return acc;
        }, {});

        return res.status(200).json({
            success: true,
            data: groupedReactions
        });
    } catch (error) {
        console.log('Get reactions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const uploadMessageFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const fileData = {
            url: fileUrl,
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size
        };

        console.log('📁 Message file uploaded:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            url: fileUrl
        });

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: fileData
        });
    } catch (error) {
        console.log('Upload file error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// AI Chat Assistant
export const aiChatAssistant = async (req, res) => {
    try {
        const userId = req.id;
        const { message, conversationId, systemPrompt } = req.body;

        console.log('🤖 AI Chat Assistant Request:', {
            userId,
            message: message?.substring(0, 50) + '...',
            conversationId,
            hasSystemPrompt: !!systemPrompt
        });

        // Get user context
        const user = await User.findById(userId).select('username bio');

        // Get conversation history if provided
        let conversationHistory = [];
        if (conversationId && conversationId !== 'floating-assistant') {
            const messages = await Message.find({ conversationId })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('content sender isAI');

            conversationHistory = messages.reverse().map(msg => ({
                content: msg.content,
                isAI: msg.isAI
            }));
        }

        // Generate AI response
        const aiResponse = await aiChatService.generateResponse(
            message,
            conversationHistory,
            { username: user.username, bio: user.bio },
            systemPrompt
        );
        const aiText = aiResponse.success ? aiResponse.response : aiResponse.fallbackResponse || "I'm here to help! Could you tell me more about what you need? 😊";

        // For floating assistant, don't create database entries
        if (conversationId === 'floating-assistant') {
            return res.status(200).json({
                success: true,
                response: aiText,
                usage: aiResponse.usage || null,
                conversationId: 'floating-assistant'
            });
        }

        // For regular AI conversations, ensure conversation exists
        let aiConversationId = conversationId;
        if (!aiConversationId) {
            let conversation = await Conversation.findOne({
                isAI: true,
                participants: { $in: [userId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    isGroupChat: false,
                    isAI: true,
                    groupName: 'AI Assistant',
                    participants: [userId]
                });
            }
            aiConversationId = conversation._id;
        }

        // Persist messages
        const userMsg = await Message.create({
            content: message,
            sender: userId,
            conversationId: aiConversationId,
            messageType: 'text',
            isAI: false
        });

        const aiMsg = await Message.create({
            content: aiText,
            sender: userId,
            conversationId: aiConversationId,
            messageType: 'text',
            isAI: true
        });

        // Update conversation
        await Conversation.findByIdAndUpdate(aiConversationId, {
            $push: { messages: { $each: [userMsg._id, aiMsg._id] } },
            lastMessage: aiMsg._id
        });

        // Transform for frontend
        const transformMsg = (msg) => ({
            ...msg.toObject(),
            id: msg._id,
            senderId: msg.sender?._id || msg.sender,
            content: msg.content
        });

        const transformedUserMsg = transformMsg(userMsg);
        const transformedAiMsg = transformMsg(aiMsg);

        // Emit both messages
        const io = getSocketInstance();
        if (io) {
            io.to(aiConversationId.toString()).emit('receiveMessage', transformedUserMsg);
            io.to(aiConversationId.toString()).emit('receiveMessage', transformedAiMsg);
        }

        return res.status(200).json({
            success: true,
            response: aiText,
            usage: aiResponse.usage || null,
            conversationId: aiConversationId
        });
    } catch (error) {
        console.log('AI Chat Assistant error:', error);
        return res.status(200).json({ success: true, response: "I'm here to help! Could you tell me more?", usage: null });
    }
};

// Ensure an AI conversation exists and return it
export const ensureAIConversation = async (req, res) => {
    try {
        const userId = req.id;
        let conversation = await Conversation.findOne({
            isAI: true,
            participants: { $in: [userId] }
        }).populate('participants', 'id username profilePicture');

        if (!conversation) {
            conversation = await Conversation.create({
                isGroupChat: false,
                isAI: true,
                groupName: 'AI Assistant',
                participants: [userId]
            });
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'id username profilePicture');
        }
        return res.status(200).json({ success: true, conversation });
    } catch (error) {
        console.log('Ensure AI conversation error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Smart Reply Suggestions
export const getSmartReplies = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.id;

        const user = await User.findById(userId).select('username');

        const suggestions = await aiChatService.generateSmartReply(message, {
            username: user.username
        });

        return res.status(200).json({
            success: true,
            suggestions: suggestions.suggestions
        });
    } catch (error) {
        console.log('Smart replies error:', error);
        return res.status(500).json({
            success: false,
            suggestions: ['Thanks! 😊', 'Got it 👍', 'Tell me more']
        });
    }
};

// Message Improvement
export const improveMessage = async (req, res) => {
    try {
        const { message, tone = 'friendly' } = req.body;

        const improved = await aiChatService.improveMessage(message, tone);

        return res.status(200).json({
            success: true,
            originalMessage: message,
            improvedMessage: improved.success ? improved.improvedMessage : message
        });
    } catch (error) {
        console.log('Message improvement error:', error);
        return res.status(500).json({
            success: false,
            originalMessage: req.body.message
        });
    }
};

// Message Translation
export const translateMessage = async (req, res) => {
    try {
        const { message, targetLanguage = 'en' } = req.body;

        const translation = await aiChatService.translateMessage(message, targetLanguage);

        return res.status(200).json({
            success: true,
            originalMessage: message,
            translation: translation.success ? translation.translation : message,
            targetLanguage
        });
    } catch (error) {
        console.log('Message translation error:', error);
        return res.status(500).json({
            success: false,
            originalMessage: req.body.message
        });
    }
};

// Conversation Starter
export const getConversationStarter = async (req, res) => {
    try {
        const userId = req.id;
        const { targetUserId } = req.params;

        // Get both user profiles
        const [user, targetUser] = await Promise.all([
            User.findById(userId).select('username bio'),
            User.findById(targetUserId).select('username bio')
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const starter = await aiChatService.generateConversationStarter({
            currentUser: user.username,
            targetUser: targetUser.username,
            targetUserBio: targetUser.bio
        });

        return res.status(200).json({
            success: true,
            starter: starter.starter
        });
    } catch (error) {
        console.log('Conversation starter error:', error);
        return res.status(500).json({
            success: false,
            starter: "Hey! How's your day going? 😊"
        });
    }
};

// Message Moderation
export const moderateMessage = async (req, res) => {
    try {
        const { message } = req.body;

        const moderation = await aiChatService.moderateMessage(message);

        return res.status(200).json({
            success: true,
            isSafe: moderation.isSafe,
            reason: moderation.reason,
            message: moderation.isSafe ? 'Message is appropriate' : 'Message flagged for review'
        });
    } catch (error) {
        console.log('Message moderation error:', error);
        return res.status(500).json({
            success: true, // Default to safe
            isSafe: true,
            message: 'Moderation service unavailable'
        });
    }
};

// Group Management Functions
export const addGroupMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        const adminId = req.id;

        const group = await Conversation.findById(groupId);

        if (!group || !group.isGroupChat) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const isAdmin = group.groupAdmin.includes(adminId) || group.groupOwner.toString() === adminId;
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Add member
        if (!group.participants.includes(userId)) {
            group.participants.push(userId);
            await group.save();
        }

        return res.status(200).json({ success: true, message: 'Member added successfully' });
    } catch (error) {
        console.log('Add group member error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const removeGroupMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        const adminId = req.id;

        const group = await Conversation.findById(groupId);

        if (!group || !group.isGroupChat) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const isAdmin = group.groupAdmin.includes(adminId) || group.groupOwner.toString() === adminId;
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Remove member
        group.participants = group.participants.filter(p => p.toString() !== userId);
        group.groupAdmin = group.groupAdmin.filter(a => a.toString() !== userId);
        await group.save();

        return res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        console.log('Remove group member error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.id;

        await Conversation.findByIdAndUpdate(groupId, {
            $pull: { participants: userId, groupAdmin: userId }
        });

        return res.status(200).json({ success: true, message: 'Left group successfully' });
    } catch (error) {
        console.log('Leave group error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const adminId = req.id;

        const group = await Conversation.findById(groupId);

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        if (group.groupOwner.toString() !== adminId) {
            return res.status(403).json({ success: false, message: 'Only group owner can delete the group' });
        }

        // Delete all messages in the conversation
        await Message.deleteMany({ conversationId: groupId });

        // Delete the conversation
        await Conversation.findByIdAndDelete(groupId);

        return res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.log('Delete group error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};