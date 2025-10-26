import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Clock, User } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useUserProfile } from '../hooks/useUserProfile';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const CaseManagerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch case manager profile using the hook
  const { user: caseManager, loading: profileLoading, error: profileError } = useUserProfile();

  const getToken = () => localStorage.getItem('token');

  // Debug: Log case manager data
  useEffect(() => {
    console.log('═══════════════════════════════════');
    console.log('👨‍⚕️ CaseManagerMessages - Profile Status:');
    console.log('Loading:', profileLoading);
    console.log('Error:', profileError);
    console.log('Case Manager data:', caseManager);
    console.log('Case Manager ID:', caseManager?._id);
    console.log('Role:', caseManager?.role);
    console.log('═══════════════════════════════════');
  }, [caseManager, profileLoading, profileError]);

  // Initialize socket connection
  useEffect(() => {
    if (!caseManager?._id) {
      console.log('❌ CaseManagerMessages - No case manager ID, skipping socket');
      return;
    }

    console.log('🔌 CaseManagerMessages - Initializing socket');
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.emit('join', caseManager._id);

    // Listen for new messages
    socketRef.current.on('newMessage', ({ message }) => {
      console.log('📩 CaseManagerMessages - New message received:', message);
      fetchConversations();
      
      if (selectedConversation?.userId._id === message.senderId) {
        setMessages(prev => [...prev, message]);
        markAsRead();
      }
    });

    // Listen for typing indicator
    socketRef.current.on('userTyping', ({ isTyping: typing }) => {
      console.log('⌨️ CaseManagerMessages - Typing status:', typing);
      setIsTyping(typing);
    });

    socketRef.current.on('connect', () => {
      console.log('✅ CaseManagerMessages - Socket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ CaseManagerMessages - Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ CaseManagerMessages - Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        console.log('🔌 CaseManagerMessages - Disconnecting socket');
        socketRef.current.disconnect();
      }
    };
  }, [caseManager?._id, selectedConversation]);

  // Fetch conversations on mount
  useEffect(() => {
    if (caseManager?._id && !profileLoading) {
      console.log('📥 CaseManagerMessages - Fetching conversations');
      fetchConversations();
    }
  }, [caseManager?._id, profileLoading]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      console.log('📡 CaseManagerMessages - API call: /messages/conversations');
      
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      console.log('✅ CaseManagerMessages - Conversations response:', response.data);

      if (response.data.success) {
        setConversations(response.data.conversations || []);
      }
    } catch (error) {
      console.error('❌ CaseManagerMessages - Error fetching conversations:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.error('🔒 CaseManagerMessages - Authentication error');
      }
      if (error.response?.status === 403) {
        console.error('🚫 CaseManagerMessages - Access denied - not a case manager?');
      }
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      console.log('📡 CaseManagerMessages - Fetching messages for user:', userId);
      
      const response = await axios.get(
        `${API_URL}/messages/conversation?userId=${userId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      console.log('✅ CaseManagerMessages - Messages response:', response.data);

      if (response.data.success) {
        setMessages(response.data.messages || []);
        markAsRead();
      }
    } catch (error) {
      console.error('❌ CaseManagerMessages - Error fetching messages:', error.response?.data || error.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      console.log('⚠️ CaseManagerMessages - Cannot send: empty or no conversation');
      return;
    }

    const messageText = newMessage;
    setNewMessage('');

    try {
      console.log('📤 CaseManagerMessages - Sending message:', {
        receiverId: selectedConversation.userId._id,
        text: messageText
      });

      const response = await axios.post(
        `${API_URL}/messages/send`,
        {
          receiverId: selectedConversation.userId._id,
          text: messageText
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      console.log('✅ CaseManagerMessages - Message sent:', response.data);

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        fetchConversations();
      }
    } catch (error) {
      console.error('❌ CaseManagerMessages - Error sending message:', error.response?.data || error.message);
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    }
  };

  const markAsRead = async () => {
    if (!selectedConversation || !caseManager?._id) return;

    try {
      const conversationId = [caseManager._id, selectedConversation.userId._id]
        .sort()
        .join('_');
      
      console.log('✓ CaseManagerMessages - Marking as read:', conversationId);
      
      await axios.put(
        `${API_URL}/messages/read`,
        { conversationId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      fetchConversations();
    } catch (error) {
      console.error('❌ CaseManagerMessages - Error marking as read:', error);
    }
  };

  const selectConversation = (conversation) => {
    console.log('👆 CaseManagerMessages - Selected conversation:', conversation);
    setSelectedConversation(conversation);
    setMessages([]);
    fetchMessages(conversation.userId._id);
  };

  const handleTyping = () => {
    if (socketRef.current && selectedConversation && caseManager?._id) {
      socketRef.current.emit('typing', {
        conversationId: [caseManager._id, selectedConversation.userId._id].sort().join('_'),
        userId: caseManager._id,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', {
          conversationId: [caseManager._id, selectedConversation.userId._id].sort().join('_'),
          userId: caseManager._id,
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

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Show loading state
  if (profileLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error if profile failed to load
  if (profileError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-600 font-semibold">Error loading profile</p>
          <p className="text-gray-600 text-sm mt-2">{profileError}</p>
        </div>
      </div>
    );
  }

  // Show access denied if not a case manager
  if (caseManager && caseManager.role !== 'case_manager' && caseManager.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <p className="text-gray-800 font-semibold">Access Denied</p>
          <p className="text-gray-600 text-sm mt-2">This feature is only available to case managers.</p>
        </div>
      </div>
    );
  }

  console.log('✅ CaseManagerMessages - Rendering with', conversations.length, 'conversations');

  return (
    <div className="flex h-full bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-blue-600 text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm text-center">No conversations yet</p>
              <p className="text-xs text-center mt-2 text-gray-400">
                Users will appear here when they message you
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => selectConversation(conv)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedConversation?._id === conv._id
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {conv.userId?.username || 'Anonymous User'}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatDate(conv.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  {conv.unreadCount?.caseManager > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                      {conv.unreadCount.caseManager}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedConversation.userId?.username || 'Anonymous User'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.userId?.email || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.isFromCaseManager ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isFromCaseManager
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 shadow-sm border'
                      }`}
                    >
                      {!msg.isFromCaseManager && (
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="w-3 h-3 text-gray-600" />
                          <span className="text-xs font-medium text-gray-600">User</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center space-x-1 mt-1 ${
                        msg.isFromCaseManager ? 'justify-end' : 'justify-start'
                      }`}>
                        <Clock className="w-3 h-3 opacity-60" />
                        <span className="text-xs opacity-60">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg max-w-xs">
                    <div className="flex items-center space-x-1 mb-1">
                      <User className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-600">User</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                  rows="2"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
              <p className="text-sm">Choose a user from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseManagerMessages;