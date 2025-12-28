import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Notification } from '../models/notification.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const notificationTypes = ['like', 'comment', 'follow'];
const notificationMessages = {
  like: ['liked your post', 'loved your photo', 'liked your content'],
  comment: ['commented on your post', 'left a comment on your photo', 'replied to your post'],
  follow: ['started following you', 'is now following you', 'followed you']
};

async function seedNotifications() {
  try {
    console.log('🌱 Starting notifications seeding (Mongoose)...');

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.DATABASE_URL);
    }

    const users = await User.find();
    const posts = await Post.find();

    if (users.length < 2) {
      console.log('Not enough users to create notifications');
      return;
    }

    let notificationsCreated = 0;

    for (const receiver of users.slice(0, 10)) {
      const numNotifications = Math.floor(Math.random() * 8) + 3;

      for (let i = 0; i < numNotifications; i++) {
        const availableSenders = users.filter(u => u._id.toString() !== receiver._id.toString());
        const sender = availableSenders[Math.floor(Math.random() * availableSenders.length)];

        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const messages = notificationMessages[type];
        const message = `${sender.username} ${messages[Math.floor(Math.random() * messages.length)]}`;

        let relatedPost = null;
        if ((type === 'like' || type === 'comment') && posts.length > 0) {
          relatedPost = posts[Math.floor(Math.random() * posts.length)]._id;
        }

        try {
          await Notification.create({
            senderId: sender._id,
            receiverId: receiver._id,
            type,
            message,
            post: relatedPost,
            isRead: Math.random() > 0.6
          });
          notificationsCreated++;
        } catch (error) {
          console.error('Notification creation error:', error);
        }
      }
    }

    console.log(`✅ Created ${notificationsCreated} notifications for users`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

seedNotifications()
  .then(() => {
    console.log('✅ Notifications seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
