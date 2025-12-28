import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { createNotification } from "./notification.controller.js";

// Test endpoint to debug post creation issues
export const testPostCreation = async (req, res) => {
    try {
        console.log('🧪 Testing post creation endpoint...');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('User ID:', req.id);

        return res.status(200).json({
            message: 'Test endpoint working',
            data: {
                hasAuth: !!req.id,
                hasFile: !!req.file,
                hasBody: !!req.body,
                bodyKeys: Object.keys(req.body || {}),
                fileInfo: req.file ? {
                    fieldname: req.file.fieldname,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                } : null
            },
            success: true
        });
    } catch (error) {
        console.error('❌ Test endpoint error:', error);
        return res.status(500).json({
            message: 'Test endpoint failed',
            error: error.message,
            success: false
        });
    }
};
export const addNewPost = async (req, res) => {
    try {
        console.log('📝 Creating new post...');
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        // Validate authentication
        if (!authorId) {
            return res.status(401).json({
                message: 'User authentication required',
                success: false
            });
        }

        // Validate image
        if (!image) {
            return res.status(400).json({
                message: 'Image is required to create a post',
                success: false
            });
        }

        // Process image with Sharp
        let optimizedImageBuffer;
        try {
            optimizedImageBuffer = await sharp(image.buffer)
                .resize({ width: 800, height: 800, fit: 'inside' })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();
        } catch (sharpError) {
            return res.status(400).json({
                message: 'Invalid image format.',
                success: false
            });
        }

        // Upload to Cloudinary
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const imageUrl = cloudResponse.secure_url;

        // Create post in database
        const post = await Post.create({
            caption: caption || '',
            image: imageUrl,
            author: authorId
        });

        // Add post to user's posts array
        await User.findByIdAndUpdate(authorId, { $push: { posts: post._id } });

        const populatedPost = await Post.findById(post._id).populate('author', 'id username profilePicture');

        return res.status(201).json({
            message: 'New post added successfully',
            post: populatedPost,
            success: true
        });

    } catch (error) {
        console.error('❌ Post creation error:', error);
        return res.status(500).json({
            message: 'Internal server error while creating post',
            success: false
        });
    }
};
export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('author', 'id username profilePicture')
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'id username profilePicture'
                }
            })
            .populate('likes')
            .populate('reactions');

        return res.status(200).json({
            posts,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}
export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const posts = await Post.find({ author: authorId })
            .sort({ createdAt: -1 })
            .populate('author', 'id username profilePicture')
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'id username profilePicture'
                }
            })
            .populate('likes')
            .populate('reactions');

        return res.status(200).json({
            posts,
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

export const getUserPostById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .populate('author', 'id username profilePicture')
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'id username profilePicture'
                }
            })
            .populate('likes')
            .populate('reactions');

        return res.status(200).json({
            posts,
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

export const getUserPostByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        const posts = await Post.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate('author', 'id username profilePicture')
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'id username profilePicture'
                }
            })
            .populate('likes')
            .populate('reactions');

        return res.status(200).json({
            posts,
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

export const likePost = async (req, res) => {
    try {
        const likingUser = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post)
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });

        // Check if user already liked the post
        const existingLike = await Like.findOne({
            postId: postId,
            userId: likingUser
        });

        if (existingLike) {
            // Unlike the post
            await Like.deleteOne({
                postId: postId,
                userId: likingUser
            });

            // Remove from post's likes array
            await Post.findByIdAndUpdate(postId, { $pull: { likes: likingUser } });

            return res.status(200).json({
                message: 'Post unliked',
                success: true,
                action: 'unliked'
            });
        } else {
            // Like the post
            await Like.create({ postId, userId: likingUser });

            // Add to post's likes array
            await Post.findByIdAndUpdate(postId, { $addToSet: { likes: likingUser } });

            // Create notification for post author (if not liking own post)
            if (post.author.toString() !== likingUser) {
                const liker = await User.findById(likingUser).select('username');

                await createNotification(
                    likingUser,
                    post.author,
                    'like',
                    `${liker.username} liked your post`,
                    postId
                );
            }

            return res.status(200).json({
                message: 'Post liked',
                success: true,
                action: 'liked'
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}

export const dislikePost = async (req, res) => {
    try {
        const likingUser = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post)
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });

        //dislike logic
        await Like.deleteMany({ postId, userId: likingUser });
        await Post.findByIdAndUpdate(postId, { $pull: { likes: likingUser } });

        return res.status(200).json({
            message: 'Post disliked',
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

export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentingUserId = req.id;
        const { text } = req.body;

        const post = await Post.findById(postId);
        if (!text) {
            return res.status(400).json({
                message: 'text is required',
                success: false
            });
        }

        const comment = await Comment.create({
            text,
            author: commentingUserId,
            postId: postId
        });

        // Add comment to post's comments array
        await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

        const populatedComment = await Comment.findById(comment._id).populate('author', 'id username profilePicture');

        // Create notification for post author (if not commenting on own post)
        if (post.author.toString() !== commentingUserId) {
            await createNotification(
                commentingUserId,
                post.author,
                'comment',
                `${populatedComment.author.username} commented on your post`,
                postId
            );
        }

        return res.status(201).json({
            message: 'Comment added!',
            comment: populatedComment,
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

export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ postId: postId })
            .sort({ createdAt: -1 })
            .populate('author', 'id username profilePicture');

        return res.status(200).json({
            success: true,
            comments
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}
export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        if (post.author.toString() !== authorId) {
            return res.status(403).json({
                message: 'Unauthorized - You can only delete your own posts',
                success: false
            });
        }

        // Delete post
        await Post.findByIdAndDelete(postId);

        // Remove post from user's posts array
        await User.findByIdAndUpdate(authorId, { $pull: { posts: postId } });

        // Delete comments of this post
        await Comment.deleteMany({ postId: postId });

        // Delete likes of this post
        await Like.deleteMany({ postId: postId });

        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.log('Delete post error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
}

export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            });
        }

        const user = await User.findById(authorId);

        if (user.bookmarks.includes(post._id)) {
            await User.findByIdAndUpdate(authorId, { $pull: { bookmarks: post._id } });
            return res.status(200).json({
                type: 'unsaved',
                message: 'Post removed from bookmark',
                success: true
            });
        } else {
            await User.findByIdAndUpdate(authorId, { $addToSet: { bookmarks: post._id } });
            return res.status(200).json({
                type: 'saved',
                message: 'Post bookmarked',
                success: true
            });
        }
    } catch (error) {
        console.log(error);
    }
}