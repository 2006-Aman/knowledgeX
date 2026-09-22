export function renderTopNav(searchQuery = '', user = null) {
  const initial = user && user.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const displayName = user && user.name ? user.name : 'Sign In';

  return `
    <header class="app-top-header">
      <!-- Search Chats Input -->
      <div class="header-search-bar">
        <span class="header-search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input 
          type="text" 
          class="header-search-input" 
          id="global-search-input" 
          placeholder="Search chats..." 
          value="${searchQuery ? searchQuery.replace(/"/g, '&quot;') : ''}"
          autocomplete="off"
        />
      </div>

      <!-- Action Icons: Profile & Auth Dropdown -->
      <div class="header-actions-group" style="position:relative; display:flex; align-items:center; gap:0.75rem;">
        <button class="btn-top-dashboard" id="btn-top-dashboard" title="Open System Dashboard" style="display:flex; align-items:center; gap:0.45rem; padding:0.4rem 0.85rem; background:rgba(124,109,240,0.09); border:1px solid rgba(167,139,250,0.3); border-radius:var(--radius-full); font-size:0.82rem; font-weight:600; color:var(--color-brand-blue); cursor:pointer; transition:all 0.2s ease;">
          <span style="width:7px; height:7px; background:#10B981; border-radius:50%; box-shadow:0 0 6px #10B981;"></span>
          <span>System Dashboard</span>
        </button>
        ${user ? `
          <div class="header-user-profile" id="btn-user-profile" title="Account Details">
            <div class="header-avatar-circle">${initial}</div>
            <span class="header-username">${escapeHtml(displayName)}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:0.25rem;">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <!-- Dropdown Menu -->
          <div class="user-profile-dropdown" id="user-profile-dropdown" style="display:none;">
            <div class="user-dropdown-header">
              <span class="dropdown-user-name">${escapeHtml(user.name || 'User')}</span>
              <span class="dropdown-user-email">${escapeHtml(user.email || '')}</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-status-badge">
              <span class="status-dot-green"></span>
              <span>Supabase Authenticated</span>
            </div>
            <div class="dropdown-divider"></div>
            <button class="btn-dropdown-logout" id="btn-header-logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        ` : `
          <button class="btn-header-signin" id="btn-header-signin" title="Sign in with Supabase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Sign In / Sign Up</span>
          </button>
        `}
      </div>
    </header>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
