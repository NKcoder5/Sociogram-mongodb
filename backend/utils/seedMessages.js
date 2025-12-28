import { User } from '../models/user.model.js';
import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const sampleMessages = [
  "Hey! How are you doing?",
  "I'm doing great, thanks for asking!",
  "That's awesome! What have you been up to lately?",
  "Just working on some new projects. How about you?",
  "Same here! We should catch up soon 😊",
  "Absolutely! Let's plan something",
  "Did you see the latest post I shared?",
  "Yes! It was amazing 🔥",
  "Thanks! I really appreciate the support",
  "Always happy to support great content!",
  "Hope you're having a wonderful day!",
  "You too! Thanks for the kind words",
  "Looking forward to our next conversation",
  "Me too! Take care 👋"
];

async function seedMessages() {
  try {
    console.log('🌱 Starting messages seeding (Mongoose)...');

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.DATABASE_URL);
    }

    const users = await User.find();

    if (users.length < 2) {
      console.log('Not enough users to create conversations');
      return;
    }

    let conversationsCreated = 0;
    let messagesCreated = 0;

    const conversationPairs = [
      ['john_doe', 'jane_smith'],
      ['john_doe', 'alex_wilson'],
      ['jane_smith', 'sarah_jones'],
      ['alex_wilson', 'mike_brown'],
      ['sarah_jones', 'emma_davis'],
      ['mike_brown', 'david_miller'],
      ['emma_davis', 'lisa_garcia'],
      ['david_miller', 'carlos_rodriguez']
    ];

    for (const [user1Username, user2Username] of conversationPairs) {
      const user1 = users.find(u => u.username === user1Username);
      const user2 = users.find(u => u.username === user2Username);

      if (!user1 || !user2) continue;

      try {
        let conversation = await Conversation.findOne({
          participants: { $all: [user1._id, user2._id] },
          isGroupChat: false
        });

        if (!conversation) {
          conversation = await Conversation.create({
            isGroupChat: false,
            participants: [user1._id, user2._id]
          });
          conversationsCreated++;
          console.log(`💬 Created conversation between ${user1.username} and ${user2.username}`);
        }

        const numMessages = Math.floor(Math.random() * 5) + 3;
        const shuffledMessages = [...sampleMessages].sort(() => 0.5 - Math.random()).slice(0, numMessages);

        for (let i = 0; i < shuffledMessages.length; i++) {
          const sender = i % 2 === 0 ? user1 : user2;

          const msg = await Message.create({
            content: shuffledMessages[i],
            sender: sender._id,
            conversationId: conversation._id,
            createdAt: new Date(Date.now() - (shuffledMessages.length - i) * 60000)
          });

          await Conversation.findByIdAndUpdate(conversation._id, {
            $push: { messages: msg._id },
            lastMessage: msg._id
          });
          messagesCreated++;
        }

      } catch (error) {
        console.error(`Error creating conversation between ${user1Username} and ${user2Username}:`, error);
      }
    }

    console.log(`✅ Created ${conversationsCreated} conversations with ${messagesCreated} messages`);

  } catch (error) {
    console.error('❌ Error seeding messages:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

seedMessages()
  .then(() => {
    console.log('✅ Messages seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
