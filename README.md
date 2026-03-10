# 🌐 Sociogram - The Next-Gen Social OS
### A High-Performance Social Network with Integrated Generative AI

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Sociogram** is a premier social media platform that redefines digital interaction by blending traditional networking with cutting-edge AI integration. Designed for high engagement and real-time connectivity, Sociogram provides a seamless ecosystem for creators and communities, featuring a persistent AI assistant that enhances every aspect of the user journey.

---

## 🚀 Key Modules & Capabilities

### 🤖 Generative AI Ecosystem (NVIDIA Powered)
*   **Floating AI Assistant**: A context-aware, persistent chat bubble that provides real-time help, navigation tips, and platform insights.
*   **In-Message Smart Helper**: AI-driven tools to rewrite, improve, or translate message drafts, along with intelligent reply suggestions.
*   **Contextual Intelligence**: The AI understands your current screen—be it Reels, Feed, or Profile—and offers relevant assistance.

### 💬 Real-Time Messaging Hub
*   **High-Fidelity Chat**: Instant 1-to-1 and Group messaging powered by **Socket.io** with read receipts and typing indicators.
*   **Rich Media Sharing**: Seamlessly share high-resolution images, videos, and documents within conversations.
*   **Advanced Chat Features**: Message reactions (emojis), replies, starring messages, and robust moderation tools.

### 🎥 Short-Form Media (Reels & Stories)
*   **Vertical Video Engine**: An immersive, full-screen Reels experience with swipe gestures and keyboard navigation.
*   **Ephemeral Stories**: 24-hour disappearing content with interactive viewers, progress bars, and viewed-state tracking.
*   **Real-time Engagement**: Instant like/comment interactions with live notification fan-out.

### 📈 Pro Activity & Discovery Dashboard
*   **Advanced Analytics**: Track your social reach with detailed metrics on followers, post performance, and engagement rates.
*   **Smart Discovery Engine**: AI-curated "Suggested Users" and trending hashtag categories based on global platform activity.
*   **Engagement Tracking**: Real-time notification system for likes, follows, and comments.

---

## 🎨 Premium Design Aesthetics
*   **Glassmorphic Design**: A modern, translucent UI aesthetic with vibrant gradient accents and balanced whitespace.
*   **Micro-Animation Layer**: Subtle hover effects, smooth transitions, and custom spin animations that make the platform feel alive.
*   **Custom UX Details**: Premium elements like a unified "Instagram-inspired" button system and specialized slim scrollbars.
*   **Responsive Precision**: Optimized for every device, from mobile-first layouts to high-resolution desktop environments.

---

## 🛠️ Technology Stack
*   **Frontend**: React 19 (Vite, Hooks, Tailwind CSS)
*   **Backend**: Node.js & Express.js
*   **Database**: MongoDB with Mongoose (Offline-Ready Schema)
*   **Real-time**: Socket.io (WebSocket Engine)
*   **AI Engine**: NVIDIA API Integration
*   **Storage/Media**: Cloudinary & Multer with Sharp for Image Processing
*   **State**: Context API & Persistence Layer

---

## ⚡ Performance Optimization
*   **Socket-Based Updates**: Real-time data synchronization for likes and messages without page reloads.
*   **Optimized Image Delivery**: Automatic resizing and compression using Sharp to ensure ultra-fast content loading.
*   **Virtualized Content**: Efficient rendering of large feeds and story rows to maintain 60fps scrolling.

---

## 📦 Installation & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NKcoder5/Sociogram-mongodb.git
   cd Sociogram-mongodb
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create .env with DATABASE_URL (MongoDB), JWT_SECRET, and NVIDIA_API_KEY
   npm start
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📄 License
Developed for **Sociogram Network**. All rights reserved.

---
*Created with ❤️ for the Next Generation of Social Connection.*
