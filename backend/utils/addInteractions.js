import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Like } from '../models/like.model.js';
import { Comment } from '../models/comment.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function addSampleInteractions() {
  try {
    console.log('🚀 Adding sample interactions to posts (Mongoose)...');

    // Connect if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.DATABASE_URL);
    }

    // Get all users and posts
    const users = await User.find().select('_id username');
    const posts = await Post.find().limit(20);

    console.log(`👥 Found ${users.length} users and ${posts.length} posts`);

    let likesAdded = 0;
    let commentsAdded = 0;

    // Add likes to posts
    for (const post of posts) {
      const otherUsers = users.filter(user => user._id.toString() !== post.author.toString());
      const numLikes = Math.floor(Math.random() * 4) + 2;
      const likingUsers = otherUsers
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(numLikes, otherUsers.length));

      for (const user of likingUsers) {
        try {
          const exists = await Like.findOne({ userId: user._id, postId: post._id });
          if (!exists) {
            await Like.create({
              userId: user._id,
              postId: post._id
            });
            likesAdded++;
          }
        } catch (error) {
        }
      }
    }

    const commentTemplates = [
      "Amazing post! 🔥", "Love this! ❤️", "Great content! 👏", "This is awesome! 🚀",
      "Beautiful! 😍", "So inspiring! ✨", "Perfect! 💯", "Incredible work! 🎨",
      "This made my day! 😊", "Absolutely stunning! 🌟"
    ];

    for (let i = 0; i < Math.min(10, posts.length); i++) {
      const post = posts[i];
      const otherUsers = users.filter(user => user._id.toString() !== post.author.toString());
      const numComments = Math.floor(Math.random() * 3) + 1;
      const commentingUsers = otherUsers
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(numComments, otherUsers.length));

      for (const user of commentingUsers) {
        const randomComment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
        try {
          await Comment.create({
            text: randomComment,
            author: user._id,
            postId: post._id
          });
          commentsAdded++;
        } catch (error) {
          console.error('Error adding comment:', error);
        }
      }
    }

    console.log(`✅ Added ${likesAdded} likes and ${commentsAdded} comments`);
    console.log('🎉 Sample interactions added successfully!');

  } catch (error) {
    console.error('❌ Error adding interactions:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addSampleInteractions();
