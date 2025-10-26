import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Shield, Clock, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const ChatWidget = ({ user }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getToken = () => localStorage.getItem('token');

  // Debug: Log user data
  useEffect(() => {
    console.log('═══════════════════════════════════');
    console.log('💬 ChatWidget DEBUG INFO:');
    console.log('User prop received:', user);
    console.log('User._id:', user?._id);
    console.log('User.id:', user?.id);
    console.log('User.assignedCaseManager:', user?.assignedCaseManager);
    console.log('Type of assignedCaseManager:', typeof user?.assignedCaseManager);
    console.log('Has case manager?', !!user?.assignedCaseManager);
    console.log('Token exists?', !!getToken());
    console.log('API_URL:', API_URL);
    console.log('SOCKET_URL:', SOCKET_URL);
    console.log('═══════════════════════════════════');
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id && !user?.id) {
      console.log('❌ ChatWidget - No user ID, skipping socket connection');
      return;
    }

    const userId = user._id || user.id;
    console.log('🔌 ChatWidget - Initializing socket connection for user:', userId);
    
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.emit('join', userId);

    socketRef.current.on('newMessage', ({ message }) => {
      console.log('📩 ChatWidget - New message received:', message);
      setMessages(prev => [...prev, message]);
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socketRef.current.on('userTyping', ({ isTyping: typing }) => {
      console.log('⌨️ ChatWidget - Typing status:', typing);
      setIsTyping(typing);
    });

    socketRef.current.on('connect', () => {
      console.log('✅ ChatWidget - Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ ChatWidget - Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ ChatWidget - Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        console.log('🔌 ChatWidget - Disconnecting socket');
        socketRef.current.disconnect();
      }
    };
  }, [user?._id, user?.id, isChatOpen]);

  // Fetch messages when chat opens
  useEffect(() => {
    if (isChatOpen && user?.assignedCaseManager) {
      console.log('📥 ChatWidget - Fetching messages');
      fetchMessages();
      setUnreadCount(0);
    }
  }, [isChatOpen, user?.assignedCaseManager]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('📡 ChatWidget - Fetching messages from:', `${API_URL}/messages/conversation`);
      
      const response = await axios.get(`${API_URL}/messages/conversation`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      console.log('✅ ChatWidget - Messages response:', response.data);

      if (response.data.success) {
        setMessages(response.data.messages || []);
        markAsRead();
      }
    } catch (error) {
      console.error('❌ ChatWidget - Error fetching messages:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 404) {
        console.log('ℹ️ ChatWidget - No conversation found, starting fresh');
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('⚠️ ChatWidget - Cannot send: empty message');
      return;
    }
    
    if (!user?.assignedCaseManager) {
      console.log('⚠️ ChatWidget - Cannot send: no case manager assigned');
      alert('You need to have a case manager assigned to send messages.');
      return;
    }

    const messageText = newMessage;
    setNewMessage('');

    try {
      console.log('📤 ChatWidget - Sending message:', {
        receiverId: user.assignedCaseManager,
        text: messageText
      });

      const response = await axios.post(
        `${API_URL}/messages/send`,
        {
          receiverId: user.assignedCaseManager,
          text: messageText
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      console.log('✅ ChatWidget - Message sent:', response.data);

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
      }
    } catch (error) {
      console.error('❌ ChatWidget - Error sending message:', error.response?.data || error.message);
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    }
  };

  const markAsRead = async () => {
    const userId = user?._id || user?.id;
    if (!userId || !user?.assignedCaseManager) return;

    try {
      const conversationId = [userId, user.assignedCaseManager].sort().join('_');
      
      await axios.put(
        `${API_URL}/messages/read`,
        { conversationId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    } catch (error) {
      console.error('❌ ChatWidget - Error marking as read:', error);
    }
  };

  const handleTyping = () => {
    const userId = user?._id || user?.id;
    if (socketRef.current && user?.assignedCaseManager) {
      socketRef.current.emit('typing', {
        conversationId: [userId, user.assignedCaseManager].sort().join('_'),
        userId: userId,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', {
          conversationId: [userId, user.assignedCaseManager].sort().join('_'),
          userId: userId,
          isTyping: false
        });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Don't render if no user
  if (!user) {
    console.log('❌ ChatWidget - No user provided');
    return null;
  }

  const noCaseManager = !user.assignedCaseManager;

  console.log('✅ ChatWidget - Rendering. Has case manager:', !noCaseManager);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => {
            console.log('🔵 ChatWidget - Opening chat');
            setIsChatOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 relative"
        >
          <MessageCircle className="w-6 h-6" />
          {noCaseManager && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              !
            </span>
          )}
          {!noCaseManager && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm md:w-96 h-[500px] md:h-[600px] flex flex-col border">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Case Manager Chat</h3>
                <p className="text-xs text-blue-200">
                  {noCaseManager ? 'Setup Required' : 'Support Chat'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('❌ ChatWidget - Closing chat');
                setIsChatOpen(false);
              }}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Warning if no case manager */}
            {noCaseManager && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 text-sm">No Case Manager Assigned</h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      You need to have a case manager assigned to use this chat.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2 font-mono bg-yellow-100 p-2 rounded">
                      Debug Info:<br/>
                      User ID: {user._id || user.id || 'undefined'}<br/>
                      Case Manager: {user.assignedCaseManager || 'not assigned'}
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      Contact an administrator to assign you a case manager.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show messages if case manager exists */}
            {!noCaseManager && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start a conversation with your case manager</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.isFromCaseManager ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${
                          message.isFromCaseManager
                            ? 'bg-white text-gray-800 shadow-sm border'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {message.isFromCaseManager && (
                          <div className="flex items-center space-x-1 mb-1">
                            <Shield className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Case Manager</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className={`flex items-center space-x-1 mt-1 ${
                          message.isFromCaseManager ? 'justify-start' : 'justify-end'
                        }`}>
                          <Clock className="w-3 h-3 opacity-60" />
                          <span className="text-xs opacity-60">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <Shield className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Case Manager</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder={noCaseManager ? "Case manager required..." : "Type your message..."}
                disabled={noCaseManager}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows="1"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || noCaseManager}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {noCaseManager ? 'Contact admin to assign case manager' : 'Your identity remains anonymous'}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isChatOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-25 -z-10" 
          onClick={() => setIsChatOpen(false)} 
        />
      )}
    </div>
  );
};

export default ChatWidget;