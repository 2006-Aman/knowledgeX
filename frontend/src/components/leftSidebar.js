import { getMotionRobotHtml } from './motionRobot.js';

export function renderLeftSidebar(conversations, activeConvId, activeNavTab = 'chat', user = null) {
  const navItems = [
    {
      id: 'chat',
      label: 'New Chat',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    },
    {
      id: 'dashboard',
      label: 'System Dashboard',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`
    }
  ];

  return `
    <aside class="left-sidebar-panel">
      <!-- Brand Header -->
      <div class="sidebar-brand-header">
        <div class="brand-star-icon">
          ${getMotionRobotHtml(32)}
        </div>
        <div class="brand-text-wrap">
          <span class="brand-name">KnowledgeX</span>
          <span class="brand-tagline">From Knowledge to Action</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="sidebar-nav-menu">
        ${navItems.map(item => `
          <button class="sidebar-nav-item ${activeNavTab === item.id ? 'active' : ''}" data-nav-tab="${item.id}">
            <span class="sidebar-nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `).join('')}
      </nav>

      <!-- Recent Conversations List with 3-Dots Menu -->
      <div class="sidebar-conversations-section">
        <div class="conversations-header-row">
          <span class="conversations-heading">Recent Chats</span>
        </div>

        <div class="conversations-scroll-list">
          ${conversations.map(c => `
            <div class="conversation-row ${c.id === activeConvId ? 'active' : ''}" data-conv-id="${c.id}">
              <div class="conv-info">
                <span class="conv-title-text" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</span>
                <span class="conv-timestamp">${c.time || 'Just now'}</span>
              </div>
              
              <!-- 3-Dots Action Button -->
              <div class="conv-actions-wrap">
                <button class="btn-conv-dots" data-dots-id="${c.id}" title="Chat options">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                </button>
                
                <!-- 3-Dots Dropdown Menu -->
                <div class="conv-dropdown-menu" id="dropdown-${c.id}">
                  <button class="dropdown-item-rename" data-rename-conv-id="${c.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Rename Chat</span>
                  </button>
                  <button class="dropdown-item-delete" data-delete-conv-id="${c.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <span>Delete Chat</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- User Account Widget / Sign In in Left Sidebar -->
      <div class="sidebar-account-section">
        ${user ? `
          <div class="sidebar-user-pill">
            <div class="sidebar-user-left">
              <div class="header-avatar-circle" style="width:28px;height:28px;font-size:0.75rem;flex-shrink:0;">${(user.name || 'U').charAt(0).toUpperCase()}</div>
              <div class="sidebar-user-meta">
                <span class="sidebar-user-name" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</span>
                <span class="sidebar-user-badge">
                  <span class="status-dot-green"></span>
                  Supabase Live
                </span>
              </div>
            </div>
            <button class="btn-sidebar-logout" id="btn-sidebar-logout" title="Sign Out">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        ` : `
          <button class="sidebar-signin-btn" id="btn-sidebar-signin" title="Sign in with Supabase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Sign In / Sign Up</span>
          </button>
        `}
      </div>

      <!-- Turn Information Into Impact Promo Card -->
      <div class="sidebar-promo-card">
        <div class="promo-title">Turn Information<br>Into Impact</div>
        <div class="promo-subtitle">Ask. Analyze. Recommend.</div>
        
        <!-- Mountain / Wave Vector Art -->
        <svg class="promo-mountain-waves" viewBox="0 0 220 50" fill="none" preserveAspectRatio="none">
          <path d="M0 38 Q 45 22, 90 32 T 180 20 Q 205 14, 220 25 L 220 50 L 0 50 Z" fill="#93C5FD" opacity="0.6"/>
          <path d="M0 42 Q 60 28, 120 40 T 220 30 L 220 50 L 0 50 Z" fill="#60A5FA" opacity="0.9"/>
        </svg>
      </div>

      <!-- Footer at Bottom of Left Sidebar -->
      <div class="sidebar-footer">
        <div>© 2024 KnowledgeX</div>
        <div class="sidebar-footer-azure">
          <span>Built with</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0078D4">
            <path d="M12 2L2 19.5h7.5L12 14l2.5 5.5H22L12 2z"/>
          </svg>
          <span>Azure AI Foundry</span>
        </div>
      </div>
    </aside>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
