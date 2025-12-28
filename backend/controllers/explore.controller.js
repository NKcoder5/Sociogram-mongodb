import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Follow } from "../models/follow.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

export const getExplorePosts = async (req, res) => {
  try {
    const userId = req.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get followed user IDs
    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);

    // Add current user to exclude their own posts
    followingIds.push(userId);

    // Get posts from users not followed by current user
    const posts = await Post.find({
      author: { $nin: followingIds }
    })
      .populate('author', 'id username profilePicture')
      .sort({ createdAt: -1 }) // Simple sort for now, can be enhanced with engagement
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Add interaction status and counts
    const postsWithStatus = await Promise.all(posts.map(async (post) => {
      const isLiked = await Like.exists({ postId: post._id, userId });
      const likes = await Like.countDocuments({ postId: post._id });
      const comments = await Comment.countDocuments({ postId: post._id });

      return {
        ...post.toObject(),
        isLiked: !!isLiked,
        likes,
        comments,
        engagementScore: likes * 2 + comments * 3
      };
    }));

    return res.status(200).json({
      posts: postsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching explore posts:', error);
    return res.status(500).json({
      message: 'Failed to fetch explore posts',
      success: false
    });
  }
};

export const getExploreReels = async (req, res) => {
  try {
    const userId = req.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get followed user IDs to exclude
    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    // Get reels (posts with video content or specific hashtags)
    const reels = await Post.find({
      author: { $nin: followingIds },
      $or: [
        { image: { $regex: /\.(mp4|mov|avi)$/i } },
        { caption: { $regex: /#(reel|video)/i } }
      ]
    })
      .populate('author', 'id username profilePicture')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const reelsWithStatus = await Promise.all(reels.map(async (reel) => {
      const likes = await Like.countDocuments({ postId: reel._id });
      const comments = await Comment.countDocuments({ postId: reel._id });
      return {
        ...reel.toObject(),
        likes,
        comments
      };
    }));

    return res.status(200).json({
      reels: reelsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: reels.length === parseInt(limit)
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching explore reels:', error);
    return res.status(500).json({
      message: 'Failed to fetch explore reels',
      success: false
    });
  }
};

export const getTrendingHashtags = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get hashtags from recent posts
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.find({
      createdAt: { $gte: oneWeekAgo }
    }).select('caption');

    const hashtagCounts = {};
    posts.forEach(post => {
      if (post.caption) {
        const hashtags = post.caption.match(/#\w+/g) || [];
        hashtags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
        });
      }
    });

    const trendingHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([tag, count]) => ({
        tag,
        postCount: count,
        trending: count > 5
      }));

    return res.status(200).json({
      hashtags: trendingHashtags,
      success: true
    });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return res.status(500).json({
      message: 'Failed to fetch trending hashtags',
      success: false
    });
  }
};

export const searchPosts = async (req, res) => {
  try {
    const userId = req.id;
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        message: 'Search query is required',
        success: false
      });
    }

    const searchTerm = q.trim();

    // In Mongoose, searching across relationships usually requires $lookup or searching authors separately
    const matchingUsers = await User.find({
      username: { $regex: searchTerm, $options: 'i' }
    }).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    const posts = await Post.find({
      $or: [
        { caption: { $regex: searchTerm, $options: 'i' } },
        { author: { $in: userIds } }
      ]
    })
      .populate('author', 'id username profilePicture')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const postsWithStatus = await Promise.all(posts.map(async (post) => {
      const isLiked = await Like.exists({ postId: post._id, userId });
      const likes = await Like.countDocuments({ postId: post._id });
      const comments = await Comment.countDocuments({ postId: post._id });

      return {
        ...post.toObject(),
        isLiked: !!isLiked,
        likes,
        comments
      };
    }));

    return res.status(200).json({
      posts: postsWithStatus,
      query: searchTerm,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      },
      success: true
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    return res.status(500).json({
      message: 'Failed to search posts',
      success: false
    });
  }
};

export const getExploreUsers = async (req, res) => {
  try {
    const userId = req.id;
    const { limit = 10 } = req.query;

    // Get followed user IDs to exclude
    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    // Get users not followed by current user
    const users = await User.find({
      _id: { $nin: followingIds }
    })
      .select('id username profilePicture bio')
      .limit(parseInt(limit));

    // In Mongoose, we need separate counts or aggregation
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const followerCount = await Follow.countDocuments({ followingId: user._id });
      const postCount = await Post.countDocuments({ author: user._id });

      return {
        ...user.toObject(),
        followerCount,
        postCount,
        isPopular: followerCount > 10
      };
    }));

    // Sort by followerCount manually as Mongoose doesn't easily sort by virtual counts in a simple query
    usersWithStats.sort((a, b) => b.followerCount - a.followerCount);

    return res.status(200).json({
      users: usersWithStats,
      success: true
    });
  } catch (error) {
    console.error('Error fetching explore users:', error);
    return res.status(500).json({
      message: 'Failed to fetch explore users',
      success: false
    });
  }
};
