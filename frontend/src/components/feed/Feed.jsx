import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, authAPI } from '../../utils/api';
import Post from './Post';
import InteractivePost from '../interactive/InteractivePost';
import Stories from '../stories/Stories';
import SuggestedUsers from '../suggestions/SuggestedUsers';
import Following from '../follow/Following';
import UserStatsCard from './UserStatsCard';
import NotificationBell from '../notifications/NotificationBell';
import { Sparkles, TrendingUp, Users, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for-you');
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  const fetchPosts = useCallback(async (force = false) => {
    const now = Date.now();

    // Prevent multiple rapid calls (debounce for 2 seconds)
    if (!force && (fetchingPosts || (lastFetchTime && (now - lastFetchTime) < 2000))) {
      console.log('⏳ Skipping fetch - already fetching or too recent');
      return;
    }

    console.log('📡 Fetching posts from API...');
    setFetchingPosts(true);
    setLastFetchTime(now);

    try {
      const response = await postAPI.getAllPosts();
      console.log('📦 Raw API response:', response.data);

      const postsArray = response.data.posts || [];
      console.log('📊 Posts received:', postsArray.length);

      // Log first few post IDs to check for duplicates
      const postIds = postsArray.map(p => p.id);
      console.log('🆔 Post IDs:', postIds.slice(0, 10));

      // Check for duplicates in the raw data
      const duplicateIds = postIds.filter((id, index) => postIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('⚠️ Duplicate IDs found in API response:', duplicateIds);
      }

      // More robust deduplication using Map for better performance
      const postsMap = new Map();
      postsArray.forEach(post => {
        if (post && post.id && !postsMap.has(post.id)) {
          postsMap.set(post.id, post);
        }
      });

      const uniquePosts = Array.from(postsMap.values());

      console.log('✅ Unique posts after deduplication:', uniquePosts.length);
      console.log('🆔 Unique post IDs:', uniquePosts.map(p => p.id));
      console.log('🔄 Setting posts state...');

      // Set posts directly without clearing first
      setPosts(uniquePosts);
    } catch (error) {
      if (error.message === 'OFFLINE') {
        console.log('📴 Offline - setting empty posts');
        setPosts([]);
      } else {
        console.error('❌ Error fetching posts:', error);
        setPosts([]);
      }
    } finally {
      setLoading(false);
      setFetchingPosts(false);
    }
  }, [fetchingPosts, lastFetchTime]);

  useEffect(() => {
    console.log('🔄 Feed component mounted, fetching posts...');
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    console.log('📊 Posts state updated:', posts.length, 'posts');
  }, [posts]);

  const handlePostUpdate = useCallback((updatedPost, action, postId) => {
    if (action === 'delete') {
      // Remove the deleted post from the list
      setPosts(posts.filter(post => post.id !== postId));
    } else if (updatedPost) {
      // Update existing post
      setPosts(posts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      ));
    }
  }, [posts]);

  const tabs = useMemo(() => [
    { id: 'for-you', label: 'For You', icon: Sparkles },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
  ], []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          <p className="text-gray-600 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed Column */}
        <div className="xl:col-span-8">
          {/* Feed Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => fetchPosts(true)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">Refresh</span>
                  </button>
                  <NotificationBell />
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live updates</span>
                    </div>
                    <div className="text-sm text-purple-600 font-medium">
                      {posts.length} posts
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 flex-1 justify-center ${activeTab === tab.id
                        ? 'bg-white text-purple-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stories Section - Only show on For You tab */}
          {activeTab === 'for-you' && (
            <div className="mb-8">
              <Stories />
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'for-you' && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  {!navigator.onLine ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <WifiOff className="w-8 h-8 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">You're offline</h3>
                        <p className="text-gray-600">
                          Posts will load when your connection is restored.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Sociogram!</h3>
                        <p className="text-gray-600 mb-4">
                          Start following people to see their posts in your feed.
                        </p>
                        <Link to="/explore">
                          <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200">
                            Explore Users
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                posts.map((post) => {
                  // Debug logging for each post
                  console.log('🎯 Rendering post:', post.id, post.caption?.substring(0, 30));

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                    >
                      <InteractivePost
                        post={post}
                        onPostUpdate={handlePostUpdate}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Following Tab Content */}
          {activeTab === 'following' && (
            <div className="space-y-6">
              <Following />
            </div>
          )}

          {/* Trending Tab Content */}
          {activeTab === 'trending' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending Posts</h3>
                    <p className="text-gray-600">
                      Trending content will appear here soon!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="xl:col-span-4">
          <div className="sticky top-0 max-h-screen overflow-y-auto">
            {/* User Stats Card */}
            <UserStatsCard />

            <div className="mt-4">
              <SuggestedUsers />
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>Trending Today</span>
              </h3>
              <div className="space-y-3">
                {['#ReactJS', '#WebDevelopment', '#AI', '#TechNews', '#Innovation'].map((tag, index) => (
                  <div key={tag} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                    <div>
                      <span className="font-medium text-gray-900">{tag}</span>
                      <div className="text-sm text-gray-600">{Math.floor(Math.random() * 50) + 10}k posts</div>
                    </div>
                    <div className="text-sm text-purple-600 font-medium">#{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;