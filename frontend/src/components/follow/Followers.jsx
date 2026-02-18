import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useFollow } from '../../context/FollowContext';

const Followers = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toggleFollow, isFollowing, isProcessing } = useFollow();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const targetUserId = userId || currentUser?.id;
      const response = await authAPI.getFollowers(targetUserId);
      setFollowers(response.data.followers || []);

      // Follow state is managed by FollowContext
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (user) => {
    await toggleFollow(user);
  };

  const handleMessage = (user) => {
    navigate(`/messages/${user.id}`);
  };

  const isOwnProfile = !userId || userId === currentUser?.id;

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {isOwnProfile ? 'Followers' : 'Followers'}
              </h3>
              <p className="text-sm text-gray-600">
                {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Followers List */}
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {followers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">No Followers Yet</h4>
            <p className="text-sm text-gray-600">
              {isOwnProfile
                ? "Your followers will appear here"
                : "This user doesn't have any followers yet"
              }
            </p>
          </div>
        ) : (
          followers.map((user) => {
            const userIsFollowing = isFollowing(user.id);
            const userIsProcessing = isProcessing(user.id);
            const isCurrentUser = user.id === currentUser?.id;

            return (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link to={`/profile/${user.username}`}>
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user.username}`}>
                        <h4 className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors truncate">
                          {user.username}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isCurrentUser && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleMessage(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                        title="Send Message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleFollowToggle(user)}
                        disabled={userIsProcessing}
                        className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50 min-w-[100px] ${userIsFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                          : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                          }`}
                      >
                        {userIsFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>{userIsProcessing ? '...' : 'Following'}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>{userIsProcessing ? '...' : 'Follow Back'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Followers;
