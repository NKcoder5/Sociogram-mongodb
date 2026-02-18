import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Follow } from "../models/follow.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { createNotification } from "./notification.controller.js";
import { getFirebaseAuth } from "../config/firebase-admin.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        const user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            const field = user.email === email ? "email" : "username";
            return res.status(401).json({
                message: `User with this ${field} already exists.`,
                success: false,
            });
        };

        if (!process.env.SECRET_KEY) {
            console.error("🚨 SECRET_KEY is missing in environment variables!");
            return res.status(500).json({
                message: "Server configuration error: SECRET_KEY missing",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            provider: 'email'
        });

        return res.status(201).json({
            message: `Account created successfully! Welcome to Sociogram, ${newUser.username}. Please sign in to continue.`,
            success: true,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("Register Error Details:", error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
}
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        let user = await User.findOne({ email }).populate('posts').populate('followers').populate('following');

        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        }

        if (!user.password) {
            return res.status(401).json({
                message: "This account was created using social login. Please Sign In with Google/Firebase.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        };

        if (!process.env.SECRET_KEY) {
            console.error("🚨 SECRET_KEY is missing in environment variables!");
            throw new Error("SECRET_KEY is not configured");
        }

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        //populate each post if in the posts array
        const populatedPosts = user.posts || [];

        user = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts
        }

        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user,
            token // Include token in response for frontend
        });
    } catch (error) {
        console.error("Login Error Details:", error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
};
export const logout = async (__, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully!",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
};
export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.id;
        if (!userId) {
            return res.status(400).json({
                message: 'User ID is required',
                success: false
            });
        }

        let user = await User.findById(userId)
            .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
            .populate({ path: 'followers', select: 'id username profilePicture' })
            .populate({ path: 'following', select: 'id username profilePicture' });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            });
        }

        // Map _id to id to match frontend expectation
        const userJson = user.toObject();
        userJson.id = userJson._id;
        delete userJson.password;

        return res.status(200).json({
            user: userJson,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

export const getProfileByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({
                message: 'Username is required',
                success: false
            });
        }

        let user = await User.findOne({ username })
            .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
            .populate({ path: 'followers', select: 'id username profilePicture' })
            .populate({ path: 'following', select: 'id username profilePicture' });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            });
        }

        // Map _id to id
        const userJson = user.toObject();
        userJson.id = userJson._id;
        delete userJson.password;

        return res.status(200).json({
            user: userJson,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri)
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found!',
                success: false,
            });
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        const updatedUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio
        };

        return res.status(200).json({
            message: 'Profile updated!',
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get mutual connections (users who follow each other)
export const getMutualConnections = async (req, res) => {
    try {
        const userId = req.id;

        console.log('🤝 Getting mutual connections for user:', userId);

        // Get users that the current user follows
        const follows = await Follow.find({ followerId: userId }).populate('followingId', 'username profilePicture bio');

        const mutualConnections = [];

        for (const follow of follows) {
            const followsBack = await Follow.findOne({
                followerId: follow.followingId._id,
                followingId: userId
            });

            if (followsBack) {
                const connection = follow.followingId.toObject();
                connection.id = connection._id;
                mutualConnections.push(connection);
            }
        }

        console.log('🤝 Found mutual connections:', mutualConnections.length);

        return res.status(200).json({
            success: true,
            mutualConnections
        });

    } catch (error) {
        console.error('❌ Error getting mutual connections:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.id;
        const suggestedUsers = await User.find({ _id: { $ne: userId } })
            .select('id username profilePicture bio')
            .limit(5);

        if (!suggestedUsers) {
            return res.status(400).json({
                message: 'Currently do not have any users...',
            });
        };

        const users = suggestedUsers.map(u => {
            const user = u.toObject();
            user.id = user._id;
            return user;
        });

        return res.status(200).json({
            success: true,
            users: users
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};
export const followOrUnfollow = async (req, res) => {
    try {
        const followerofmine = req.id;
        const whomifollow = req.params.id;

        console.log('Follow request:', { followerofmine, whomifollow });

        if (!followerofmine || !whomifollow) {
            return res.status(400).json({
                message: 'Missing user IDs',
                success: false
            });
        }

        if (followerofmine === whomifollow) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }
        const [user, targetUser] = await Promise.all([
            User.findById(followerofmine),
            User.findById(whomifollow)
        ]);
        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false,
            });
        }
        const existingFollow = await Follow.findOne({
            followerId: followerofmine,
            followingId: whomifollow
        });

        if (existingFollow) {
            await Follow.deleteOne({
                followerId: followerofmine,
                followingId: whomifollow
            });

            // Update User model fields
            await User.findByIdAndUpdate(followerofmine, { $pull: { following: whomifollow } });
            await User.findByIdAndUpdate(whomifollow, { $pull: { followers: followerofmine } });

            // Get updated counts
            const [followerCount, followingCount] = await Promise.all([
                Follow.countDocuments({ followingId: whomifollow }),
                Follow.countDocuments({ followerId: followerofmine })
            ]);

            return res.status(200).json({
                message: 'Unfollowed successfully',
                success: true,
                action: 'unfollowed',
                targetUserFollowerCount: followerCount,
                currentUserFollowingCount: followingCount
            });
        } else {
            await Follow.create({
                followerId: followerofmine,
                followingId: whomifollow
            });

            // Update User model fields
            await User.findByIdAndUpdate(followerofmine, { $addToSet: { following: whomifollow } });
            await User.findByIdAndUpdate(whomifollow, { $addToSet: { followers: followerofmine } });

            // Get updated counts
            const [followerCount, followingCount] = await Promise.all([
                Follow.countDocuments({ followingId: whomifollow }),
                Follow.countDocuments({ followerId: followerofmine })
            ]);

            // Check if this creates a mutual follow
            const mutualFollow = await Follow.findOne({
                followerId: whomifollow,
                followingId: followerofmine
            });

            // Create notification for the followed user
            await createNotification(
                followerofmine,
                whomifollow,
                'follow',
                `${user.username} started following you`
            );

            return res.status(200).json({
                message: 'Followed successfully',
                success: true,
                action: 'followed',
                targetUserFollowerCount: followerCount,
                currentUserFollowingCount: followingCount,
                isMutualFollow: !!mutualFollow
            });
        }
    } catch (error) {
        console.log('Follow/Unfollow error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export const getFollowers = async (req, res) => {
    try {
        const userId = req.params.id;

        const follows = await Follow.find({ followingId: userId }).populate('followerId', 'username profilePicture bio');

        const followers = follows.map(f => {
            const follower = f.followerId.toObject();
            follower.id = follower._id;
            return follower;
        });

        return res.status(200).json({
            success: true,
            followers: followers
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

export const getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;

        const follows = await Follow.find({ followerId: userId }).populate('followingId', 'username profilePicture bio');

        const following = follows.map(f => {
            const follow = f.followingId.toObject();
            follow.id = follow._id;
            return follow;
        });

        return res.status(200).json({
            success: true,
            following: following
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        console.log('Upload profile picture request received');
        console.log('User ID:', req.id);

        const userId = req.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                message: 'No file uploaded',
                success: false
            });
        }

        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri, {
            folder: 'profile_pictures',
            transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' }
            ]
        });
        const profilePictureUrl = cloudResponse.secure_url;

        const user = await User.findById(userId);
        user.profilePicture = profilePictureUrl;
        await user.save();

        const updatedUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio
        };

        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.log('Upload profile picture error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Firebase Authentication Handler
export const firebaseAuth = async (req, res) => {
    try {
        console.log('🔥 Firebase auth request received');
        const { idToken, user: firebaseUser } = req.body;

        if (!idToken || !firebaseUser) {
            return res.status(400).json({
                message: "Firebase ID token and user data are required",
                success: false
            });
        }

        // Verify Firebase ID token
        try {
            const auth = getFirebaseAuth();
            await auth.verifyIdToken(idToken);
        } catch (error) {
            return res.status(401).json({
                message: "Invalid Firebase token",
                success: false
            });
        }

        // Check if user exists in database
        let user = await User.findOne({ email: firebaseUser.email }).populate('posts followers following');

        // If user doesn't exist, create new user
        if (!user) {
            let username = firebaseUser.displayName || firebaseUser.email.split('@')[0];

            // Ensure username is unique
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                username = `${username}_${Date.now()}`;
            }

            user = await User.create({
                username,
                email: firebaseUser.email,
                profilePicture: firebaseUser.photoURL || '',
                bio: '',
                firebaseUid: firebaseUser.uid,
                provider: firebaseUser.provider || 'google'
            });
        } else {
            // Update Firebase UID if not set
            if (!user.firebaseUid) {
                user.firebaseUid = firebaseUser.uid;
                await user.save();
            }
        }

        // Generate JWT token for your backend
        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // Format user data
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts || []
        };

        return res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 1 * 24 * 60 * 60 * 1000
        }).json({
            message: `Welcome ${user.username}`,
            success: true,
            user: userData,
            token
        });

    } catch (error) {
        console.error('Firebase auth error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};