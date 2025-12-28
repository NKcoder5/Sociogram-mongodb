import { Story } from '../models/story.model.js';
import { StoryView } from '../models/storyView.model.js';

export const cleanupExpiredStories = async () => {
  try {
    console.log('🧹 Starting story cleanup...');

    const now = new Date();

    // Find expired stories
    const expiredStories = await Story.find({
      expiresAt: {
        $lt: now
      }
    }).populate('author', 'username');

    if (expiredStories.length === 0) {
      console.log('✅ No expired stories to clean up');
      return { cleaned: 0 };
    }

    console.log(`🗑️ Found ${expiredStories.length} expired stories to delete`);

    const expiredIds = expiredStories.map(s => s._id);

    // Delete expired stories and their views
    await StoryView.deleteMany({
      storyId: { $in: expiredIds }
    });
    const deleteResult = await Story.deleteMany({
      _id: { $in: expiredIds }
    });

    console.log(`✅ Cleaned up ${deleteResult.deletedCount} expired stories`);

    // Log which stories were deleted
    expiredStories.forEach(story => {
      console.log(`   - Deleted story by ${story.author?.username || 'Unknown'} (expired: ${story.expiresAt})`);
    });

    return { cleaned: deleteResult.deletedCount };
  } catch (error) {
    console.error('❌ Error cleaning up expired stories:', error);
    throw error;
  }
};

// Run cleanup every hour
export const startStoryCleanupScheduler = () => {
  console.log('⏰ Starting story cleanup scheduler (runs every hour)');

  // Run immediately on startup
  cleanupExpiredStories().catch(console.error);

  // Then run every hour
  setInterval(() => {
    cleanupExpiredStories().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour in milliseconds
};
