import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Users,
  Zap,
  Camera,
  Award,
  Mic,
  Bot,
  ChevronRight,
  Play,
  Bell,
  Video,
  Share2,
  Sparkles,
  Globe,
  Shield,
  Smartphone,
  Headphones,
  Image,
  Send,
  Star,
  Rocket,
  Eye,
  Lock,
  Palette,
  Music,
  FileText,
  UserPlus,
  MessageSquare,
  ThumbsUp,
  Coffee,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';
import AuthSidebar from '../auth/AuthSidebar';
import { signInWithGoogle } from '../../services/firebase/auth';

const LandingPage = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [authSidebarOpen, setAuthSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const navigate = useNavigate();

  const openAuthSidebar = (mode) => {
    setAuthMode(mode);
    setAuthSidebarOpen(true);
  };

  // Enhanced features showcasing current app capabilities
  const features = [
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Ultimate Messaging Hub",
      description: "Real-time chat with voice messages, file sharing, typing indicators, and group conversations",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Smart Notifications",
      description: "Intelligent notification system with real-time updates, message previews, and customizable alerts",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI Assistant",
      description: "Powered by NVIDIA NIM API for intelligent conversations, smart suggestions, and content assistance",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Rich Media Sharing",
      description: "Share photos, videos, voice notes with advanced file handling and cloud storage integration",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Interactive Reactions",
      description: "Express yourself with multiple emoji reactions: ❤️ 😂 😮 😢 👍 and real-time reaction updates",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Social Connections",
      description: "Follow users, build your network, discover suggested connections, and manage your social circle",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const [techStack, setTechStack] = useState([]);
  useEffect(() => {
    setTechStack([
      { name: "React 18", icon: <Zap className="w-5 h-5" /> },
      { name: "Socket.io", icon: <Globe className="w-5 h-5" /> },
      { name: "PostgreSQL", icon: <Shield className="w-5 h-5" /> },
      { name: "Cloudinary", icon: <Image className="w-5 h-5" /> },
      { name: "NVIDIA AI", icon: <Bot className="w-5 h-5" /> },
      { name: "Prisma ORM", icon: <Sparkles className="w-5 h-5" /> }
    ]);
  }, []);

  const stats = [
    { number: "Real-time", label: "Message Delivery", icon: <Send className="w-6 h-6" /> },
    { number: "AI-Powered", label: "Smart Features", icon: <Sparkles className="w-6 h-6" /> },
    { number: "Multi-Media", label: "Content Support", icon: <FileText className="w-6 h-6" /> },
    { number: "24/7", label: "Always Connected", icon: <Globe className="w-6 h-6" /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img
                src="/logo.png"
                alt="Sociogram Logo"
                className="w-20 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 object-contain border-2 border-violet-200 hover:border-violet-300"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  Sociogram
                </h1>
                <p className="text-lg text-gray-500 font-medium">Next-Gen Social Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => openAuthSidebar('login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors relative group"
              >
                Sign In
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => openAuthSidebar('register')}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <Rocket className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center relative z-10">
            {/* Hero Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full px-4 py-2 mb-8 shadow-lg">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Powered by AI & Real-time Technology
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Connect.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative">
                Share.
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-lg -z-10"></div>
              </span>{' '}
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
                Socialize.
              </span>
            </h2>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Experience the future of social media with <span className="font-semibold text-purple-600">Sociogram</span> -
              where AI-powered conversations, real-time messaging, and intelligent notifications
              create meaningful connections like never before.
            </p>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <div className="text-purple-500">{tech.icon}</div>
                  <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => openAuthSidebar('register')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Join Sociogram Now
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-xl hover:border-purple-300 hover:bg-white/90 transition-all duration-300 font-semibold text-lg flex items-center justify-center group shadow-lg hover:shadow-xl">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300 text-purple-500" />
                Watch Demo
              </button>
            </div>

            {/* Floating Feature Icons */}
            <div className="absolute top-20 left-10 animate-bounce delay-1000">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute top-32 right-10 animate-bounce delay-2000">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-20 left-20 animate-bounce delay-3000">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-32 right-20 animate-bounce delay-4000">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative" id="features" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-4 py-2 mb-6">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">Core Features</span>
            </div>
            <h3 className="text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Stay Connected
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Discover powerful features built with cutting-edge technology to enhance your social experience
              and create meaningful connections in the digital age.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 ${currentFeature === index
                      ? `bg-gradient-to-r ${feature.color}/10 border-2 border-purple-300 shadow-xl`
                      : 'bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-xl'
                    }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-4 rounded-xl transition-all duration-500 ${currentFeature === index
                        ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                      {currentFeature === index && (
                        <div className="mt-4 flex items-center text-sm font-semibold text-purple-600">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Currently Active Feature
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              {/* Interactive Feature Showcase */}
              <div className={`bg-gradient-to-br ${features[currentFeature].color} rounded-3xl p-1 shadow-2xl transform transition-all duration-500 hover:scale-105`}>
                <div className="bg-white rounded-3xl p-8 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500"></div>
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>

                  <div className="text-center relative z-10">
                    <div className={`w-24 h-24 bg-gradient-to-br ${features[currentFeature].color} rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-lg transform transition-all duration-500 hover:rotate-12`}>
                      <div className="text-white text-3xl">
                        {features[currentFeature].icon}
                      </div>
                    </div>
                    <h4 className="text-3xl font-bold text-gray-900 mb-6">
                      {features[currentFeature].title}
                    </h4>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto mb-6">
                      {features[currentFeature].description}
                    </p>

                    {/* Feature Indicators */}
                    <div className="flex justify-center space-x-2">
                      {features.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentFeature(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${currentFeature === index
                              ? `bg-gradient-to-r ${features[index].color}`
                              : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Rocket className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Powered by Modern Technology
            </h3>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Built with cutting-edge tools and frameworks for the best user experience
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-lg opacity-90">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Technology Stack</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Built with{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Modern Tools
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sociogram leverages the latest technologies to deliver a fast, secure, and scalable social platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:border-purple-300"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-purple-500 group-hover:to-blue-500 group-hover:text-white transition-all duration-300">
                    {tech.icon}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                  {tech.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-4 py-2 mb-8">
              <Coffee className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Ready to Get Started?</span>
            </div>

            <h3 className="text-5xl font-bold text-gray-900 mb-6">
              Join the{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sociogram
              </span>{' '}
              Community
            </h3>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Start your journey with Sociogram today and experience social media like never before.
              Connect with friends, share your moments, and discover the power of AI-enhanced conversations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => openAuthSidebar('register')}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group"
              >
                <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Create Your Account
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button
                onClick={() => openAuthSidebar('login')}
                className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Sign In Instead
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 mt-10 pt-8 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-gray-500">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Always Online</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Built with Love</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-black text-white py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <img
                src="/logo.png"
                alt="Sociogram Logo"
                className="w-16 h-12 rounded-xl shadow-lg object-contain border-2 border-violet-300"
              />
              <div>
                <h4 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Sociogram
                </h4>
                <p className="text-sm text-gray-400">Next-Gen Social Platform</p>
              </div>
            </div>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Connect meaningfully. Share authentically. Socialize intelligently.
            </p>

            {/* Feature Links */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <span className="flex items-center space-x-2 text-gray-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Real-time Messaging</span>
              </span>
              <span className="flex items-center space-x-2 text-gray-400">
                <Bot className="w-4 h-4" />
                <span className="text-sm">AI Assistant</span>
              </span>
              <span className="flex items-center space-x-2 text-gray-400">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Smart Notifications</span>
              </span>
              <span className="flex items-center space-x-2 text-gray-400">
                <Camera className="w-4 h-4" />
                <span className="text-sm">Media Sharing</span>
              </span>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-gray-500 mb-4 md:mb-0">
                  © 2025 Sociogram. Built with ❤️ for meaningful connections.
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <span className="text-sm">Powered by</span>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">AI Technology</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Sidebar */}
      <AuthSidebar
        isOpen={authSidebarOpen}
        onClose={() => setAuthSidebarOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;