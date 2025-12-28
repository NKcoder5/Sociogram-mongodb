import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { getSocketInstance } from "../config/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, description, participants, settings } = req.body;
        const userId = req.id;

        if (!name || !participants || participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Group name and participants are required"
            });
        }

        // Validate participants exist
        const validParticipants = await User.find({
            _id: { $in: participants }
        }).select('id username profilePicture');

        if (validParticipants.length !== participants.length) {
            return res.status(400).json({
                success: false,
                message: "Some participants not found"
            });
        }

        // Create group conversation
        const groupConversation = await Conversation.create({
            groupName: name,
            groupDescription: description || null,
            isGroupChat: true,
            groupOwner: userId,
            participants: [userId, ...participants],
            groupAdmin: [userId],
            groupSettings: {
                isPrivate: settings?.isPrivate || false,
                allowMemberInvites: settings?.allowMemberInvites || true,
                requireApproval: settings?.requireApproval || false,
                muteNotifications: settings?.muteNotifications || false
            }
        });

        const populatedGroup = await Conversation.findById(groupConversation._id)
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture');

        // Emit socket event for real-time updates
        try {
            const io = getSocketInstance();
            const participantIds = [userId, ...participants];
            io.emit('groupCreated', {
                group: populatedGroup,
                participantIds
            });
        } catch (socketError) {
            console.error('Socket emission error:', socketError);
        }

        res.status(201).json({
            success: true,
            message: "Group created successfully",
            group: populatedGroup
        });

    } catch (error) {
        console.error("Create group error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.id;

        const groups = await Conversation.find({
            participants: { $in: [userId] },
            isGroupChat: true
        })
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'senderId',
                    select: 'id username profilePicture'
                }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            groups
        });

    } catch (error) {
        console.error("Get user groups error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Add member to group
export const addMemberToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId: newMemberId } = req.body;
        const currentUserId = req.id;

        const group = await Conversation.findById(groupId);

        if (!group || !group.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user has permission to add members
        const isOwner = group.groupOwner.toString() === currentUserId;
        const isAdmin = group.groupAdmin.some(adminId => adminId.toString() === currentUserId);
        const canAddMembers = isOwner || isAdmin || group.groupSettings?.allowMemberInvites;

        if (!canAddMembers) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to add members"
            });
        }

        // Check if user is already a member
        const isAlreadyMember = group.participants.some(pId => pId.toString() === newMemberId);
        if (isAlreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a member"
            });
        }

        // Add member
        group.participants.push(newMemberId);
        await group.save();

        // Create system message
        const systemMessage = await Message.create({
            message: `User added to the group`,
            senderId: currentUserId,
            conversationId: groupId,
            messageType: 'text', // Using text for system messages if 'system' type not in enum
            isAI: false
        });

        // Update last message
        group.lastMessage = systemMessage._id;
        group.messages.push(systemMessage._id);
        await group.save();

        // Get updated group with all relations
        const updatedGroup = await Conversation.findById(groupId)
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture');

        // Emit socket event
        try {
            const io = getSocketInstance();
            const participantIds = updatedGroup.participants.map(p => p._id.toString());
            io.emit('memberAdded', {
                group: updatedGroup,
                newMemberId,
                participantIds
            });
        } catch (socketError) {
            console.error('Socket emission error:', socketError);
        }

        res.status(200).json({
            success: true,
            message: "Member added successfully",
            group: updatedGroup
        });

    } catch (error) {
        console.error("Add member error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Remove member from group
export const removeMemberFromGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId: memberToRemove } = req.body;
        const currentUserId = req.id;

        const group = await Conversation.findById(groupId);
        if (!group || !group.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check permissions
        const isOwner = group.groupOwner.toString() === currentUserId;
        const isAdmin = group.groupAdmin.some(adminId => adminId.toString() === currentUserId);
        const isSelf = currentUserId === memberToRemove;

        if (!isOwner && !isAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to remove this member"
            });
        }

        // Can't remove owner
        if (group.groupOwner.toString() === memberToRemove && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "Cannot remove group owner"
            });
        }

        // Remove member
        group.participants = group.participants.filter(pId => pId.toString() !== memberToRemove);
        group.groupAdmin = group.groupAdmin.filter(aId => aId.toString() !== memberToRemove);

        // Create system message
        const systemMessage = await Message.create({
            message: isSelf ? `User left the group` : `User was removed from the group`,
            senderId: currentUserId,
            conversationId: groupId,
            messageType: 'text'
        });

        group.lastMessage = systemMessage._id;
        group.messages.push(systemMessage._id);
        await group.save();

        const populatedGroup = await Conversation.findById(groupId)
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture');

        res.status(200).json({
            success: true,
            message: isSelf ? "Left group successfully" : "Member removed successfully",
            group: populatedGroup
        });

    } catch (error) {
        console.error("Remove member error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update group info
export const updateGroupInfo = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, settings } = req.body;
        const currentUserId = req.id;

        const group = await Conversation.findById(groupId);
        if (!group || !group.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check permissions
        const isOwner = group.groupOwner.toString() === currentUserId;
        const isAdmin = group.groupAdmin.some(adminId => adminId.toString() === currentUserId);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update group info"
            });
        }

        // Update group info
        if (name) group.groupName = name;
        if (description !== undefined) group.groupDescription = description;
        if (settings) {
            group.groupSettings = { ...group.groupSettings, ...settings };
        }

        await group.save();

        const populatedGroup = await Conversation.findById(groupId)
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture');

        res.status(200).json({
            success: true,
            message: "Group updated successfully",
            group: populatedGroup
        });

    } catch (error) {
        console.error("Update group error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Delete group
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const currentUserId = req.id;

        const group = await Conversation.findById(groupId);

        if (!group || !group.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Only owner can delete group
        if (group.groupOwner.toString() !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: "Only group owner can delete the group"
            });
        }

        const participantIds = group.participants.map(p => p.toString());

        // Delete the group
        await Conversation.deleteOne({ _id: groupId });
        // Cascade delete messages
        await Message.deleteMany({ conversationId: groupId });

        // Emit socket event
        try {
            const io = getSocketInstance();
            io.emit('groupDeleted', {
                groupId,
                participantIds
            });
        } catch (socketError) {
            console.error('Socket emission error:', socketError);
        }

        res.status(200).json({
            success: true,
            message: "Group deleted successfully"
        });

    } catch (error) {
        console.error("Delete group error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Make user admin
export const makeAdmin = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId: newAdminId } = req.body;
        const currentUserId = req.id;

        const group = await Conversation.findById(groupId);
        if (!group || !group.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Only owner can make admins
        if (group.groupOwner.toString() !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: "Only group owner can make admins"
            });
        }

        // Check if user is a member
        const isMember = group.participants.some(pId => pId.toString() === newAdminId);
        if (!isMember) {
            return res.status(400).json({
                success: false,
                message: "User is not a member of this group"
            });
        }

        // Add to admin list if not already admin
        if (!group.groupAdmin.some(aId => aId.toString() === newAdminId)) {
            group.groupAdmin.push(newAdminId);
            await group.save();
        }

        const populatedGroup = await Conversation.findById(groupId)
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture');

        res.status(200).json({
            success: true,
            message: "User promoted to admin",
            group: populatedGroup
        });

    } catch (error) {
        console.error("Make admin error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Remove admin
export const removeAdmin = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId: adminToRemove } = req.body;
        const currentUserId = req.id;

        const group = await Conversation.findById(groupId);
        if (!group || !group.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Only owner can remove admins
        if (group.groupOwner.toString() !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: "Only group owner can remove admins"
            });
        }

        // Can't remove owner from admin
        if (group.groupOwner.toString() === adminToRemove) {
            return res.status(400).json({
                success: false,
                message: "Cannot remove owner from admin role"
            });
        }

        // Remove from admin list
        group.groupAdmin = group.groupAdmin.filter(aId => aId.toString() !== adminToRemove);
        await group.save();

        const populatedGroup = await Conversation.findById(groupId)
            .populate('participants', 'id username profilePicture')
            .populate('groupOwner', 'id username profilePicture')
            .populate('groupAdmin', 'id username profilePicture');

        res.status(200).json({
            success: true,
            message: "Admin role removed",
            group: populatedGroup
        });

    } catch (error) {
        console.error("Remove admin error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
