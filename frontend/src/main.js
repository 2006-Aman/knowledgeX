import { renderTopNav } from './components/topNav.js';
import { renderLeftSidebar } from './components/leftSidebar.js';
import { renderChatPanel } from './components/chatPanel.js';
import { renderDocumentsView } from './components/documentsView.js';
import { renderDocumentModal } from './components/documentModal.js';
import { showToast, showConfirmDialog, showPromptDialog } from './components/toast.js';
import { renderAllDiagrams } from './components/diagramRenderer.js';
import { renderAuthView, initConstellationCanvas } from './components/authView.js';
import { renderDashboardView, initDashboardAnimations } from './components/dashboardView.js';

// ── USER-SCOPED STORAGE KEYS & CONVERSATION HELPERS ──
function getUserConversationsKey(user) {
  if (!user || (!user.id && !user.email)) return 'knowledgex_conversations_guest';
  return `knowledgex_conversations_user_${user.id || user.email}`;
}

function createInitialGreetingMessage(userName = '') {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const greeting = userName ? `Hello ${userName}! This is KnowledgeX, how can I help you?` : 'Hello! This is KnowledgeX, how can I help you?';
  return {
    role: 'assistant',
    isGreeting: true,
    answer: greeting,
    explanation: 'KnowledgeX is your AI intelligence assistant powered by Azure OpenAI and Supabase Vector Knowledge Base. How can I help you today?',
    timestamp: timeStr
  };
}

function createNewConversation(title = 'New Consultation', userName = '') {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title,
    time: timeStr,
    messages: [createInitialGreetingMessage(userName)]
  };
}

// Helper to safely load stored conversations exclusively for the given user
function loadSavedConversations(user) {
  try {
    const key = getUserConversationsKey(user);
    const legacyKey = key.replace('knowledgex_', 'consultai_');
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage conversations:', e);
  }
  const userName = user ? user.name : '';
  return [createNewConversation('New Consultation', userName)];
}

// Helper to safely load authenticated user from Supabase session
function loadSavedUser() {
  try {
    const saved = localStorage.getItem('knowledgex_auth_user') || localStorage.getItem('consultai_auth_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

// Purge legacy un-scoped conversations to prevent generic chat leakage
try {
  localStorage.removeItem('knowledgex_conversations');
  localStorage.removeItem('consultai_conversations');
} catch (e) {}

// ── GLOBAL APPLICATION STATE ──
const savedUser = loadSavedUser();
const state = {
  user: savedUser,
  authMode: 'login', // 'login' | 'signup'
  authPrefillEmail: '',
  isAuthLoading: false,
  activeTab: 'dashboard', // Strictly starts with Dashboard page
  activeConvId: '',
  searchQuery: '',
  isStreaming: false,
  isUploadingDoc: false,
  workflowState: {
    status: 'Completed',
    total_duration: '1s'
  },
  referencedDocs: [],
  documentsList: [],
  conversations: loadSavedConversations(savedUser),
  docModal: {
    isOpen: false,
    filename: '',
    chunks_count: undefined,
    content: '',
    fullContent: '',
    isLoading: false,
    error: null
  }
};

// Ensure site opens on a fresh user-scoped chat with greeting
let freshConv = state.conversations.find(c => c.messages.filter(m => m.role === 'user').length === 0);
if (!freshConv) {
  freshConv = createNewConversation('New Consultation', state.user ? state.user.name : '');
  state.conversations.unshift(freshConv);
}
state.activeConvId = freshConv.id;

// Background sync to Supabase Cloud Database for logged-in user
let syncTimeout = null;
function persistConversations() {
  try {
    const key = getUserConversationsKey(state.user);
    localStorage.setItem(key, JSON.stringify(state.conversations));
  } catch (e) {
    console.error('Failed to save conversations to localStorage:', e);
  }

  // Cloud sync to Supabase if user is logged in
  if (state.user && state.user.id) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        await fetch('/api/auth/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: state.user.id,
            conversations: state.conversations
          })
        });
      } catch (err) {
        console.error('Failed to sync conversations to Supabase:', err);
      }
    }, 800);
  }
}

// Fetch user's conversations from Supabase cloud database
async function fetchUserConversationsFromSupabase(user) {
  if (!user || !user.id) return;
  try {
    const res = await fetch(`/api/auth/conversations?user_id=${encodeURIComponent(user.id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.conversations && Array.isArray(data.conversations) && data.conversations.length > 0) {
        state.conversations = data.conversations;
        const key = getUserConversationsKey(user);
        localStorage.setItem(key, JSON.stringify(data.conversations));
        if (!state.conversations.find(c => c.id === state.activeConvId)) {
          state.activeConvId = state.conversations[0].id;
        }
        renderApp();
      }
    }
  } catch (err) {
    console.error('Failed to fetch user conversations from Supabase:', err);
  }
}

if (savedUser) {
  fetchUserConversationsFromSupabase(savedUser);
}

// ── GET EFFECTIVE USER ID FOR USER DATA ISOLATION ──
function getEffectiveUserId() {
  if (state.user && state.user.id) {
    return state.user.id;
  }
  let guestId = localStorage.getItem('knowledgex_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('knowledgex_guest_id', guestId);
  }
  return guestId;
}

// ── FETCH DOCUMENTS FROM SUPABASE (PERSISTENCE ON RELOAD) ──
async function fetchDocuments() {
  try {
    const userId = getEffectiveUserId();
    const res = await fetch(`/api/documents?user_id=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const docs = await res.json();
      state.documentsList = docs || [];
      // If we have documents and no referencedDocs yet, set the top document
      if (state.documentsList.length > 0) {
        if (state.referencedDocs.length === 0) {
          state.referencedDocs = state.documentsList.slice(0, 1).map(d => ({
            name: d.name,
            description: 'Available in knowledge base'
          }));
        }
      } else {
        state.referencedDocs = [];
      }
      renderApp();
    }
  } catch (err) {
    console.warn('Could not fetch documents from Supabase:', err);
  }
}

// ── OPEN DOCUMENT VIEWER MODAL ──
async function openDocumentViewer(docName) {
  if (!docName) return;

  state.docModal = {
    isOpen: true,
    filename: docName,
    chunks_count: undefined,
    content: '',
    fullContent: '',
    isLoading: true,
    error: null
  };
  renderApp();

  try {
    const userId = getEffectiveUserId();
    const res = await fetch(`/api/documents/${encodeURIComponent(docName)}/content?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}`);
    }
    const data = await res.json();
    state.docModal.isLoading = false;
    state.docModal.chunks_count = data.chunks_count;
    state.docModal.content = data.content || 'No text found.';
    state.docModal.fullContent = data.content || '';
  } catch (err) {
    console.error('Error fetching document content:', err);
    state.docModal.isLoading = false;
    state.docModal.error = `Failed to load document content: ${err.message}`;
  }
  renderApp();
}

function closeDocumentViewer() {
  state.docModal.isOpen = false;
  renderApp();
}

// ── UPLOAD DOCUMENT / IMAGE HANDLER (FOR DROPZONE AND CHAT ATTACH) ──
async function handlePdfUpload(file) {
  if (!file) return;
  const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp'];
  const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  if (!hasValidExt) {
    showToast({
      title: 'Invalid File Format',
      message: 'Supported formats are PDF documents and images (PNG, JPG, JPEG, WEBP).',
      type: 'warning'
    });
    return;
  }

  const MAX_FILE_SIZE_MB = 4.5;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    showToast({
      title: 'File Exceeds 4.5 MB Limit',
      message: `"${file.name}" is ${sizeMB} MB. Serverless upload limit is 4.5 MB. Please compress your PDF before uploading.`,
      type: 'warning',
      duration: 8000
    });
    return;
  }

  state.isUploadingDoc = true;
  renderApp();

  const dismissLoading = showToast({
    title: 'Indexing Document',
    message: `Uploading "${file.name}" and extracting vector embeddings...`,
    type: 'loading',
    duration: 0
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', getEffectiveUserId());

  try {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('File size exceeds serverless limit (max 4.5 MB). Please compress the PDF.');
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Upload failed with status ${res.status}`);
    }

    const result = await res.json();
    await fetchDocuments();

    state.referencedDocs = [{
      name: file.name,
      description: 'Used for answer generation'
    }];

    dismissLoading();
    showToast({
      title: 'Document Indexed Successfully! 🎉',
      message: `"${file.name}" was indexed into Supabase with ${result.chunks_indexed || 1} vector chunks and is now ready for questioning.`,
      type: 'success',
      duration: 5000
    });
  } catch (err) {
    console.error('Upload error:', err);
    dismissLoading();
    showToast({
      title: 'Upload Failed',
      message: err.message || 'Could not process and index document.',
      type: 'error',
      duration: 6000
    });
  } finally {
    state.isUploadingDoc = false;
    renderApp();
  }
}

// ── DELETE SINGLE DOCUMENT HANDLER ──
async function handleDeleteDocument(docName) {
  if (!docName) return;

  showConfirmDialog({
    title: 'Delete Document',
    message: `Are you sure you want to remove "${docName}" and all its vector embeddings from Supabase?`,
    confirmText: 'Delete Document',
    cancelText: 'Cancel',
    isDanger: true,
    onConfirm: async () => {
      try {
        const userId = getEffectiveUserId();
        const res = await fetch(`/api/documents/${encodeURIComponent(docName)}?user_id=${encodeURIComponent(userId)}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          throw new Error(`Failed to delete document (${res.status})`);
        }
        await fetchDocuments();
        state.referencedDocs = state.referencedDocs.filter(d => d.name !== docName);
        renderApp();
        showToast({
          title: 'Document Removed',
          message: `"${docName}" was successfully deleted from Supabase.`,
          type: 'info'
        });
      } catch (err) {
        console.error('Delete document error:', err);
        showToast({
          title: 'Delete Error',
          message: `Could not delete document: ${err.message}`,
          type: 'error'
        });
      }
    }
  });
}

// ── PURGE ALL DOCUMENTS HANDLER ──
async function handlePurgeDocuments() {
  showConfirmDialog({
    title: 'Purge Entire Knowledge Base',
    message: 'Are you sure you want to PURGE ALL documents and vector embeddings from Supabase? This action is irreversible.',
    confirmText: 'Purge Everything',
    cancelText: 'Cancel',
    isDanger: true,
    onConfirm: async () => {
      try {
        const userId = getEffectiveUserId();
        const res = await fetch(`/api/documents/purge?user_id=${encodeURIComponent(userId)}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          throw new Error(`Purge request failed (${res.status})`);
        }
        state.documentsList = [];
        state.referencedDocs = [];
        renderApp();
        showToast({
          title: 'Knowledge Base Purged',
          message: 'All documents and vector embeddings have been successfully cleared from Supabase.',
          type: 'info'
        });
      } catch (err) {
        console.error('Purge error:', err);
        showToast({
          title: 'Purge Error',
          message: `Failed to purge vector database: ${err.message}`,
          type: 'error'
        });
      }
    }
  });
}

// ── HELPER: BEST MATCHING CONVERSATION SEARCH ──
function findBestMatchingConversation(query, conversations) {
  if (!query || !conversations || conversations.length === 0) return null;
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(w => w.length > 0);

  let bestConv = null;
  let highestScore = -1;

  for (const conv of conversations) {
    const title = (conv.title || '').toLowerCase().trim();
    let score = 0;

    // 1. Exact match with title (case-insensitive)
    if (title === q) {
      score = 1000;
    } 
    // 2. Title starts with query
    else if (title.startsWith(q)) {
      score = 600 + Math.min(100, Math.floor((q.length / title.length) * 100));
    } 
    // 3. Title contains full query string
    else if (title.includes(q)) {
      score = 400 + Math.min(100, Math.floor((q.length / title.length) * 100));
    } 
    // 4. Word-by-word title matching
    else {
      let matchedCount = 0;
      for (const word of qWords) {
        if (title.includes(word)) {
          matchedCount++;
        }
      }
      if (matchedCount > 0) {
        score = 200 + (matchedCount / qWords.length) * 150;
      }
    }

    // 5. If title didn't match well or at all, search inside messages (content, answer, explanation)
    if (score < 200 && conv.messages && conv.messages.length > 0) {
      for (const m of conv.messages) {
        const text = `${m.content || ''} ${m.answer || ''} ${m.explanation || ''}`.toLowerCase();
        if (text.includes(q)) {
          score = Math.max(score, 100);
          break;
        } else {
          // Check if any query word appears in messages
          for (const word of qWords) {
            if (word.length > 2 && text.includes(word)) {
              score = Math.max(score, 50);
              break;
            }
          }
        }
      }
    }

    if (score > highestScore && score > 0) {
      highestScore = score;
      bestConv = conv;
    }
  }

  return bestConv;
}

// ── DOM MOUNT & RENDER FUNCTION ──
function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  // Teardown dashboard animations if not on dashboard
  if (state.activeTab !== 'dashboard' && window._teardownDashboard) {
    window._teardownDashboard();
    window._teardownDashboard = null;
  }

  // 1. Render full-screen interactive Auth View if activeTab is 'auth'
  if (state.activeTab === 'auth') {
    if (window._teardownDashboard) {
      window._teardownDashboard();
      window._teardownDashboard = null;
    }
    app.innerHTML = renderAuthView(state.authMode, state.isAuthLoading, state.authPrefillEmail);
    attachAuthEventListeners();
    initConstellationCanvas();
    return;
  }

  const currentConv = state.conversations.find(c => c.id === state.activeConvId) || state.conversations[0];

  let mainContentHtml = '';

  if (state.activeTab === 'chat' || state.activeTab === 'home') {
    mainContentHtml = `
      <div class="workspace-columns full-chat-layout">
        ${renderChatPanel(currentConv ? currentConv.messages : [], state.isStreaming)}
      </div>
    `;
  } else if (state.activeTab === 'documents') {
    mainContentHtml = renderDocumentsView(state.documentsList, state.isUploadingDoc);
  } else if (state.activeTab === 'dashboard') {
    mainContentHtml = renderDashboardView(state.documentsList, state.workflowState, state.user);
  }

  app.innerHTML = `
    ${renderLeftSidebar(state.conversations, state.activeConvId, state.activeTab, state.user)}
    <div class="app-main-content">
      ${renderTopNav(state.searchQuery, state.user)}
      <div class="app-body-container">
        ${mainContentHtml}
      </div>
    </div>
    ${renderDocumentModal(state.docModal)}
  `;

  attachEventListeners();
  renderAllDiagrams(app);

  if (state.activeTab === 'dashboard') {
    window._teardownDashboard = initDashboardAnimations({
      onOpenKnowledgeX: () => {
        state.activeTab = 'chat';
        renderApp();
      }
    });
  }
}

// ── AUTHENTICATION EVENT LISTENERS ──
function attachAuthEventListeners() {
  const tabLogin = document.getElementById('btn-tab-login');
  const tabSignup = document.getElementById('btn-tab-signup');
  if (tabLogin) {
    tabLogin.addEventListener('click', () => {
      if (state.authMode !== 'login') {
        state.authMode = 'login';
        renderApp();
      }
    });
  }
  if (tabSignup) {
    tabSignup.addEventListener('click', () => {
      if (state.authMode !== 'signup') {
        state.authMode = 'signup';
        renderApp();
      }
    });
  }

  const togglePwd = document.getElementById('btn-toggle-password');
  const pwdInput = document.getElementById('auth-password');
  if (togglePwd && pwdInput) {
    togglePwd.addEventListener('click', () => {
      pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    });
  }

  const btnGuest = document.getElementById('btn-auth-guest');
  if (btnGuest) {
    btnGuest.addEventListener('click', () => {
      state.user = null;
      state.conversations = loadSavedConversations(null);
      let freshConv = state.conversations.find(c => c.messages.filter(m => m.role === 'user').length === 0);
      if (!freshConv) {
        freshConv = createNewConversation('New Consultation');
        state.conversations.unshift(freshConv);
      }
      state.activeConvId = freshConv.id;
      persistConversations();
      state.activeTab = 'chat';
      renderApp();
    });
  }

  const btnBackDash = document.getElementById('btn-auth-back-dashboard');
  if (btnBackDash) {
    btnBackDash.addEventListener('click', () => {
      state.activeTab = 'dashboard';
      renderApp();
    });
  }

  const btnForgot = document.getElementById('btn-forgot-password');
  if (btnForgot) {
    btnForgot.addEventListener('click', () => {
      showToast({
        title: 'Password Recovery',
        message: 'Password recovery links are dispatched through your registered Supabase email.',
        type: 'info'
      });
    });
  }

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (state.isAuthLoading) return;

      const emailInput = document.getElementById('auth-email');
      const pwdInput = document.getElementById('auth-password');
      const nameInput = document.getElementById('auth-name');
      const confirmPwdInput = document.getElementById('auth-confirm-password');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = pwdInput ? pwdInput.value.trim() : '';

      if (state.authMode === 'signup') {
        const name = nameInput ? nameInput.value.trim() : '';
        const confirmPassword = confirmPwdInput ? confirmPwdInput.value.trim() : '';

        if (!name) {
          showToast({ title: 'Validation Error', message: 'Please enter your full name.', type: 'error' });
          return;
        }
        if (password !== confirmPassword) {
          showToast({ title: 'Validation Error', message: 'Passwords do not match. Please re-enter.', type: 'error' });
          return;
        }
        if (password.length < 6) {
          showToast({ title: 'Validation Error', message: 'Password must be at least 6 characters.', type: 'error' });
          return;
        }

        state.isAuthLoading = true;
        renderApp();

        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Sign up failed.');
          }

          // Registration successful! Do NOT open chatbot yet.
          // Switch to login tab so user must authenticate first.
          state.isAuthLoading = false;
          state.authMode = 'login';
          state.authPrefillEmail = email;

          showToast({
            title: 'Account Created Successfully!',
            message: `Welcome, ${data.user.name || email}! Your account has been registered in Supabase. Please sign in with your password to continue.`,
            type: 'success'
          });
          renderApp();
        } catch (err) {
          state.isAuthLoading = false;
          renderApp();
          showToast({
            title: 'Sign Up Error',
            message: err.message || 'Unable to register account in Supabase.',
            type: 'error'
          });
        }
      } else {
        // Sign In mode
        state.isAuthLoading = true;
        renderApp();

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Login failed.');
          }

          state.user = data.user;
          localStorage.setItem('knowledgex_auth_user', JSON.stringify(data.user));
          localStorage.setItem('knowledgex_auth_token', data.token);

          // Load ONLY this user's conversations
          state.conversations = loadSavedConversations(data.user);
          let freshConv = state.conversations.find(c => c.messages.filter(m => m.role === 'user').length === 0);
          if (!freshConv) {
            freshConv = createNewConversation('New Consultation', data.user.name);
            state.conversations.unshift(freshConv);
          }
          state.activeConvId = freshConv.id;
          persistConversations();
          fetchUserConversationsFromSupabase(data.user);
          fetchDocuments();

          state.isAuthLoading = false;
          state.activeTab = 'chat';

          showToast({
            title: 'Welcome Back!',
            message: `Signed in as ${data.user.name}.`,
            type: 'success'
          });
          renderApp();
        } catch (err) {
          state.isAuthLoading = false;
          renderApp();
          showToast({
            title: 'Login Error',
            message: err.message || 'Invalid credentials.',
            type: 'error'
          });
        }
      }
    });
  }
}

// ── EVENT LISTENERS ATTACHMENT ──
function attachEventListeners() {
  // 1. Sidebar Nav Tab Switching
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tab = e.currentTarget.getAttribute('data-nav-tab');
      if (tab === 'chat') {
        const currentConv = state.conversations.find(c => c.id === state.activeConvId);
        const hasUserMsgs = currentConv && currentConv.messages.some(m => m.role === 'user');
        if (hasUserMsgs) {
          const newConv = createNewConversation('New Consultation');
          state.conversations.unshift(newConv);
          state.activeConvId = newConv.id;
          persistConversations();
        }
        state.activeTab = 'chat';
        renderApp();
        return;
      }
      if (tab && state.activeTab !== tab) {
        state.activeTab = tab;
        if (tab === 'documents' || tab === 'dashboard') {
          await fetchDocuments();
        }
        renderApp();
      }
    });
  });

  // 1a. Top Navigation Dashboard Trigger
  const btnTopDashboard = document.getElementById('btn-top-dashboard');
  if (btnTopDashboard) {
    btnTopDashboard.addEventListener('click', async () => {
      if (state.activeTab !== 'dashboard') {
        state.activeTab = 'dashboard';
        await fetchDocuments();
        renderApp();
      }
    });
  }

  // 1b. Sign In / Sign Up triggers
  const btnHeaderSignin = document.getElementById('btn-header-signin');
  if (btnHeaderSignin) {
    btnHeaderSignin.addEventListener('click', () => {
      state.activeTab = 'auth';
      state.authMode = 'login';
      renderApp();
    });
  }

  const btnSidebarSignin = document.getElementById('btn-sidebar-signin');
  if (btnSidebarSignin) {
    btnSidebarSignin.addEventListener('click', () => {
      state.activeTab = 'auth';
      state.authMode = 'login';
      renderApp();
    });
  }

  // 1c. User Profile Dropdown Toggle
  const btnUserProfile = document.getElementById('btn-user-profile');
  const userDropdown = document.getElementById('user-profile-dropdown');
  if (btnUserProfile && userDropdown) {
    btnUserProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      if (userDropdown) userDropdown.style.display = 'none';
    });
  }

  // 1d. Logout Actions
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    state.user = null;
    localStorage.removeItem('knowledgex_auth_user');
    localStorage.removeItem('knowledgex_auth_token');
    localStorage.removeItem('consultai_auth_user');
    localStorage.removeItem('consultai_auth_token');

    // Reset conversations to guest
    state.conversations = loadSavedConversations(null);
    let freshConv = state.conversations.find(c => c.messages.filter(m => m.role === 'user').length === 0);
    if (!freshConv) {
      freshConv = createNewConversation('New Consultation');
      state.conversations.unshift(freshConv);
    }
    state.activeConvId = freshConv.id;
    fetchDocuments();

    state.activeTab = 'dashboard';
    state.authMode = 'login';
    showToast({
      title: 'Signed Out',
      message: 'You have been safely signed out.',
      type: 'info'
    });
    renderApp();
  };

  const btnHeaderLogout = document.getElementById('btn-header-logout');
  if (btnHeaderLogout) {
    btnHeaderLogout.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLogout();
    });
  }

  const btnSidebarLogout = document.getElementById('btn-sidebar-logout');
  if (btnSidebarLogout) {
    btnSidebarLogout.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLogout();
    });
  }

  // 3. Conversation row selection
  document.querySelectorAll('.conversation-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.btn-conv-dots') || e.target.closest('.conv-dropdown-menu')) {
        return;
      }
      const convId = row.getAttribute('data-conv-id');
      if (convId && (state.activeConvId !== convId || state.activeTab !== 'chat')) {
        state.activeConvId = convId;
        state.activeTab = 'chat';
        renderApp();
      }
    });
  });

  // 4. 3-Dots Menu Button Toggle
  document.querySelectorAll('.btn-conv-dots').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dotsId = btn.getAttribute('data-dots-id');
      const menu = document.getElementById(`dropdown-${dotsId}`);
      
      document.querySelectorAll('.conv-dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });

      if (menu) {
        menu.classList.toggle('show');
      }
    });
  });

  // 5. Rename Chat Action
  document.querySelectorAll('.dropdown-item-rename').forEach(renameBtn => {
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const convId = renameBtn.getAttribute('data-rename-conv-id');
      const conv = state.conversations.find(c => c.id === convId);
      if (!conv) return;

      document.querySelectorAll('.conv-dropdown-menu.show').forEach(m => m.classList.remove('show'));

      showPromptDialog({
        title: 'Rename Chat',
        message: 'Enter a new title for this conversation:',
        defaultValue: conv.title || '',
        placeholder: 'Chat title...',
        confirmText: 'Save',
        cancelText: 'Cancel',
        onConfirm: (newTitle) => {
          if (newTitle && newTitle.trim() && newTitle.trim() !== conv.title) {
            conv.title = newTitle.trim();
            persistConversations();
            renderApp();
            showToast({
              title: 'Chat Renamed',
              message: `Renamed to "${conv.title}"`,
              type: 'success',
              duration: 3000
            });
          }
        }
      });
    });
  });

  // 6. Delete Chat Click Action
  document.querySelectorAll('.dropdown-item-delete').forEach(delBtn => {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const convIdToDelete = delBtn.getAttribute('data-delete-conv-id');
      if (!convIdToDelete) return;

      const idx = state.conversations.findIndex(c => c.id === convIdToDelete);
      if (idx !== -1) {
        state.conversations.splice(idx, 1);

        if (state.conversations.length === 0) {
          const fresh = createNewConversation('New Consultation');
          state.conversations.push(fresh);
          state.activeConvId = fresh.id;
        } else if (state.activeConvId === convIdToDelete) {
          const nextConv = state.conversations[Math.min(idx, state.conversations.length - 1)];
          state.activeConvId = nextConv.id;
        }

        persistConversations();
        renderApp();
      }
    });
  });

  // 6. Close 3-dots dropdown when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.conv-dropdown-menu.show').forEach(m => m.classList.remove('show'));
  });

  // 7. Chat submission handler
  const chatInput = document.getElementById('chat-user-input');
  const btnSend = document.getElementById('btn-send-message');

  const executeSendMessage = async (userText) => {
    const text = (userText || (chatInput ? chatInput.value : '')).trim();
    if (!text || state.isStreaming) return;

    let currentConv = state.conversations.find(c => c.id === state.activeConvId);
    if (!currentConv) {
      currentConv = state.conversations[0];
      state.activeConvId = currentConv.id;
    }

    if (currentConv.messages.filter(m => m.role === 'user').length === 0) {
      currentConv.title = text.length > 26 ? text.substring(0, 26) + '…' : text;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentConv.messages.push({
      role: 'user',
      content: text,
      timestamp: timeStr
    });

    if (chatInput) chatInput.value = '';
    state.isStreaming = true;
    persistConversations();
    renderApp();

    try {
      const historyPayload = currentConv.messages
        .filter(m => !m.isGreeting)
        .slice(-8)
        .map(m => ({
          role: m.role,
          content: m.role === 'assistant' ? `${m.answer || ''}\n${m.explanation || ''}`.trim() : (m.content || ''),
          answer: m.answer,
        explanation: m.explanation
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: currentConv.id,
          message: text,
          history: historyPayload,
          user_id: getEffectiveUserId()
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      currentConv.messages.push({
        role: 'assistant',
        answer: data.answer,
        explanation: data.explanation,
        sources: data.sources || [],
        duration: data.duration || '2s',
        timestamp: data.timestamp || timeStr
      });

      if (data.sources && data.sources.length > 0) {
        state.referencedDocs = data.sources;
      } else {
        state.referencedDocs = [];
      }
      if (data.duration) {
        state.workflowState.total_duration = data.duration;
      }
    } catch (err) {
      console.error("Chat error:", err);
      currentConv.messages.push({
        role: 'assistant',
        answer: `Direct response generated for your query.`,
        explanation: `We encountered a communication delay with the backend API. Please verify the server is active at port 8000. You can click 'Regenerate' below to retry.`,
        sources: [],
        duration: '1s',
        timestamp: timeStr
      });
    } finally {
      state.isStreaming = false;
      persistConversations();
      renderApp();
    }
  };

  if (btnSend && chatInput) {
    btnSend.addEventListener('click', () => executeSendMessage());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSendMessage();
      }
    });
  }

  // 8. Quick suggestion chips click
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const promptText = e.currentTarget.getAttribute('data-prompt');
      if (promptText) {
        executeSendMessage(promptText);
      }
    });
  });

  // 9. Banner feature cards click
  document.querySelectorAll('.banner-feature-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const promptText = e.currentTarget.getAttribute('data-prompt');
      if (promptText) {
        executeSendMessage(promptText);
      }
    });
  });

  // 10. Regenerate response buttons (attached to all assistant message cards)
  document.querySelectorAll('.btn-regenerate').forEach(btnRegen => {
    btnRegen.addEventListener('click', async (e) => {
      if (state.isStreaming) return;

      const currentConv = state.conversations.find(c => c.id === state.activeConvId);
      if (!currentConv || !currentConv.messages || currentConv.messages.length === 0) return;

      const idxStr = e.currentTarget.getAttribute('data-msg-idx');
      let targetIdx = idxStr !== null && idxStr !== undefined ? parseInt(idxStr, 10) : -1;

      // Validate targetIdx specifically points to an assistant message (never a user message or greeting)
      if (
        isNaN(targetIdx) || 
        targetIdx < 0 || 
        targetIdx >= currentConv.messages.length || 
        currentConv.messages[targetIdx].role !== 'assistant' ||
        currentConv.messages[targetIdx].isGreeting
      ) {
        // Fallback: search backwards for the last valid assistant message
        targetIdx = -1;
        for (let i = currentConv.messages.length - 1; i >= 0; i--) {
          if (currentConv.messages[i].role === 'assistant' && !currentConv.messages[i].isGreeting) {
            targetIdx = i;
            break;
          }
        }
      }

      if (targetIdx === -1) return;

      // Find the user query that preceded this assistant response
      let userQuery = '';
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (currentConv.messages[i].role === 'user') {
          userQuery = currentConv.messages[i].content;
          break;
        }
      }

      // Fallback to last user message if not immediately preceding
      if (!userQuery) {
        const lastUserMsg = [...currentConv.messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) userQuery = lastUserMsg.content;
      }

      if (!userQuery) return;

      // Check if this assistant message is from an older question or the last question in the chat
      const isLastQuestionInChat = !currentConv.messages.slice(targetIdx + 1).some(
        m => m.role === 'user' || (m.role === 'assistant' && !m.isGreeting)
      );

      // If clicked regenerate on a question asked before:
      // Return the question along with the regenerated answer at the bottom of the chat
      if (!isLastQuestionInChat) {
        executeSendMessage(userQuery);
        return;
      }

      // If it is the last question in the chat:
      // Change the answer in-place (like it's doing now)
      const insertIdx = targetIdx;
      currentConv.messages.splice(targetIdx, 1);

      state.isStreaming = true;
      persistConversations();
      renderApp();

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      try {
        const historyPayload = currentConv.messages
          .filter(m => !m.isGreeting)
          .slice(-8)
          .map(m => ({
            role: m.role,
            content: m.role === 'assistant' ? `${m.answer || ''}\n${m.explanation || ''}`.trim() : (m.content || ''),
            answer: m.answer,
            explanation: m.explanation
          }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: currentConv.id,
            message: userQuery,
            history: historyPayload,
            user_id: getEffectiveUserId()
          })
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        const newMsg = {
          role: 'assistant',
          answer: data.answer,
          explanation: data.explanation,
          sources: data.sources || [],
          duration: data.duration || '2s',
          timestamp: data.timestamp || timeStr
        };

        if (insertIdx >= 0 && insertIdx <= currentConv.messages.length) {
          currentConv.messages.splice(insertIdx, 0, newMsg);
        } else {
          currentConv.messages.push(newMsg);
        }

        if (data.sources && data.sources.length > 0) {
          state.referencedDocs = data.sources;
        } else {
          state.referencedDocs = [];
        }
        if (data.duration) {
          state.workflowState.total_duration = data.duration;
        }
      } catch (err) {
        console.error("Regenerate error:", err);
        const errCard = {
          role: 'assistant',
          answer: `Direct response generated for your query.`,
          explanation: `We encountered an issue regenerating this response. Please verify backend connectivity.`,
          sources: [],
          duration: '1s',
          timestamp: timeStr
        };
        if (insertIdx >= 0 && insertIdx <= currentConv.messages.length) {
          currentConv.messages.splice(insertIdx, 0, errCard);
        } else {
          currentConv.messages.push(errCard);
        }
      } finally {
        state.isStreaming = false;
        persistConversations();
        renderApp();
      }
    });
  });

  // Action button icons dictionary
  const ACTION_ICONS = {
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    likeOutline: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`,
    likeFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`,
    dislikeOutline: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>`,
    dislikeFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>`
  };

  // 11. Copy answer button: switches to tick icon and reverts
  document.querySelectorAll('.btn-copy').forEach(copyBtn => {
    copyBtn.addEventListener('click', (e) => {
      const copyText = e.currentTarget.getAttribute('data-copy-text');
      if (copyText) {
        navigator.clipboard.writeText(copyText);
        copyBtn.innerHTML = ACTION_ICONS.check;
        copyBtn.classList.add('copied');
        copyBtn.setAttribute('title', 'Copied!');
        setTimeout(() => {
          copyBtn.innerHTML = ACTION_ICONS.copy;
          copyBtn.classList.remove('copied');
          copyBtn.setAttribute('title', 'Copy');
        }, 2000);
      }
    });
  });

  // 11b. Copy code block button
  document.querySelectorAll('.btn-copy-code').forEach(codeCopyBtn => {
    codeCopyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = decodeURIComponent(codeCopyBtn.getAttribute('data-code') || '');
      if (code) {
        navigator.clipboard.writeText(code);
        const orig = codeCopyBtn.textContent;
        codeCopyBtn.textContent = '✓ Copied';
        codeCopyBtn.classList.add('copied');
        setTimeout(() => {
          codeCopyBtn.textContent = orig;
          codeCopyBtn.classList.remove('copied');
        }, 2000);
      }
    });
  });

  // 12. Like / Dislike buttons: switch between outline and filled icon with mutual exclusivity
  document.querySelectorAll('.assistant-actions-left').forEach(actionsWrap => {
    const likeBtn = actionsWrap.querySelector('.btn-like');
    const dislikeBtn = actionsWrap.querySelector('.btn-dislike');

    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        const isCurrentlyActive = likeBtn.classList.contains('active');
        if (isCurrentlyActive) {
          likeBtn.classList.remove('active');
          likeBtn.innerHTML = ACTION_ICONS.likeOutline;
          likeBtn.setAttribute('title', 'Helpful');
        } else {
          likeBtn.classList.add('active');
          likeBtn.innerHTML = ACTION_ICONS.likeFilled;
          likeBtn.setAttribute('title', 'Marked as helpful');
          if (dislikeBtn) {
            dislikeBtn.classList.remove('active');
            dislikeBtn.innerHTML = ACTION_ICONS.dislikeOutline;
            dislikeBtn.setAttribute('title', 'Not helpful');
          }
        }
      });
    }

    if (dislikeBtn) {
      dislikeBtn.addEventListener('click', () => {
        const isCurrentlyActive = dislikeBtn.classList.contains('active');
        if (isCurrentlyActive) {
          dislikeBtn.classList.remove('active');
          dislikeBtn.innerHTML = ACTION_ICONS.dislikeOutline;
          dislikeBtn.setAttribute('title', 'Not helpful');
        } else {
          dislikeBtn.classList.add('active');
          dislikeBtn.innerHTML = ACTION_ICONS.dislikeFilled;
          dislikeBtn.setAttribute('title', 'Marked as not helpful');
          if (likeBtn) {
            likeBtn.classList.remove('active');
            likeBtn.innerHTML = ACTION_ICONS.likeOutline;
            likeBtn.setAttribute('title', 'Helpful');
          }
        }
      });
    }
  });

  // 13. PDF File upload attachment in Chat input
  const btnAttach = document.getElementById('btn-attach-doc');
  const filePicker = document.getElementById('pdf-file-picker');
  if (btnAttach && filePicker) {
    btnAttach.addEventListener('click', () => filePicker.click());
    filePicker.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handlePdfUpload(file);
      e.target.value = '';
    });
  }

  // 14. Documents Tab: Top Dropzone Click & Drag/Drop
  const dropzone = document.getElementById('docs-tab-dropzone');
  const docsTabFileInput = document.getElementById('docs-tab-file-input');
  if (dropzone && docsTabFileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== docsTabFileInput) {
        docsTabFileInput.click();
      }
    });

    docsTabFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handlePdfUpload(file);
      e.target.value = '';
    });

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handlePdfUpload(e.dataTransfer.files[0]);
      }
    });
  }

  // 15. Document Open / View Click Listeners (both in documents view and workflow panel)
  document.querySelectorAll('.btn-view-doc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const docName = btn.getAttribute('data-doc-name');
      if (docName) {
        openDocumentViewer(docName);
      }
    });
  });

  // 16. Document Single Delete Click Listeners
  document.querySelectorAll('.btn-delete-single-doc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const docName = btn.getAttribute('data-doc-name');
      if (docName) {
        handleDeleteDocument(docName);
      }
    });
  });

  // 17. Purge Vector Store Button
  const btnPurge = document.getElementById('btn-purge-vector');
  if (btnPurge) {
    btnPurge.addEventListener('click', (e) => {
      e.preventDefault();
      handlePurgeDocuments();
    });
  }

  // 18. Sync / Refresh Documents Button
  const btnRefreshDocs = document.getElementById('btn-refresh-docs');
  if (btnRefreshDocs) {
    btnRefreshDocs.addEventListener('click', async (e) => {
      e.preventDefault();
      await fetchDocuments();
      renderApp();
    });
  }

  // 19. Link "Knowledge Base ->" in workflowPanel
  const linkViewAll = document.getElementById('link-view-all-docs');
  if (linkViewAll) {
    linkViewAll.addEventListener('click', async (e) => {
      e.preventDefault();
      state.activeTab = 'documents';
      await fetchDocuments();
      renderApp();
    });
  }

  // 20. Document Modal Listeners (Close, Copy, Search)
  const modalClose = document.getElementById('btn-modal-close');
  const modalCloseFooter = document.getElementById('btn-modal-close-footer');
  const modalBackdrop = document.getElementById('doc-modal-backdrop');
  if (modalClose) modalClose.addEventListener('click', closeDocumentViewer);
  if (modalCloseFooter) modalCloseFooter.addEventListener('click', closeDocumentViewer);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeDocumentViewer();
    });
  }

  const modalCopy = document.getElementById('btn-modal-copy-text');
  if (modalCopy && state.docModal.content) {
    modalCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(state.docModal.content);
      modalCopy.style.color = '#10B981';
      modalCopy.innerHTML = `<span>Copied!</span>`;
      setTimeout(() => {
        modalCopy.style.color = '';
        modalCopy.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy Text</span>
        `;
      }, 1500);
    });
  }

  const modalFilter = document.getElementById('doc-modal-filter-input');
  const modalTextEl = document.getElementById('doc-modal-text-content');
  if (modalFilter && modalTextEl) {
    modalFilter.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rawText = state.docModal.fullContent || '';
      if (!q) {
        modalTextEl.textContent = rawText;
        return;
      }
      // Highlight matches safely
      const parts = rawText.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      modalTextEl.innerHTML = parts.map(part => {
        if (part.toLowerCase() === q) {
          return `<mark style="background:#FEF08A;color:#854D0E;padding:0.1rem 0.2rem;border-radius:2px;">${part}</mark>`;
        }
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }).join('');
    });
  }

  // 21. Global search bar in top header: search chats & messages in real time
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    const applySearchFilter = (rawText) => {
      const query = (rawText || '').toLowerCase().trim();

      // Filter conversation rows in sidebar by title and messages
      document.querySelectorAll('.conversation-row').forEach(row => {
        if (!query) {
          row.style.display = 'flex';
          return;
        }
        const convId = row.getAttribute('data-conv-id');
        const conv = state.conversations.find(c => c.id === convId);
        const titleMatch = conv?.title?.toLowerCase().includes(query);
        const messageMatch = conv?.messages?.some(m =>
          (m.content && m.content.toLowerCase().includes(query)) ||
          (m.answer && m.answer.toLowerCase().includes(query)) ||
          (m.explanation && m.explanation.toLowerCase().includes(query))
        );
        row.style.display = (titleMatch || messageMatch) ? 'flex' : 'none';
      });
    };

    // Apply filter immediately if query exists from previous render
    if (state.searchQuery) {
      applySearchFilter(state.searchQuery);
    }

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      applySearchFilter(state.searchQuery);
    });

    // Enter key: jump directly to the most matching chat
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const rawQuery = searchInput.value.trim();
        if (!rawQuery) return;

        const matchedConv = findBestMatchingConversation(rawQuery, state.conversations);
        if (matchedConv) {
          state.activeConvId = matchedConv.id;
          state.activeTab = 'chat';
          state.searchQuery = ''; // Reset search filter so all chats are visible and font is untouched
          renderApp();
          showToast({
            title: 'Chat Found',
            message: `Switched to "${matchedConv.title}"`,
            type: 'info',
            duration: 2500
          });
          setTimeout(() => {
            const activeRow = document.querySelector(`.conversation-row[data-conv-id="${matchedConv.id}"]`);
            if (activeRow) {
              activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 60);
        } else {
          showToast({
            title: 'No Matching Chat',
            message: `No chats found matching "${rawQuery}"`,
            type: 'warning',
            duration: 2500
          });
        }
      } else if (e.key === 'Escape') {
        state.searchQuery = '';
        searchInput.value = '';
        applySearchFilter('');
        searchInput.blur();
      }
    });
  }

  // 22. Reset all conversations button
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Start Fresh Conversation',
        message: 'Are you sure you want to reset and start a fresh new conversation?',
        confirmText: 'Start New',
        cancelText: 'Cancel',
        onConfirm: () => {
          const key = getUserConversationsKey(state.user);
          localStorage.removeItem(key);
          const fresh = createNewConversation('New Consultation', state.user ? state.user.name : '');
          state.conversations = [fresh];
          state.activeConvId = fresh.id;
          persistConversations();
          state.activeTab = 'chat';
          renderApp();
          showToast({
            title: 'New Conversation Started',
            message: 'All previous local chats reset.',
            type: 'info'
          });
        }
      });
    });
  }

  // Scroll chat messages to bottom
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// Global keydown for Escape to close modal
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.docModal.isOpen) {
    closeDocumentViewer();
  }
});

// Initialize on DOM load
const initApp = async () => {
  await fetchDocuments();
  renderApp();
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
