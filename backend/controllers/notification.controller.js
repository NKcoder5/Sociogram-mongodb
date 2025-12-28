import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { getSocketInstance } from "../config/socket.js";

// Create a notification
export const createNotification = async (senderId, receiverId, type, message, postId = null) => {
    try {
        // Don't create notification if sender and receiver are the same
        if (senderId.toString() === receiverId.toString()) return null;

        const notification = await Notification.create({
            sender: senderId,
            receiver: receiverId,
            type,
            message,
            postId
        });

        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'id username profilePicture')
            .populate('postId', 'id caption image');

        // Transform for frontend
        const transformedNotification = {
            ...populatedNotification.toObject(),
            id: populatedNotification._id,
            senderId: populatedNotification.sender?._id || populatedNotification.sender
        };

        // Emit real-time notification
        const io = getSocketInstance();
        if (io) {
            io.to(`user_${receiverId}`).emit('newNotification', transformedNotification);
        }

        return transformedNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Get user notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', 'id username profilePicture')
            .populate('postId', 'id caption image')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({
            receiver: userId,
            isRead: false
        });

        const total = await Notification.countDocuments({ receiver: userId });

        // Transform for frontend
        const transformedNotifications = notifications.map(notif => ({
            ...notif.toObject(),
            id: notif._id,
            senderId: notif.sender?._id || notif.sender
        }));

        return res.status(200).json({
            success: true,
            notifications: transformedNotifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const userId = req.id;
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                receiver: userId // Ensure user can only mark their own notifications
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.id;

        await Notification.updateMany(
            {
                receiver: userId,
                isRead: false
            },
            { isRead: true }
        );

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const userId = req.id;
        const { notificationId } = req.params;

        const result = await Notification.deleteOne({
            _id: notificationId,
            receiver: userId // Ensure user can only delete their own notifications
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.id;

        const unreadCount = await Notification.countDocuments({
            receiver: userId,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
