import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CogIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { authAPI, postAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ProfilePicture from './ProfilePicture';
import { useFollow } from '../../context/FollowContext';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toggleFollow, isFollowing: checkIsFollowing, isProcessing } = useFollow();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFollowing = user ? checkIsFollowing(user.id || user._id) : false;

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      let profileResponse;
      let postsResponse;

      if (username === currentUser?.username || !username) {
        // Fetch current user's profile
        console.log('Fetching current user profile');
        profileResponse = await authAPI.getProfile();
        postsResponse = await postAPI.getUserPosts();
      } else {
        // Fetch specific user's profile by username
        console.log('Fetching user profile for username:', username);
        try {
          profileResponse = await authAPI.getUserByUsername(username);
          postsResponse = await postAPI.getUserPostsByUsername(username);
        } catch (error) {
          console.error('Error fetching user by username:', error);
          // Try to find user from seeded data by searching all users
          try {
            const allUsersResponse = await authAPI.getSuggestedUsers();
            const allUsers = allUsersResponse.data.users || [];
            const foundUser = allUsers.find(u => u.username === username);

            if (foundUser) {
              console.log('Found user in suggested users:', foundUser);
              setUser(foundUser);
              // Fetch posts for this user by ID
              try {
                const userPostsResponse = await postAPI.getUserPosts(foundUser.id);
                setPosts(userPostsResponse.data.posts || []);
              } catch (postError) {
                console.log('No posts found for user');
                setPosts([]);
              }
              setLoading(false);
              return;
            }
          } catch (searchError) {
            console.error('Error searching for user:', searchError);
          }

          // If still not found, show error
          throw new Error(`User ${username} not found`);
        }
      }

      const userData = profileResponse.data.user || profileResponse.data;
      console.log('Profile user data:', userData);
      setUser(userData);

      const postsData = postsResponse.data.posts || postsResponse.data || [];
      console.log('Profile posts data:', postsData);
      setPosts(postsData);

      // Follow state is now checked via FollowContext in the render phase
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return;
    await toggleFollow(user);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-instagram-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <ProfilePicture
              user={user}
              size="xlarge"
              editable={isOwnProfile}
              onUpdate={(updatedUser) => setUser(updatedUser)}
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>

                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isProcessing(user.id || user._id)}
                    className={`px-6 py-2 font-semibold rounded-xl transition-all duration-200 ${isFollowing
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                      } ${isProcessing(user.id || user._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing(user.id || user._id) ? 'Processing...' : (isFollowing ? 'Unfollow' : 'Follow')}
                  </button>
                )}
              </div>

              <div className="flex justify-center md:justify-start space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                  <div className="text-gray-600 text-sm">Posts</div>
                </div>
                <button
                  onClick={() => navigate(`/profile/${user.id}/followers`)}
                  className="text-center hover:text-purple-600 transition-colors"
                >
                  <div className="text-2xl font-bold text-gray-900">{user.followers?.length || 0}</div>
                  <div className="text-gray-600 text-sm">Followers</div>
                </button>
                <button
                  onClick={() => navigate(`/profile/${user.id}/following`)}
                  className="text-center hover:text-purple-600 transition-colors"
                >
                  <div className="text-2xl font-bold text-gray-900">{user.following?.length || 0}</div>
                  <div className="text-gray-600 text-sm">Following</div>
                </button>
              </div>

              {user.bio && (
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Posts</h2>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/create')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Create Post
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                <CogIcon className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">
                {isOwnProfile ? "Share your first moment!" : `${user.username} hasn't posted anything yet.`}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/create')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
                >
                  Create Your First Post
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post._id || post.id} className="group relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>{post.likes?.length || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{post.comments?.length || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
