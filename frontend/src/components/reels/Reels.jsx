import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { postAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CommentsModal from '../modals/CommentsModal';
import ShareModal from '../modals/ShareModal';

const Reels = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    // Initialize reels data from sources
    const initialReels = [
      {
        id: `reel-${Date.now()}-1`,
        user: { username: 'nature_explorer', profilePicture: null },
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        caption: 'Beautiful morning vibes! ✨ #nature #vibes',
        likes: 1234,
        comments: 89,
        isLiked: false,
        isBookmarked: false,
        music: 'Morning Melodies'
      },
      {
        id: `reel-${Date.now()}-2`,
        user: { username: 'chef_special', profilePicture: null },
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        caption: 'Secret recipe reveals! 🍳 #cooking #recipe',
        likes: 2156,
        comments: 145,
        isLiked: true,
        isBookmarked: false,
        music: 'Kitchen Jazz'
      }
    ];
    setReels(initialReels);
    setLoading(false);
  }, []);

  // Enhanced video management
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted;
      if (isPlaying) {
        currentVideo.play().catch(console.error);
      } else {
        currentVideo.pause();
      }
    }

    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying, isMuted]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleScroll('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleScroll('down');
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          if (reels[currentIndex]) {
            handleLike(reels[currentIndex].id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, reels]);

  // Touch gestures
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;

    const distance = touchStartY.current - touchEndY.current;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;

    if (isUpSwipe) {
      handleScroll('down');
    } else if (isDownSwipe) {
      handleScroll('up');
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Video progress tracking
  const handleVideoProgress = (index) => {
    const video = videoRefs.current[index];
    if (video && index === currentIndex) {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLike = (reelId) => {
    setReels(reels.map(reel =>
      reel.id === reelId
        ? {
          ...reel,
          isLiked: !reel.isLiked,
          likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
        }
        : reel
    ));
  };

  const handleBookmark = (reelId) => {
    setReels(reels.map(reel =>
      reel.id === reelId
        ? { ...reel, isBookmarked: !reel.isBookmarked }
        : reel
    ));
  };

  const handleFollow = async (userId) => {
    try {
      await authAPI.followUnfollow(userId);
      // Update reel to show followed state
      setReels(reels.map(reel =>
        reel.user._id === userId
          ? { ...reel, user: { ...reel.user, isFollowing: true } }
          : reel
      ));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleComment = (reel) => {
    setSelectedReel(reel);
    setShowComments(true);
  };

  const handleShare = (reel) => {
    setSelectedReel(reel);
    setShowShare(true);
  };

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleScroll = useCallback((direction) => {
    setCurrentIndex(prevIndex => {
      if (direction === 'up' && prevIndex > 0) {
        setProgress(0);
        return prevIndex - 1;
      } else if (direction === 'down' && prevIndex < reels.length - 1) {
        setProgress(0);
        return prevIndex + 1;
      }
      return prevIndex;
    });
  }, [reels.length]);

  const handleVideoClick = (e) => {
    // Don't toggle play/pause if clicking on action buttons
    if (e.target.closest('.action-buttons')) return;
    togglePlayPause();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reel counter */}
      <div className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 rounded-full px-3 py-1">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {reels.length}
        </span>
      </div>

      {/* Control hints */}
      <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-50 rounded-lg p-2">
        <div className="text-white text-xs space-y-1">
          <div>↑↓ Navigate</div>
          <div>Space Play/Pause</div>
          <div>M Mute/Unmute</div>
          <div>L Like</div>
        </div>
      </div>

      {reels.map((reel, index) => (
        <div
          key={reel.id}
          className={`absolute inset-0 transition-transform duration-300 ${index === currentIndex ? 'translate-y-0' :
              index < currentIndex ? '-translate-y-full' : 'translate-y-full'
            }`}
        >
          {/* Video */}
          <video
            ref={el => videoRefs.current[index] = el}
            src={reel.video}
            className="w-full h-full object-cover cursor-pointer"
            loop
            muted={isMuted}
            playsInline
            onClick={handleVideoClick}
            onTimeUpdate={() => handleVideoProgress(index)}
            onLoadedData={() => {
              if (index === currentIndex) {
                videoRefs.current[index]?.play().catch(console.error);
              }
            }}
          />

          {/* Play/Pause overlay */}
          {!isPlaying && index === currentIndex && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <PlayIcon className="w-12 h-12 text-white" />
              </div>
            </div>
          )}

          {/* Overlay Content */}
          <div className="absolute inset-0 flex">
            {/* Left side - user info and caption */}
            <div className="flex-1 flex flex-col justify-end p-4">
              <div className="text-white">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {reel.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold">{reel.user.username}</span>
                  <button
                    onClick={() => handleFollow(reel.user.username)}
                    className="text-white border border-white px-3 py-1 rounded text-sm font-semibold hover:bg-white hover:text-black transition-colors"
                  >
                    Follow
                  </button>
                </div>
                <p className="text-sm mb-2">{reel.caption}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">🎵</span>
                  <span className="text-xs">{reel.music}</span>
                </div>
              </div>
            </div>

            {/* Right side - action buttons */}
            <div className="action-buttons w-16 flex flex-col justify-end items-center pb-20 space-y-6">
              {/* Mute/Unmute button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleMute}
                  className="text-white mb-1 hover:scale-110 transition-all duration-200 bg-black bg-opacity-30 rounded-full p-2"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-6 h-6" />
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Like button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleLike(reel.id)}
                  className="text-white mb-1 hover:scale-110 transition-all duration-200"
                >
                  {reel.isLiked ? (
                    <HeartSolidIcon className="w-8 h-8 text-red-500 animate-pulse" />
                  ) : (
                    <HeartIcon className="w-8 h-8 hover:text-red-400" />
                  )}
                </button>
                <span className="text-white text-xs font-medium">
                  {reel.likes > 999 ? `${(reel.likes / 1000).toFixed(1)}K` : reel.likes}
                </span>
              </div>

              {/* Comment button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComment(reel)}
                  className="text-white mb-1 hover:scale-110 transition-all duration-200 hover:text-blue-400"
                >
                  <ChatBubbleOvalLeftIcon className="w-8 h-8" />
                </button>
                <span className="text-white text-xs font-medium">
                  {reel.comments > 999 ? `${(reel.comments / 1000).toFixed(1)}K` : reel.comments}
                </span>
              </div>

              {/* Share button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleShare(reel)}
                  className="text-white mb-1 hover:scale-110 transition-all duration-200 hover:text-green-400"
                >
                  <PaperAirplaneIcon className="w-8 h-8" />
                </button>
              </div>

              {/* Bookmark button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleBookmark(reel.id)}
                  className="text-white mb-1 hover:scale-110 transition-all duration-200"
                >
                  {reel.isBookmarked ? (
                    <BookmarkSolidIcon className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <BookmarkIcon className="w-8 h-8 hover:text-yellow-400" />
                  )}
                </button>
              </div>

              {/* More options */}
              <div className="flex flex-col items-center">
                <button className="text-white hover:scale-110 transition-all duration-200">
                  <EllipsisHorizontalIcon className="w-8 h-8" />
                </button>
              </div>

              {/* Profile picture as music disc */}
              <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white ${isPlaying ? 'animate-spin' : ''} transition-all duration-300`}>
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {reel.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation buttons */}
          {currentIndex > 0 && (
            <button
              onClick={() => handleScroll('up')}
              className="absolute top-1/2 left-4 transform -translate-y-12 bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70 transition-all duration-200 z-40"
            >
              <ArrowUpIcon className="w-6 h-6" />
            </button>
          )}
          {currentIndex < reels.length - 1 && (
            <button
              onClick={() => handleScroll('down')}
              className="absolute top-1/2 left-4 transform translate-y-12 bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70 transition-all duration-200 z-40"
            >
              <ArrowDownIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      ))}

      {/* Comments Modal */}
      {showComments && selectedReel && (
        <CommentsModal
          post={selectedReel}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Share Modal */}
      {showShare && selectedReel && (
        <ShareModal
          post={selectedReel}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
};

export default Reels;
