import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Story } from "../models/story.model.js";
import { StoryView } from "../models/storyView.model.js";
import { User } from "../models/user.model.js";
import { Follow } from "../models/follow.model.js";

// Create a new story
export const createStory = async (req, res) => {
  try {
    const image = req.file;
    const authorId = req.id;

    if (!image) {
      return res.status(400).json({
        message: 'Image required',
        success: false
      });
    }

    // Image optimization
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 1080, height: 1920, fit: "inside" })
      .toFormat("webp")
      .toBuffer();

    // Convert buffer to data URI
    const fileUri = `data:image/webp;base64,${optimizedImageBuffer.toString("base64")}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri, {
      folder: 'stories'
    });

    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      author: authorId,
      image: cloudResponse.secure_url,
      expiresAt
    });

    const populatedStory = await Story.findById(story._id)
      .populate('author', 'username profilePicture');

    return res.status(201).json({
      message: 'New story added',
      story: populatedStory,
      success: true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};

// Get all stories from followed users
export const getStories = async (req, res) => {
  try {
    const userId = req.id;

    // Get followed user IDs
    const following = await Follow.find({
      followerId: userId
    }).select('followingId');

    const followingIds = following.map(f => f.followingId);
    // Include self
    followingIds.push(userId);

    const now = new Date();
    const stories = await Story.find({
      author: { $in: followingIds },
      expiresAt: { $gt: now }
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const authorId = story.author._id.toString();
      if (!acc[authorId]) {
        acc[authorId] = {
          user: story.author,
          stories: []
        };
      }
      acc[authorId].stories.push(story);
      return acc;
    }, {});

    return res.status(200).json({
      stories: Object.values(groupedStories),
      success: true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};

// Get stories of a specific user
export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    const stories = await Story.find({
      author: userId,
      expiresAt: { $gt: now }
    })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      stories,
      success: true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};

// Mark story as viewed
export const markStoryAsViewed = async (req, res) => {
  try {
    const userId = req.id;
    const { storyId } = req.params;

    // Check if already viewed
    const existingView = await StoryView.findOne({
      story: storyId,
      viewer: userId
    });

    if (!existingView) {
      await StoryView.create({
        story: storyId,
        viewer: userId
      });
    }

    return res.status(200).json({
      message: 'Story marked as viewed',
      success: true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};

// Delete story
export const deleteStory = async (req, res) => {
  try {
    const userId = req.id;
    const { storyId } = req.params;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        success: false
      });
    }

    // Only author can delete
    if (story.author.toString() !== userId) {
      return res.status(403).json({
        message: 'Unauthorized',
        success: false
      });
    }

    // Delete views and story
    await StoryView.deleteMany({ story: storyId });
    await Story.findByIdAndDelete(storyId);

    return res.status(200).json({
      message: 'Story deleted',
      success: true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};
