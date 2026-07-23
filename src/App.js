import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Compass, MessageSquare, Bug, LayoutDashboard, CheckCircle2, 
  Sparkles, Send, Trash2, LogOut, ArrowRight, BookOpen, 
  Zap, Clock, AlertCircle, RefreshCw, Sun, Moon,
  Mic, Download, FileText, Check, Flame, Palette, Paperclip, Camera,
  Plus, Layers, HelpCircle, FileDown, Eye, Image
} from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const safeGetStorage = (key, fallback = '') => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
};

const safeSetStorage = (key, val) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }
};

const safeRemoveStorage = (key) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

function App() {
  const [token, setToken] = useState(() => safeGetStorage('pathai_token', ''));
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = safeGetStorage('pathai_user', 'null');
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => safeGetStorage('pathai_theme', 'dark'));
  const [heatmapPalette, setHeatmapPalette] = useState(() => safeGetStorage('pathai_palette', 'emerald'));
  
  // Auth Form State
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ username: '', password: '', email: '', first_name: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard State
  const [dashboardStats, setDashboardStats] = useState(null);

  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapGoal, setRoadmapGoal] = useState('Machine Learning Core');
  const [roadmapLevel, setRoadmapLevel] = useState('beginner');
  const [roadmapHours, setRoadmapHours] = useState(10);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Chat State
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImage, setChatImage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // File Input Refs for 3 distinct options
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Flashcards & MCQ State
  const [flashcardData, setFlashcardData] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [mcqData, setMcqData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Debugger State
  const [codeInput, setCodeInput] = useState('');
  const [framework, setFramework] = useState('Auto-Detect Language / Framework');
  const [debugResult, setDebugResult] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // ATS Resume Scorer State
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  // Theme Sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    safeSetStorage('pathai_theme', theme);
  }, [theme]);

  // Palette Sync
  useEffect(() => {
    safeSetStorage('pathai_palette', heatmapPalette);
  }, [heatmapPalette]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Axios Config
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const handleLogout = useCallback(() => {
    setToken('');
    setCurrentUser(null);
    safeRemoveStorage('pathai_token');
    safeRemoveStorage('pathai_user');
  }, []);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard/`, getAuthHeaders());
      setDashboardStats(res.data);
      if (res.data.user) setCurrentUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeaders]);

  // Fetch Roadmap
  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/roadmap/`, getAuthHeaders());
      setRoadmap(res.data);
    } catch (err) {
      setRoadmap(null);
    }
  }, [getAuthHeaders]);

  // Fetch Chat Sessions
  const fetchChatSessions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/chat/sessions/`, getAuthHeaders());
      setChatSessions(res.data);
      if (res.data.length > 0 && !currentSessionId) {
        setCurrentSessionId(res.data[0].id);
        setMessages(res.data[0].messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeaders, currentSessionId]);

  // Select Chat Session Thread
  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setFlashcardData(null);
    setMcqData(null);
  };

  // Create New Chat Thread
  const handleCreateNewSession = async () => {
    try {
      const res = await axios.post(`${API_BASE}/chat/sessions/`, { title: 'New Conversation' }, getAuthHeaders());
      setChatSessions(prev => [res.data, ...prev]);
      setCurrentSessionId(res.data.id);
      setMessages([]);
      setFlashcardData(null);
      setMcqData(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Individual Chat Thread
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/chat/sessions/${sessionId}/`, getAuthHeaders());
      const updated = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updated);
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          setCurrentSessionId(updated[0].id);
          setMessages(updated[0].messages || []);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verify Current User on Launch
  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE}/auth/me/`, getAuthHeaders())
        .then(res => {
          setCurrentUser(res.data);
          safeSetStorage('pathai_user', JSON.stringify(res.data));
        })
        .catch(() => handleLogout());
    }
  }, [token, getAuthHeaders, handleLogout]);

  // Load Data on Tab Switch
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'roadmap') fetchRoadmap();
    if (activeTab === 'chat') fetchChatSessions();
  }, [activeTab, token, fetchDashboardStats, fetchRoadmap, fetchChatSessions]);

  // Handle Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const endpoint = authMode === 'login' ? '/auth/login/' : '/auth/register/';
    try {
      const res = await axios.post(`${API_BASE}${endpoint}`, authData);
      const { access, user } = res.data;
      setToken(access);
      setCurrentUser(user);
      safeSetStorage('pathai_token', access);
      safeSetStorage('pathai_user', JSON.stringify(user));
      setAuthData({ username: '', password: '', email: '', first_name: '' });
      setActiveTab('dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.error || err.response?.data?.detail || 'Authentication failed. Please check inputs.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Option 1: File Upload Handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage({ name: file.name, base64: reader.result, type: 'document' });
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  // Option 2: Image Media Upload Handler
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage({ name: file.name, base64: reader.result, type: 'image' });
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  // Option 3: Live Screen Capture Handler
  const handleScreenCapture = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/png');

      stream.getTracks().forEach(track => track.stop());

      setAttachedImage({ name: 'Live_Screen_Capture.png', base64: base64Image, type: 'screenshot' });
    } catch (err) {
      alert('Screen capture cancelled or permission denied.');
    }
  };

  // Voice Input for Chat
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.start();
  };

  // Send Doubt Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && !attachedImage) || chatLoading) return;
    const userMsg = chatInput;
    const imgData = attachedImage?.base64 || '';
    setChatInput('');
    setAttachedImage(null);
    setShowAttachMenu(false);

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg, image_url: imgData }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chat/`, {
        message: userMsg,
        image_url: imgData,
        session_id: currentSessionId
      }, getAuthHeaders());

      if (!currentSessionId && res.data.session_id) {
        setCurrentSessionId(res.data.session_id);
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: res.data.reply }]);
      fetchChatSessions();
      fetchDashboardStats();
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: '⚠️ Sorry, there was an issue processing your request. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick Action Generators
  const handleGenerateFlashcards = async () => {
    setChatLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/flashcards/`, { topic: roadmap?.goal || 'AI/ML Fundamentals' }, getAuthHeaders());
      setFlashcardData(res.data);
      setMcqData(null);
    } catch (err) {
      alert('Error generating flashcards.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateMCQs = async () => {
    setChatLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/mcqs/`, { topic: roadmap?.goal || 'AI/ML Fundamentals' }, getAuthHeaders());
      setMcqData(res.data);
      setFlashcardData(null);
      setSelectedAnswers({});
    } catch (err) {
      alert('Error generating MCQs.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleGeneratePDFSummary = () => {
    const input = document.getElementById('chat-pdf-content');
    if (!input) return;
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save('PathAI_Chat_Notes_Summary.pdf');
    });
  };

  const handleGenerateInfographic = () => {
    setChatInput('Generate a structured visual Mermaid flowchart of the key concepts in my active learning topic.');
  };

  // Generate AI Roadmap
  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    setGeneratingRoadmap(true);
    setRoadmapError('');
    try {
      const res = await axios.post(`${API_BASE}/roadmap/generate/`, {
        goal, level, hours_per_week: hours
      }, getAuthHeaders());
      setRoadmap(res.data);
      fetchDashboardStats();
    } catch (err) {
      setRoadmapError('Failed to generate roadmap. Please try again.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // Toggle Roadmap Item Completion
  const handleToggleItem = async (itemId) => {
    try {
      const res = await axios.patch(`${API_BASE}/roadmap/items/${itemId}/toggle/`, {}, getAuthHeaders());
      if (roadmap) {
        const updatedItems = roadmap.items.map(item => item.id === itemId ? res.data : item);
        setRoadmap({ ...roadmap, items: updatedItems });
        fetchDashboardStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export Roadmap as PDF
  const handleExportPDF = () => {
    const input = document.getElementById('roadmap-pdf-content');
    if (!input) return;
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`PathAI_Roadmap_${roadmap?.goal || 'Learning_Plan'}.pdf`);
    });
  };

  // Run Code Debugger
  const handleDebugCode = async (e) => {
    e.preventDefault();
    if (!codeInput.trim() || debugLoading) return;
    setDebugLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/debug/`, {
        code: codeInput,
        framework
      }, getAuthHeaders());
      setDebugResult(res.data);
      fetchDashboardStats();
    } catch (err) {
      alert('Error analyzing code snippet.');
    } finally {
      setDebugLoading(false);
    }
  };

  // ATS Resume Scoring Submit
  const handleScoreResume = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || resumeLoading) return;
    setResumeLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/resume/score/`, {
        resume_text: resumeText,
        job_description: jobDescription
      }, getAuthHeaders());
      setResumeResult(res.data);
      fetchDashboardStats();
    } catch (err) {
      alert('Error scoring resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  // If Not Authenticated, Render Auth Screen
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="brand-icon"><Sparkles size={22} /></div>
            <span className="brand-title" style={{ fontSize: '1.75rem' }}>PathAI</span>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            AI-Powered Learning Companion for AI/ML Students
          </p>

          <div className="auth-tabs">
            <div 
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              Sign In
            </div>
            <div 
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
            >
              Create Account
            </div>
          </div>

          {authError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. ml_learner" 
                value={authData.username}
                onChange={e => setAuthData({...authData, username: e.target.value})}
                required 
              />
            </div>

            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Alex Rivera" 
                    value={authData.first_name}
                    onChange={e => setAuthData({...authData, first_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="alex@university.edu" 
                    value={authData.email}
                    onChange={e => setAuthData({...authData, email: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={authData.password}
                onChange={e => setAuthData({...authData, password: e.target.value})}
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={authLoading}>
              {authLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In to PathAI' : 'Create Free Account')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const userStreak = currentUser?.profile?.current_streak || dashboardStats?.current_streak || 1;

  return (
    <div className="app-container">
      {/* Hidden File Inputs for Attachment Options */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept=".py,.js,.json,.txt,.pdf,.csv,.doc,.docx" 
        onChange={handleFileSelect} 
        style={{ display: 'none' }} 
      />
      <input 
        type="file" 
        ref={imageInputRef}
        accept="image/*" 
        onChange={handleImageSelect} 
        style={{ display: 'none' }} 
      />

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-logo">
          <div className="brand-icon"><Sparkles size={22} /></div>
          <span className="brand-title">PathAI</span>
        </div>

        <nav className="nav-links">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <Compass size={18} />
            <span>Roadmap Generator</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={18} />
            <span>Doubt-Solver Chat</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            <Bug size={18} />
            <span>Code Debugger</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'ats' ? 'active' : ''}`}
            onClick={() => setActiveTab('ats')}
          >
            <FileText size={18} />
            <span>ATS Resume Scorer</span>
          </div>
        </nav>

        <div className="user-profile-section">
          <div className="user-info">
            <div className="avatar">
              {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentUser?.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>AI/ML Student</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="main-content">
        {/* Top Header Controls (Streak & Theme Toggle) */}
        <div className="top-controls">
          <div className="streak-badge">
            <Flame size={18} fill="var(--accent-amber)" />
            <span>{userStreak} Day Streak</span>
          </div>

          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="page-header">
              <h1 className="page-title"><LayoutDashboard style={{ color: 'var(--accent-primary)' }} /> Progress Dashboard</h1>
              <p className="page-desc">Track your learning streak, roadmap completion, and GitHub-style activity heatmaps.</p>
            </div>

            <div className="grid-stats">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Daily Streak</span>
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}><Flame size={22} /></div>
                </div>
                <div className="stat-value">🔥 {userStreak} Days</div>
                <div className="stat-label">keep learning every day to build your streak</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Roadmap Completion</span>
                  <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}><Compass size={22} /></div>
                </div>
                <div className="stat-value">{dashboardStats ? `${dashboardStats.completion_percentage}%` : '0%'}</div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${dashboardStats?.completion_percentage || 0}%` }} 
                  />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Completed Topics</span>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}><CheckCircle2 size={22} /></div>
                </div>
                <div className="stat-value">{dashboardStats?.completed_items || 0}</div>
                <div className="stat-label">out of {dashboardStats?.total_items || 0} total topics</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">AI Career Tools</span>
                  <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}><Zap size={22} /></div>
                </div>
                <div className="stat-value">
                  {(dashboardStats?.total_chats || 0) + (dashboardStats?.total_debug_queries || 0) + (dashboardStats?.total_resume_scans || 0)}
                </div>
                <div className="stat-label">
                  {dashboardStats?.total_chats || 0} chats • {dashboardStats?.total_debug_queries || 0} debugs • {dashboardStats?.total_resume_scans || 0} resume scans
                </div>
              </div>
            </div>

            {/* GitHub-Style 60-Day Streak Grid Heatmap */}
            <div className="streak-grid-card">
              <div className="streak-grid-header">
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Flame color="var(--accent-amber)" /> Learning Activity & Streak Grid (Last 60 Days)
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Visual representation of daily chats, debugs, and roadmap activity.
                  </p>
                </div>

                {/* Color Palette Selector */}
                <div className="palette-picker">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Palette size={14} /> Color Theme:
                  </span>
                  <div 
                    className={`palette-swatch ${heatmapPalette === 'emerald' ? 'active' : ''}`}
                    style={{ backgroundColor: '#10b981' }}
                    onClick={() => setHeatmapPalette('emerald')}
                    title="GitHub Emerald (Classic)"
                  />
                  <div 
                    className={`palette-swatch ${heatmapPalette === 'cyan' ? 'active' : ''}`}
                    style={{ backgroundColor: '#06b6d4' }}
                    onClick={() => setHeatmapPalette('cyan')}
                    title="Cyber Cyan"
                  />
                  <div 
                    className={`palette-swatch ${heatmapPalette === 'indigo' ? 'active' : ''}`}
                    style={{ backgroundColor: '#6366f1' }}
                    onClick={() => setHeatmapPalette('indigo')}
                    title="Electric Indigo"
                  />
                  <div 
                    className={`palette-swatch ${heatmapPalette === 'amber' ? 'active' : ''}`}
                    style={{ backgroundColor: '#f59e0b' }}
                    onClick={() => setHeatmapPalette('amber')}
                    title="Solar Gold"
                  />
                  <div 
                    className={`palette-swatch ${heatmapPalette === 'rose' ? 'active' : ''}`}
                    style={{ backgroundColor: '#f43f5e' }}
                    onClick={() => setHeatmapPalette('rose')}
                    title="Rose Flame"
                  />
                </div>
              </div>

              {/* Heatmap Tiles Grid */}
              <div className={`palette-${heatmapPalette}`}>
                <div className="heatmap-tiles-grid">
                  {dashboardStats?.activity_grid?.map((tile, idx) => (
                    <div 
                      key={idx}
                      className={`heatmap-tile level-${tile.level}`}
                      title={`${tile.date}: ${tile.count} learning activity item(s)`}
                    />
                  )) || Array.from({ length: 60 }).map((_, idx) => (
                    <div key={idx} className="heatmap-tile level-0" />
                  ))}
                </div>
              </div>

              <div className="heatmap-legend">
                <span>Less</span>
                <div className={`palette-${heatmapPalette}`} style={{ display: 'flex', gap: '4px' }}>
                  <div className="heatmap-tile level-0" style={{ cursor: 'default' }} />
                  <div className="heatmap-tile level-1" style={{ cursor: 'default' }} />
                  <div className="heatmap-tile level-2" style={{ cursor: 'default' }} />
                  <div className="heatmap-tile level-3" style={{ cursor: 'default' }} />
                  <div className="heatmap-tile level-4" style={{ cursor: 'default' }} />
                </div>
                <span>More Activity</span>
              </div>
            </div>

            {/* Quick Action Launchpads */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              <div className="form-card" style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass color="var(--accent-primary)" /> Generate Curriculum
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Create an updated AI/ML week-by-week roadmap tailored to your target field and study hours.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('roadmap')}>
                  Go to Roadmap Generator <ArrowRight size={16} />
                </button>
              </div>

              <div className="form-card" style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare color="var(--accent-cyan)" /> Ask AI/ML Tutor
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Stuck on a concept like Backpropagation or Attention mechanisms? Get simplified explanations with examples.
                </p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('chat')}>
                  Open Doubt Solver <ArrowRight size={16} />
                </button>
              </div>

              <div className="form-card" style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText color="var(--accent-emerald)" /> ATS Resume Scorer
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Evaluate your resume for AI/ML engineering roles out of 100 with actionable keyword suggestions.
                </p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('ats')}>
                  Score My Resume <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROADMAP GENERATOR & CHECKLIST TAB */}
        {activeTab === 'roadmap' && (
          <div>
            <div className="page-header">
              <h1 className="page-title"><Compass style={{ color: 'var(--accent-primary)' }} /> AI Roadmap Generator</h1>
              <p className="page-desc">Build your personalized week-by-week AI/ML curriculum and export it as PDF.</p>
            </div>

            {/* Generator Form */}
            <div className="form-card">
              <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Curriculum Preferences</h2>

              {roadmapError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {roadmapError}
                </div>
              )}

              <form onSubmit={handleGenerateRoadmap} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Goal / Sub-field</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Natural Language Processing, MLOps, Computer Vision"
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Skill Level</label>
                  <select className="form-select" value={level} onChange={e => setLevel(e.target.value)}>
                    <option value="beginner">Beginner (Foundations & Math)</option>
                    <option value="intermediate">Intermediate (Deep Learning & PyTorch)</option>
                    <option value="advanced">Advanced (Transformers & MLOps)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Available Hours / Week</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="3" 
                    max="40" 
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={generatingRoadmap}>
                  {generatingRoadmap ? <><RefreshCw className="spin" size={16} /> Generating AI Plan...</> : <><Sparkles size={16} /> Generate Roadmap</>}
                </button>
              </form>
            </div>

            {/* Skeleton Loading state */}
            {generatingRoadmap && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
              </div>
            )}

            {/* Checklist View */}
            {roadmap && !generatingRoadmap && (
              <div id="roadmap-pdf-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      Roadmap: {roadmap.goal} ({roadmap.level})
                    </h2>
                    <span className="week-badge" style={{ marginTop: '0.4rem', display: 'inline-block' }}>{roadmap.hours_per_week} hrs/week</span>
                  </div>

                  <button className="btn btn-secondary" onClick={handleExportPDF}>
                    <Download size={16} /> Download My Learning Plan (PDF)
                  </button>
                </div>

                <div className="roadmap-weeks-grid">
                  {roadmap.items?.map((item) => (
                    <div key={item.id} className={`week-card ${item.is_completed ? 'completed' : ''}`}>
                      <div className="week-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div 
                            className="checkbox-container" 
                            onClick={() => handleToggleItem(item.id)}
                          >
                            <div className="custom-checkbox">
                              {item.is_completed && <CheckCircle2 size={18} />}
                            </div>
                          </div>
                          <div>
                            <span className="week-badge">Week {item.week_number}</span>
                            <div className="week-title" style={{ textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {item.topic}
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.subtopics && item.subtopics.length > 0 && (
                        <div className="subtopics-list" style={{ marginLeft: '2.5rem' }}>
                          {item.subtopics.map((sub, sIdx) => (
                            <span key={sIdx} className="subtopic-pill">• {sub}</span>
                          ))}
                        </div>
                      )}


                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADVANCED DOUBT-SOLVING CHAT TAB */}
        {activeTab === 'chat' && (
          <div>
            <div className="page-header">
              <h1 className="page-title"><MessageSquare style={{ color: 'var(--accent-cyan)' }} /> AI/ML Multimodal Chat & Study Toolkit</h1>
              <p className="page-desc">Ask questions via text, voice, file uploads, or live screen capture. Generate flashcards, quizzes & summaries.</p>
            </div>

            <div className="chat-layout">
              {/* Chat Sessions Sidebar Drawer */}
              <div className="chat-sessions-sidebar">
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginBottom: '1rem', fontSize: '0.85rem', padding: '0.6rem' }}
                  onClick={handleCreateNewSession}
                >
                  <Plus size={16} /> New Chat
                </button>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Chat History
                </div>

                {chatSessions.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>
                    No saved chats yet.
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                      onClick={() => handleSelectSession(session)}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {session.title}
                      </span>
                      <Trash2 
                        size={14} 
                        style={{ opacity: 0.6, cursor: 'pointer' }} 
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        title="Delete Chat Thread"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Chat Main Window */}
              <div className="chat-container">
                <div className="chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>PathAI Assistant</span>
                  </div>

                  {/* Chat Quick Action Prompt Cards */}
                  <div className="quick-action-pills">
                    <div className="quick-pill" onClick={handleGenerateFlashcards}>
                      <Layers size={14} color="var(--accent-primary)" /> 🎴 Flashcards
                    </div>
                    <div className="quick-pill" onClick={handleGenerateMCQs}>
                      <HelpCircle size={14} color="var(--accent-amber)" /> ❓ MCQ Quiz
                    </div>
                    <div className="quick-pill" onClick={handleGeneratePDFSummary}>
                      <FileDown size={14} color="var(--accent-emerald)" /> 📄 Export PDF Notes
                    </div>
                    <div className="quick-pill" onClick={handleGenerateInfographic}>
                      <Eye size={14} color="var(--accent-cyan)" /> 📊 Visual Flowchart
                    </div>
                  </div>
                </div>

                <div className="chat-messages" id="chat-pdf-content">
                  {/* Render Flashcards overlay if requested */}
                  {flashcardData && (
                    <div className="form-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                        🎴 Flashcards: {flashcardData.topic} (Click card to flip)
                      </h3>
                      <div className="flashcards-grid">
                        {flashcardData.cards?.map((card, cIdx) => (
                          <div 
                            key={cIdx} 
                            className={`flashcard ${flippedCards[cIdx] ? 'flipped' : ''}`}
                            onClick={() => setFlippedCards(prev => ({ ...prev, [cIdx]: !prev[cIdx] }))}
                          >
                            <div className="flashcard-inner">
                              <div className="flashcard-front">
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>Question {cIdx + 1}</div>
                                {card.question}
                              </div>
                              <div className="flashcard-back">
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>Answer</div>
                                {card.answer}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render MCQ Practice Quiz overlay if requested */}
                  {mcqData && (
                    <div className="form-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)' }}>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-amber)' }}>
                        ❓ MCQ Practice Quiz: {mcqData.topic}
                      </h3>
                      {mcqData.questions?.map((q, qIdx) => (
                        <div key={qIdx} className="mcq-card">
                          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                            {qIdx + 1}. {q.question}
                          </div>
                          {q.options?.map((opt, oIdx) => {
                            let statusClass = '';
                            if (selectedAnswers[qIdx] !== undefined) {
                              if (oIdx === q.correct_index) statusClass = 'correct';
                              else if (selectedAnswers[qIdx] === oIdx) statusClass = 'wrong';
                            }
                            return (
                              <button 
                                key={oIdx} 
                                className={`mcq-option-btn ${statusClass}`}
                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                              >
                                {opt}
                              </button>
                            );
                          })}
                          {selectedAnswers[qIdx] !== undefined && (
                            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              💡 <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {messages.length === 0 && !flashcardData && !mcqData ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', maxWidth: '440px' }}>
                      <BookOpen size={42} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
                      <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Multimodal AI Learning Assistant</h3>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Click the Claude-style <strong>+</strong> button to attach code files, pictures, or take a live screen capture!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                        {msg.image_url && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <img 
                              src={msg.image_url} 
                              alt="Attached snippet" 
                              style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                            />
                          </div>
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="chat-bubble assistant">
                      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                    </div>
                  )}
                </div>

                {/* Input Controls with Claude-style Attachment Popover Menu */}
                <form onSubmit={handleSendMessage} className="chat-input-area">
                  {attachedImage && (
                    <div className="attachment-preview">
                      <Paperclip size={14} />
                      <span>{attachedImage.name}</span>
                      <Trash2 size={14} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setAttachedImage(null)} />
                    </div>
                  )}

                  <div className="chat-input-row">
                    {/* Claude-Style Attachment Popup Trigger Button (+) */}
                    <div className="attach-menu-container">
                      <button 
                        type="button" 
                        className={`attach-trigger-btn ${showAttachMenu ? 'active' : ''}`}
                        onClick={() => setShowAttachMenu(prev => !prev)}
                        title="Add attachment or capture screen"
                      >
                        <Plus size={22} />
                      </button>

                      {/* Popover Menu with 3 Distinct Options */}
                      {showAttachMenu && (
                        <div className="attach-popover-menu">
                          <div 
                            className="attach-menu-item"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip size={16} color="var(--accent-primary)" />
                            <span>Upload File / Code</span>
                          </div>

                          <div 
                            className="attach-menu-item"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            <Image size={16} color="var(--accent-cyan)" />
                            <span>Upload Picture / Media</span>
                          </div>

                          <div 
                            className="attach-menu-item"
                            onClick={handleScreenCapture}
                          >
                            <Camera size={16} color="var(--accent-amber)" />
                            <span>Take Live Screenshot</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Voice Input Mic Button */}
                    <button 
                      type="button" 
                      className={`mic-btn ${isListening ? 'listening' : ''}`}
                      onClick={startVoiceInput}
                      title="Speak question via Microphone"
                    >
                      <Mic size={18} />
                    </button>

                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={isListening ? "Listening... Speak your question..." : "Ask a question, or click '+' to attach file/picture/screenshot..."}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={chatLoading}
                    />

                    <button type="submit" className="btn btn-primary" disabled={chatLoading || (!chatInput.trim() && !attachedImage)}>
                      <Send size={16} /> Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CODE / MODEL DEBUGGER TAB */}
        {activeTab === 'debug' && (
          <div>
            <div className="page-header">
              <h1 className="page-title"><Bug style={{ color: 'var(--accent-amber)' }} /> Multi-Language Code & Model Debugger</h1>
              <p className="page-desc">Select your language/framework or set to Auto-Detect. AI will fix errors and state the expected output.</p>
            </div>

            <div className="form-card">
              <form onSubmit={handleDebugCode}>
                <div className="form-group">
                  <label className="form-label">Language / Framework</label>
                  <select className="form-select" value={framework} onChange={e => setFramework(e.target.value)}>
                    <option value="Auto-Detect Language / Framework">✨ Auto-Detect Language / Framework (Recommended)</option>
                    <option value="Python">Python</option>
                    <option value="PyTorch">PyTorch</option>
                    <option value="TensorFlow / Keras">TensorFlow / Keras</option>
                    <option value="Scikit-Learn">Scikit-Learn</option>
                    <option value="JavaScript / React">JavaScript / React</option>
                    <option value="Node.js">Node.js</option>
                    <option value="C++">C++</option>
                    <option value="Java">Java</option>
                    <option value="Rust">Rust</option>
                    <option value="SQL">SQL</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Paste Code Snippet or Error Trace</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Paste code or stack trace here... e.g. TypeError: Cannot read properties of undefined (reading 'map') in React..."
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={debugLoading || !codeInput.trim()}>
                  {debugLoading ? <><RefreshCw className="spin" size={16} /> Debugging Code...</> : <><Bug size={16} /> Debug Code</>}
                </button>
              </form>
            </div>

            {/* Skeleton Loading state */}
            {debugLoading && (
              <div className="form-card">
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px', marginBottom: '1rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '70%' }} />
              </div>
            )}

            {/* AI Debug Analysis Result */}
            {debugResult && !debugLoading && (
              <div className="form-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} /> PathAI Debugger Fix & Expected Output
                </h3>
                <div style={{ lineHeight: 1.7 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {debugResult.ai_response}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATS RESUME SCORER TAB */}
        {activeTab === 'ats' && (
          <div>
            <div className="page-header">
              <h1 className="page-title"><FileText style={{ color: 'var(--accent-emerald)' }} /> ATS Resume Scorer & Analyzer</h1>
              <p className="page-desc">Paste your resume text to evaluate ATS score out of 100, keyword gaps, and formatting suggestions.</p>
            </div>

            <div className="form-card">
              <form onSubmit={handleScoreResume}>
                <div className="form-group">
                  <label className="form-label">Resume Text</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Paste the full text of your resume here..."
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Job Description (Optional)</label>
                  <textarea 
                    className="form-textarea"
                    style={{ minHeight: '100px' }}
                    placeholder="Paste job posting text (e.g. AI Engineer at OpenAI / PyTorch Developer)..."
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={resumeLoading || !resumeText.trim()}>
                  {resumeLoading ? <><RefreshCw className="spin" size={16} /> Evaluating ATS Compatibility...</> : <><Sparkles size={16} /> Score My Resume</>}
                </button>
              </form>
            </div>

            {/* Skeleton Loading state */}
            {resumeLoading && (
              <div className="form-card">
                <div className="skeleton skeleton-text" style={{ width: '30%', height: '30px', marginBottom: '1rem' }} />
                <div className="skeleton skeleton-card" />
              </div>
            )}

            {/* ATS Score Results */}
            {resumeResult && !resumeLoading && (
              <div>
                <div className="score-gauge-card" style={{ '--score-pct': resumeResult.ats_score || resumeResult.feedback_json?.overall_score || 75 }}>
                  <div className="score-circle">
                    {resumeResult.ats_score || resumeResult.feedback_json?.overall_score || 75}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                      ATS Compatibility Score: {resumeResult.ats_score || resumeResult.feedback_json?.overall_score || 75}/100
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      {resumeResult.feedback_json?.summary || "Calculated based on industry ATS scanner benchmarks."}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {/* Missing Keywords */}
                  <div className="form-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={18} /> Missing Target Keywords
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {resumeResult.feedback_json?.missing_keywords?.map((kw, kIdx) => (
                        <span key={kIdx} className="subtopic-pill" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fda4af' }}>
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Formatting Issues */}
                  <div className="form-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} /> Formatting & Layout Alerts
                    </h3>
                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {resumeResult.feedback_json?.formatting_issues?.map((issue, iIdx) => (
                        <li key={iIdx}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Actionable Fixes */}
                  <div className="form-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={18} /> Actionable High-Impact Improvements
                    </h3>
                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                      {resumeResult.feedback_json?.actionable_improvements?.map((fix, fIdx) => (
                        <li key={fIdx} style={{ marginBottom: '0.5rem' }}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;