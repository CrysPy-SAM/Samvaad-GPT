import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, Menu, X, Upload, Loader2, MessageSquare, Moon, Sun } from 'lucide-react';
import { useAuth } from "./context/AuthContext.jsx"; // ✅ Auth context import

const API_URL = 'http://localhost:8080/api';

export default function App() {
  const { user, token, logout } = useAuth(); // ✅ useAuth values
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchThreads();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Fetch all threads
  const fetchThreads = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ added token
      });
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  // Create new thread
  const createNewThread = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/thread`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // ✅ added token
        },
        body: JSON.stringify({ title: 'New Chat' })
      });
      const data = await response.json();
      setCurrentThreadId(data.threadId);
      setMessages([]);
      fetchThreads();
      return data.threadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  };

  // Load thread messages
  const loadThread = async (threadId) => {
    try {
      const response = await fetch(`${API_URL}/chat/thread/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ added token
      });
      const data = await response.json();
      setCurrentThreadId(threadId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  // Delete thread
  const deleteThread = async (threadId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await fetch(`${API_URL}/chat/thread/${threadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // ✅ added token
      });
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
        setMessages([]);
      }
      fetchThreads();
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    let threadId = currentThreadId;
    if (!threadId) {
      threadId = await createNewThread();
      if (!threadId) return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message immediately
    const tempUserMsg = { role: 'user', content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // ✅ added token
        },
        body: JSON.stringify({
          threadId: threadId,
          message: userMessage
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        fetchThreads();
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Failed to send message. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // File upload and analysis
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/file/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // ✅ added token
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (!currentThreadId) {
          await createNewThread();
        }
        
        const fileMsg = {
          role: 'assistant',
          content: `📁 **File Analysis: ${file.name}**\n\n${data.analysis}\n\n---\n📊 **Metadata:**\n- Size: ${data.metadata.sizeFormatted}\n- Type: ${data.metadata.type}\n- Extraction Method: ${data.extractionMethod}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fileMsg]);
        fetchThreads();
      } else {
        throw new Error(data.message || 'Failed to analyze file');
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ Failed to analyze file: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border-r transition-all duration-300 overflow-hidden flex flex-col`}>
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={createNewThread}
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors font-medium`}
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              <p className="text-sm">No chats yet</p>
            </div>
          ) : (
            threads.map(thread => (
              <div
                key={thread.threadId}
                onClick={() => loadThread(thread.threadId)}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                  currentThreadId === thread.threadId 
                    ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`flex-1 truncate text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {thread.title}
                </span>
                <button
                  onClick={(e) => deleteThread(thread.threadId, e)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-200 text-gray-600 hover:text-red-600'}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Settings */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ✅ Single Clean Header */}
        <div className={`${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors`}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Samvaad-GPT</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Built by Satyam Mishra</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              👋 {user?.name || "User"}
            </span>
            <button
              onClick={logout}
              className={`text-sm px-3 py-1 rounded ${darkMode ? "bg-red-700 hover:bg-red-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"} transition-colors`}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`text-6xl mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>
                💬
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Start a Conversation
              </h2>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-center max-w-md px-4`}>
                Ask me anything! I can help with coding, writing, analysis, and more.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl px-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} cursor-pointer hover:scale-105 transition-transform`} onClick={() => setInputMessage("Explain quantum computing in simple terms")}>
                  <div className="text-2xl mb-2">🔬</div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Explain complex topics</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} cursor-pointer hover:scale-105 transition-transform`} onClick={() => setInputMessage("Write a Python function to sort a list")}>
                  <div className="text-2xl mb-2">💻</div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Help with coding</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white flex-shrink-0 font-bold text-sm`}>
                      AI
                    </div>
                  )}
                  <div className={`flex flex-col gap-1 max-w-[80%]`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                          : darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                    </div>
                    {msg.timestamp && (
                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'} ${msg.role === 'user' ? 'text-right' : 'text-left'} px-2`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex-shrink-0 font-semibold text-xs`}>
                      You
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white font-bold text-sm`}>
                    AI
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} flex items-center gap-2`}>
                    <Loader2 className={`animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border-t px-4 py-4 flex-shrink-0`}>
          <div className="max-w-3xl mx-auto">
            {isAnalyzing && (
              <div className={`mb-3 flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-blue-50 text-blue-700'}`}>
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Analyzing file...</span>
              </div>
            )}
            <div className={`flex gap-2 items-end ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl p-2`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.txt,.js,.json,.py,.jpg,.jpeg,.png,.md,.csv"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing || isLoading}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-700'} disabled:opacity-50 transition-colors`}
                title="Upload file"
              >
                <Upload size={20} />
              </button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Samvaad-GPT..."
                disabled={isLoading || isAnalyzing}
                className={`flex-1 bg-transparent ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} outline-none resize-none max-h-32 py-2 px-2`}
                rows={1}
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || isAnalyzing}
                className={`p-2 rounded-lg transition-all ${
                  inputMessage.trim() && !isLoading && !isAnalyzing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                    : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                } disabled:cursor-not-allowed`}
              >
                <Send size={20} />
              </button>
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'} mt-2 text-center`}>
              Samvaad-GPT can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}