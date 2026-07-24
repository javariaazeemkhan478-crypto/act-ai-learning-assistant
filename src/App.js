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
  Plus, Layers, HelpCircle, FileDown, Eye, Image, Upload, EyeOff, History, Menu, X
} from 'lucide-react';
import './App.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '/api';

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
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [heatmapPalette, setHeatmapPalette] = useState('emerald');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedToken = safeGetStorage('pathai_token', '');
    const savedUserStr = safeGetStorage('pathai_user', 'null');
    const savedTheme = safeGetStorage('pathai_theme', 'dark');
    const savedPalette = safeGetStorage('pathai_palette', 'emerald');

    setToken(savedToken);
    setTheme(savedTheme);
    setHeatmapPalette(savedPalette);
    const savedUsername = safeGetStorage('pathai_username', '');
    if (savedUsername) {
      setAuthData(prev => ({ ...prev, username: savedUsername }));
    }
    try {
      setCurrentUser(JSON.parse(savedUserStr));
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);
  
  // Auth Form State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ username: '', password: '', email: '', first_name: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard State
  const [dashboardStats, setDashboardStats] = useState(null);

  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);
  const [goal, setGoal] = useState('Natural Language Processing (NLP)');
  const [level, setLevel] = useState('beginner');
  const [hours, setHours] = useState(10);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [showRoadmapHistory, setShowRoadmapHistory] = useState(false);

  // Chat State
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatImage, setChatImage] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // File Input Refs for options
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const resumePdfInputRef = useRef(null);

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
  const [resumeError, setResumeError] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [resumeHistory, setResumeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState(null);
  const [pendingChatDelete, setPendingChatDelete] = useState(null);

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

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timeout = window.setTimeout(() => setNotification(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        if (!(status === 404 && /\/roadmap$/.test(url))) {
          showNotification(error?.response?.data?.error || error?.response?.data?.detail || 'Something went wrong. Please try again.');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [showNotification]);

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

  const startGuestSession = useCallback(async () => {
    try {
      const res = await axios.post(`${API_BASE}/auth/guest`);
      const { access, user } = res.data;
      setToken(access);
      setCurrentUser(user);
      safeSetStorage('pathai_token', access);
      safeSetStorage('pathai_user', JSON.stringify(user));
    } catch (err) {
      console.error('Unable to start guest session:', err);
    }
  }, []);

  const openAuth = useCallback((mode = 'login', message = '') => {
    setAuthMode(mode);
    setAuthError(message);
    setShowAuthModal(true);
  }, []);

  const requireAuth = useCallback(() => {
    if (token) return true;
    startGuestSession();
    return false;
  }, [token, startGuestSession]);

  const handleApiError = useCallback((err, setError) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.';
    if (status === 401) {
      handleLogout();
      startGuestSession();
      if (setError) setError('Please sign in to continue.');
      return msg;
    }
    if (setError) setError(msg);
    return msg;
  }, [handleLogout, startGuestSession]);

  const goToTab = useCallback((tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (!token) startGuestSession();
  }, [token, startGuestSession]);

  // Registration is optional: each visitor gets an isolated guest workspace.
  useEffect(() => {
    if (mounted && !token) startGuestSession();
  }, [mounted, token, startGuestSession]);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard`, getAuthHeaders());
      setDashboardStats(res.data);
      if (res.data.user) setCurrentUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeaders]);

  // Fetch Roadmap
  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/roadmap`, getAuthHeaders());
      setRoadmap(res.data);
    } catch (err) {
      setRoadmap(null);
    }
  }, [getAuthHeaders]);

  const fetchRoadmapHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/roadmap/history`, getAuthHeaders());
      setRoadmapHistory(res.data);
    } catch (err) {
      setRoadmapHistory([]);
    }
  }, [getAuthHeaders]);

  // Fetch Chat Sessions
  const fetchChatSessions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/chat/sessions`, getAuthHeaders());
      setChatSessions(res.data);
      if (res.data.length > 0 && !currentSessionId) {
        setCurrentSessionId(res.data[0].id);
        setMessages(res.data[0].messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeaders, currentSessionId]);

  // Fetch Resume Scan History
  const fetchResumeHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/resume/history`, getAuthHeaders());
      setResumeHistory(res.data);
    } catch (err) {
      console.error(err);
      setResumeHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [getAuthHeaders]);

  const loadHistoryScan = async (scanId) => {
    try {
      const res = await axios.get(`${API_BASE}/resume/history/${scanId}`, getAuthHeaders());
      setResumeResult(res.data);
      setResumeText(res.data.resume_text || '');
      setJobDescription(res.data.job_description || '');
      setResumeError('');
      setShowHistory(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setResumeError(err.response?.data?.error || 'Failed to load scan from history.');
    }
  };

  const deleteHistoryScan = async (scanId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this resume scan from your history?')) return;
    try {
      await axios.delete(`${API_BASE}/resume/history/${scanId}`, getAuthHeaders());
      setResumeHistory(prev => prev.filter(s => s.id !== scanId));
      if (resumeResult?.id === scanId) setResumeResult(null);
      fetchDashboardStats();
    } catch (err) {
      setResumeError(err.response?.data?.error || 'Failed to delete scan.');
    }
  };

  const formatHistoryDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
      const res = await axios.post(`${API_BASE}/chat/sessions`, { title: 'New Conversation' }, getAuthHeaders());
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
    setPendingChatDelete(sessionId);
  };

  const confirmDeleteSession = async () => {
    const sessionId = pendingChatDelete;
    if (!sessionId) return;
    setPendingChatDelete(null);
    try {
      await axios.delete(`${API_BASE}/chat/sessions/${sessionId}`, getAuthHeaders());
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
      await fetchChatSessions();
      showNotification('Conversation deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Verify Current User on Launch
  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE}/auth/me`, getAuthHeaders())
        .then(res => {
          setCurrentUser(res.data);
          safeSetStorage('pathai_user', JSON.stringify(res.data));
        })
        .catch(() => {
          handleLogout();
          startGuestSession();
        });
    }
  }, [token, getAuthHeaders, handleLogout, startGuestSession]);

  // Load Data on Tab Switch
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'roadmap') fetchRoadmap();
    if (activeTab === 'chat') fetchChatSessions();
    if (activeTab === 'ats') fetchResumeHistory();
  }, [activeTab, token, fetchDashboardStats, fetchRoadmap, fetchChatSessions, fetchResumeHistory]);

  // Handle Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const trimmedUsername = authData.username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      setAuthError('Username must be at least 3 characters.');
      return;
    }
    if (authData.password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (authMode === 'register' && authData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authData.email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    try {
      const payload = {
        ...authData,
        username: trimmedUsername,
        email: authData.email?.trim().toLowerCase() || '',
      };
      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      const { access, user } = res.data;
      setToken(access);
      setCurrentUser(user);
      safeSetStorage('pathai_token', access);
      safeSetStorage('pathai_user', JSON.stringify(user));
      safeSetStorage('pathai_username', trimmedUsername);
      setAuthData({ username: trimmedUsername, password: '', email: '', first_name: '' });
      setActiveTab('dashboard');
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Option 1: File Upload Handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setResumeError('Please upload a PDF smaller than 4 MB.');
      if (resumePdfInputRef.current) resumePdfInputRef.current.value = '';
      return;
    }
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
      showNotification('Screen capture was cancelled or permission was denied.');
    }
  };

  // Voice Input for Chat
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification('Speech recognition is not supported in this browser. Please try Google Chrome.');
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
    if (!requireAuth('Sign in to use the Doubt Solver chat.')) return;
    const userMsg = chatInput;
    const imgData = attachedImage?.base64 || '';
    setChatInput('');
    setAttachedImage(null);
    setShowAttachMenu(false);

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg, image_url: imgData }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
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
      const msg = handleApiError(err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: `⚠️ ${msg || 'Sorry, there was an issue processing your request. Please try again.'}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick Action Generators
  const handleGenerateFlashcards = async () => {
    if (!requireAuth()) return;
    setChatLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/flashcards`, { topic: roadmap?.goal || 'AI/ML Fundamentals' }, getAuthHeaders());
      setFlashcardData(res.data);
      setMcqData(null);
    } catch (err) {
      handleApiError(err);
      showNotification(err.response?.data?.error || 'Could not generate flashcards. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateMCQs = async () => {
    if (!requireAuth()) return;
    setChatLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/mcqs`, { topic: roadmap?.goal || 'AI/ML Fundamentals' }, getAuthHeaders());
      setMcqData(res.data);
      setFlashcardData(null);
      setSelectedAnswers({});
    } catch (err) {
      handleApiError(err);
      showNotification(err.response?.data?.error || 'Could not generate MCQs. Please try again.');
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
    if (!requireAuth('Sign in to generate your personalized AI/ML roadmap.')) return;
    setGeneratingRoadmap(true);
    setRoadmapError('');
    try {
      const res = await axios.post(`${API_BASE}/roadmap/generate`, {
        goal, level, hours_per_week: hours
      }, getAuthHeaders());
      setRoadmap(res.data);
      fetchDashboardStats();
      fetchRoadmapHistory();
      showNotification('Your new roadmap is ready.', 'success');
    } catch (err) {
      handleApiError(err, setRoadmapError);
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // Toggle Roadmap Item Completion
  const handleToggleItem = async (itemId) => {
    const previousItem = roadmap?.items?.find((item) => item.id === itemId);
    if (!previousItem) return;

    // Give instant visual feedback, then reconcile with the saved server state.
    setRoadmap((current) => current ? {
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, is_completed: !previousItem.is_completed } : item)
    } : current);

    try {
      const res = await axios.patch(`${API_BASE}/roadmap/items/${itemId}/toggle`, {}, getAuthHeaders());
      setRoadmap((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === itemId ? res.data : item)
      } : current);
      fetchDashboardStats();
      fetchRoadmapHistory();
    } catch (err) {
      console.error(err);
      setRoadmap((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === itemId ? previousItem : item)
      } : current);
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
    if (!requireAuth('Sign in to use the Code Debugger.')) return;
    setDebugLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/debug`, {
        code: codeInput,
        framework
      }, getAuthHeaders());
      setDebugResult(res.data);
      fetchDashboardStats();
    } catch (err) {
      showNotification(handleApiError(err) || 'Could not analyze this code. Please try again.');
    } finally {
      setDebugLoading(false);
    }
  };

  // ATS Resume Scoring Submit
  const handleScoreResume = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim() || resumeLoading) return;
    if (!requireAuth('Sign in to score your resume with the ATS tool.')) return;
    setResumeLoading(true);
    setResumeError('');
    setResumeResult(null);
    try {
      const res = await axios.post(`${API_BASE}/resume/score`, {
        resume_text: resumeText,
        job_description: jobDescription
      }, getAuthHeaders());
      setResumeResult(res.data);
      fetchDashboardStats();
      fetchResumeHistory();
    } catch (err) {
      handleApiError(err, setResumeError);
    } finally {
      setResumeLoading(false);
    }
  };

  const extractScannedPdfText = async (file) => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createWorker } = await import('tesseract.js');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pageCount = Math.min(pdf.numPages, 4);
    const worker = await createWorker('eng');
    const pages = [];

    try {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const result = await worker.recognize(canvas);
        if (result.data.text?.trim()) pages.push(result.data.text.trim());
      }
    } finally {
      await worker.terminate();
    }

    return pages.join('\n\n').trim();
  };

  // PDF Upload Handler for ATS Resume Scorer. Text PDFs use the server; scans
  // automatically fall back to in-browser OCR.
  const handleResumePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!requireAuth('Sign in to upload and score your resume.')) {
      if (resumePdfInputRef.current) resumePdfInputRef.current.value = '';
      return;
    }
    setResumeError('');
    setUploadedFileName(file.name);

    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => setResumeText(event.target.result);
      reader.readAsText(file);
      return;
    }

    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Do not set Content-Type here: the browser adds the multipart boundary.
      const res = await axios.post(`${API_BASE}/resume/parse-pdf`, formData, getAuthHeaders());
      setResumeText(res.data.text);
    } catch (err) {
      try {
        setResumeError('This looks like a scanned PDF. Reading it with OCR…');
        const extractedText = await extractScannedPdfText(file);
        if (!extractedText) throw new Error('No readable text was found in this PDF.');
        setResumeText(extractedText);
        setResumeError('');
        showNotification('Resume text extracted successfully with OCR.', 'success');
      } catch (ocrError) {
        const message = ocrError?.message || 'Could not read this PDF. Please use a clearer PDF or paste its text.';
        setResumeError(message);
        showNotification(message);
        setUploadedFileName('');
      }
    } finally {
      setPdfUploading(false);
      if (resumePdfInputRef.current) resumePdfInputRef.current.value = '';
    }
  };

  // Export ATS Evaluation Results as PDF
  const handleExportATSResultPDF = () => {
    const input = document.getElementById('ats-pdf-content');
    if (!input) return;
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`PathAI_ATS_Resume_Evaluation.pdf`);
    });
  };

  // Show sleek loader while restoring session on mount (prevents login screen flicker!)
  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0d14', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PathAI
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.95rem' }}>
          <RefreshCw className="spin" size={18} color="#10b981" /> Restoring learning session...
        </div>
      </div>
    );
  }

  // If Not Authenticated, Render Auth Screen Modal
  const renderAuthModal = () => {
    if (!showAuthModal) return null;
    return (
      <div className="auth-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)' }}>
        <div className="auth-card" style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setShowAuthModal(false)} 
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="brand-icon"><Sparkles size={22} /></div>
            <span className="brand-title" style={{ fontSize: '1.75rem' }}>PathAI</span>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            AI-Powered Learning Companion for AI/ML Students
          </p>
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.8rem', lineHeight: 1.5, padding: '0 0.5rem' }}>
            Final Project — ACT AI Course · Government of Pakistan<br />
            <span style={{ color: 'var(--accent-emerald)' }}>Sign in to save your roadmap, chat history, and resume scans permanently.</span>
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
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="form-input" 
                  placeholder="••••••••" 
                  value={authData.password}
                  onChange={e => setAuthData({...authData, password: e.target.value})}
                  required 
                  minLength={6}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {authMode === 'register' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Minimum 6 characters</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={authLoading}>
              {authLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In to PathAI' : 'Create Free Account')}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const userStreak = currentUser?.profile?.current_streak || dashboardStats?.current_streak || 1;
  const isGuest = Boolean(currentUser?.is_guest);

  return (
    <div className="app-container">
      {notification && (
        <div className={`app-notification ${notification.type}`} role="alert">
          <AlertCircle size={19} />
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss notification"><X size={18} /></button>
        </div>
      )}
      {pendingChatDelete && (
        <div className="confirm-modal-backdrop" role="presentation">
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title">
            <div className="confirm-modal-icon"><Trash2 size={24} /></div>
            <h2 id="delete-chat-title">Delete this conversation?</h2>
            <p>This permanently removes the conversation and all of its messages. This action cannot be undone.</p>
            <div className="confirm-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPendingChatDelete(null)}>Keep Chat</button>
              <button type="button" className="btn confirm-delete-btn" onClick={confirmDeleteSession}><Trash2 size={16} /> Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
      {renderAuthModal()}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
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
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-logo">
          <div className="brand-icon"><Sparkles size={22} /></div>
          <span className="brand-title">PathAI</span>
          <button type="button" className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="nav-links">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => goToTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => goToTab('roadmap')}
          >
            <Compass size={18} />
            <span>Roadmap Generator</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => goToTab('chat')}
          >
            <MessageSquare size={18} />
            <span>Doubt-Solver Chat</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => goToTab('debug')}
          >
            <Bug size={18} />
            <span>Code Debugger</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'ats' ? 'active' : ''}`}
            onClick={() => goToTab('ats')}
          >
            <FileText size={18} />
            <span>ATS Resume Scorer</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="act-badge">
            <span className="act-badge-dot" />
            ACT AI · Govt. of Pakistan
          </div>
          <p className="sidebar-footer-text">PathAI Final Project</p>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="main-content">
        {/* Global Top Header — Streak, Theme, User & Sign Out */}
        <header className="app-header">
          <div className="app-header-left">
            <button type="button" className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <span className="header-greeting">Welcome, <strong>{currentUser?.first_name || currentUser?.username || 'Guest'}</strong></span>
          </div>
          <div className="app-header-right">
            {!token ? (
              <>
                <button className="theme-toggle-btn" onClick={toggleTheme} type="button">
                  {theme === 'dark' ? <><Sun size={16} /> Light</> : <><Moon size={16} /> Dark</>}
                </button>
                <button className="btn btn-primary" onClick={() => openAuth('login')}>
                  Sign In
                </button>
                <button className="btn btn-secondary" onClick={() => openAuth('register')}>
                  Register
                </button>
              </>
            ) : (
              <>
                <div className="streak-badge">
                  <Flame size={18} fill="var(--accent-amber)" />
                  <span>{userStreak} Day Streak</span>
                </div>
                <button className="theme-toggle-btn" onClick={toggleTheme} type="button">
                  {theme === 'dark' ? <><Sun size={16} /> Light</> : <><Moon size={16} /> Dark</>}
                </button>
                <div className="header-user-chip">
                  <div className="avatar avatar-sm">
                    {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <span>{currentUser?.username}</span>
                </div>
                {isGuest && <>
                  <button className="btn btn-primary btn-sm" onClick={() => openAuth('login')} type="button">Sign In</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openAuth('register')} type="button">Register</button>
                </>}
                <button className="logout-btn" onClick={handleLogout} type="button" title={isGuest ? 'Start a new guest session' : 'Sign Out'}>
                  <LogOut size={16} /> {isGuest ? 'New Guest' : 'Sign Out'}
                </button>
              </>
            )}
          </div>
        </header>

        {isGuest && (
          <div className="guest-banner">
            <AlertCircle size={18} />
            <span>You are using a private guest workspace. All learning tools work now; <strong>register or sign in</strong> if you want a personal account.</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openAuth('register')}>Create Account</button>
          </div>
        )}

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
                <button className="btn btn-primary" onClick={() => goToTab('roadmap')}>
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
                <button className="btn btn-secondary" onClick={() => goToTab('chat')}>
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
                <button className="btn btn-secondary" onClick={() => goToTab('ats')}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 className="page-title"><Compass style={{ color: 'var(--accent-primary)' }} /> AI Roadmap Generator</h1>
                  <p className="page-desc">Build your personalized week-by-week AI/ML curriculum and tick off work as you complete it.</p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowRoadmapHistory(!showRoadmapHistory); if (!showRoadmapHistory) fetchRoadmapHistory(); }}>
                  <History size={16} /> {showRoadmapHistory ? 'Hide Roadmap History' : `Roadmap History (${roadmapHistory.length})`}
                </button>
              </div>
            </div>

            {showRoadmapHistory && (
              <div className="form-card history-panel">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} color="var(--accent-primary)" /> Saved Roadmaps
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Select a previous roadmap to continue its checklist.</p>
                {roadmapHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No saved roadmaps yet.</p>
                ) : (
                  <div className="history-list">
                    {roadmapHistory.map((savedRoadmap) => {
                      const completed = savedRoadmap.items.filter((item) => item.is_completed).length;
                      return (
                        <button key={savedRoadmap.id} type="button" className="history-item" onClick={() => { setRoadmap(savedRoadmap); setShowRoadmapHistory(false); }}>
                          <div className="history-item-score" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>{completed}/{savedRoadmap.items.length}</div>
                          <div className="history-item-body">
                            <div className="history-item-title">{savedRoadmap.goal}</div>
                            <div className="history-item-preview">{savedRoadmap.level} · {savedRoadmap.hours_per_week} hrs/week</div>
                            <div className="history-item-date">Created {formatHistoryDate(savedRoadmap.created_at)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
            <input 
              type="file" 
              ref={resumePdfInputRef} 
              accept=".pdf,.txt" 
              onChange={handleResumePdfUpload} 
              style={{ display: 'none' }} 
            />

            <div className="page-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 className="page-title"><FileText style={{ color: 'var(--accent-emerald)' }} /> AI/ML ATS Resume Scorer</h1>
                  <p className="page-desc">Upload your resume PDF and paste the job description. TF-IDF cosine similarity, keyword coverage, and AI/ML skill matching power your eligibility score.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchResumeHistory(); }}
                >
                  <History size={16} /> {showHistory ? 'Hide History' : `Scan History (${resumeHistory.length})`}
                </button>
              </div>
            </div>

            {/* Resume Scan History Panel */}
            {showHistory && (
              <div className="form-card history-panel">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} color="var(--accent-primary)" /> Your Resume Scan History
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Saved securely to your account while signed in. History is cleared when you sign out without an account.
                </p>
                {historyLoading ? (
                  <div className="skeleton skeleton-card" style={{ height: '80px' }} />
                ) : resumeHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>
                    No resume scans yet. Run your first ATS analysis below.
                  </p>
                ) : (
                  <div className="history-list">
                    {resumeHistory.map((scan) => (
                      <div key={scan.id} className="history-item" onClick={() => loadHistoryScan(scan.id)}>
                        <div className="history-item-score" style={{
                          background: scan.ats_score >= 75 ? 'rgba(16,185,129,0.15)' : scan.ats_score >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
                          color: scan.ats_score >= 75 ? 'var(--accent-emerald)' : scan.ats_score >= 50 ? 'var(--accent-amber)' : '#fda4af',
                        }}>
                          {scan.ats_score}%
                        </div>
                        <div className="history-item-body">
                          <div className="history-item-title">
                            {scan.eligibility_emoji} {scan.eligibility || (scan.ats_score >= 75 ? 'Highly Eligible' : scan.ats_score >= 50 ? 'Moderately Eligible' : 'Low Compatibility')}
                          </div>
                          <div className="history-item-preview">{scan.job_preview || 'General AI/ML role'}…</div>
                          <div className="history-item-date">{formatHistoryDate(scan.created_at)}</div>
                        </div>
                        <button
                          type="button"
                          className="history-delete-btn"
                          onClick={(e) => deleteHistoryScan(scan.id, e)}
                          title="Delete scan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {resumeError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {resumeError}
              </div>
            )}

            <div className="form-card">
              <form onSubmit={handleScoreResume}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Resume (PDF or TXT)</label>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => resumePdfInputRef.current?.click()}
                      disabled={pdfUploading}
                    >
                      {pdfUploading ? <><RefreshCw className="spin" size={14} /> Extracting PDF...</> : <><Upload size={14} /> Upload Resume PDF</>}
                    </button>
                  </div>
                  {uploadedFileName && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
                      ✓ Loaded: {uploadedFileName}
                    </p>
                  )}
                  <textarea 
                    className="form-textarea"
                    placeholder="Paste resume text here, or upload a PDF above..."
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Job Description (Required for TF-IDF Matching)</label>
                  <textarea 
                    className="form-textarea"
                    style={{ minHeight: '120px' }}
                    placeholder="Paste the full job posting — required skills, responsibilities, and qualifications..."
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={resumeLoading || pdfUploading || !resumeText.trim() || !jobDescription.trim()}>
                  {resumeLoading ? <><RefreshCw className="spin" size={16} /> Running TF-IDF Analysis...</> : <><Sparkles size={16} /> Score Eligibility with AI/ML ATS</>}
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
              <div id="ats-pdf-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="score-gauge-card" style={{ flex: 1, margin: 0, '--score-pct': resumeResult.ats_score || 0 }}>
                    <div className="score-circle">
                      {resumeResult.ats_score || 0}%
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        Eligibility: {resumeResult.ats_score || 0}/100
                        <span className="week-badge" style={{ background: (resumeResult.ats_score >= 75 ? 'rgba(16, 185, 129, 0.2)' : resumeResult.ats_score >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.2)'), color: (resumeResult.ats_score >= 75 ? 'var(--accent-emerald)' : resumeResult.ats_score >= 50 ? 'var(--accent-amber)' : '#fda4af') }}>
                          {resumeResult.feedback_json?.eligibility_emoji || ''} {resumeResult.feedback_json?.eligibility || (resumeResult.ats_score >= 75 ? 'Highly Eligible' : resumeResult.ats_score >= 50 ? 'Moderately Eligible' : 'Low Compatibility')}
                        </span>
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {resumeResult.feedback_json?.summary || 'Scored using TF-IDF cosine similarity and keyword coverage.'}
                      </p>
                    </div>
                  </div>

                  <button type="button" className="btn btn-secondary" onClick={handleExportATSResultPDF}>
                    <Download size={16} /> Save Results PDF
                  </button>
                </div>

                {resumeResult.feedback_json?.ml_breakdown && (
                  <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={18} color="var(--accent-indigo)" /> ML Algorithm Breakdown
                    </h3>
                    <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                      <div className="stat-card">
                        <div className="stat-value">{resumeResult.feedback_json.ml_breakdown.tfidf_cosine_similarity}%</div>
                        <div className="stat-label">TF-IDF Similarity</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{resumeResult.feedback_json.ml_breakdown.keyword_coverage_pct}%</div>
                        <div className="stat-label">Keyword Coverage</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{resumeResult.feedback_json.ml_breakdown.aiml_skills_found}</div>
                        <div className="stat-label">AI/ML Skills Found</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{resumeResult.feedback_json.ml_breakdown.section_completeness_pct}%</div>
                        <div className="stat-label">Section Completeness</div>
                      </div>
                    </div>
                    {resumeResult.feedback_json.scoring_method && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Method: {resumeResult.feedback_json.scoring_method}
                      </p>
                    )}
                  </div>
                )}

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

        <footer className="app-footer">
          <p><strong>PathAI</strong> — Final Project · ACT AI Course · Government of Pakistan</p>
          <p className="app-footer-sub">Full-stack AI/ML learning platform with JWT auth, PostgreSQL persistence, and OpenRouter intelligence</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
