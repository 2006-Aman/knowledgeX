import { getMotionRobotHtml } from './motionRobot.js';

let animationFrameId = null;

export function renderAuthView(authMode = 'login', isLoading = false, prefillEmail = '') {
  const isLogin = authMode === 'login';

  return `
    <div class="auth-view-container">
      <!-- Novel Moving Animation 1: Interactive Constellation Particle Canvas -->
      <canvas id="auth-constellation-canvas" class="auth-constellation-canvas"></canvas>

      <!-- Novel Moving Animation 2: Morphing Aurora Liquid Gradient Mesh -->
      <div class="auth-aurora-backdrop">
        <div class="auth-aurora-glow auth-aurora-glow-1"></div>
        <div class="auth-aurora-glow auth-aurora-glow-2"></div>
        <div class="auth-aurora-glow auth-aurora-glow-3"></div>
      </div>



      <!-- Novel Moving Animation 3: Floating 3D Glass Bubbles & Spheres Cluster -->
      <div class="auth-bubbles-field" id="auth-bubbles-field" aria-hidden="true">
        <div class="auth-glass-bubble bubble-1" data-depth="0.035"></div>
        <div class="auth-glass-bubble bubble-2" data-depth="0.06"></div>
        <div class="auth-glass-bubble bubble-3" data-depth="0.025"></div>
        <div class="auth-glass-bubble bubble-4" data-depth="0.075"></div>
        <div class="auth-glass-bubble bubble-5" data-depth="0.045"></div>
        <div class="auth-glass-bubble bubble-6" data-depth="0.07"></div>
        <div class="auth-glass-bubble bubble-7" data-depth="0.03"></div>
        <div class="auth-glass-bubble bubble-8" data-depth="0.085"></div>
        <div class="auth-glass-bubble bubble-9" data-depth="0.04"></div>
        <div class="auth-glass-bubble bubble-10" data-depth="0.065"></div>
        <div class="auth-glass-bubble bubble-11" data-depth="0.03"></div>
        <div class="auth-glass-bubble bubble-12" data-depth="0.05"></div>
        <div class="auth-glass-bubble bubble-13" data-depth="0.08"></div>
        <div class="auth-glass-bubble bubble-14" data-depth="0.04"></div>
      </div>

      <!-- Novel Moving Animation 4: Glassmorphic Holographic Card with Border Beam Sweep -->
      <div class="auth-card-outer-wrap">
        <div class="auth-card-border-sweep"></div>
        <div class="auth-glass-card">
          <!-- Card Brand Header -->
          <div class="auth-card-header">
            <div class="auth-brand-logo-wrap">
              <div class="auth-brand-aura"></div>
              ${getMotionRobotHtml(48, true)}
            </div>
            <h1 class="auth-card-title">${isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p class="auth-card-subtitle">
              ${isLogin ? 'Sign in to access your intelligent document workspace' : 'Join KnowledgeX and query documents with verified RAG'}
            </p>
          </div>

          <!-- Sliding Tab Switcher -->
          <div class="auth-tabs-nav">
            <div class="auth-tab-slider-pill ${isLogin ? '' : 'slide-signup'}"></div>
            <button class="auth-tab-btn ${isLogin ? 'active' : ''}" id="btn-tab-login" type="button">
              Sign In
            </button>
            <button class="auth-tab-btn ${!isLogin ? 'active' : ''}" id="btn-tab-signup" type="button">
              Create Account
            </button>
          </div>

          <!-- Auth Form (Sign In or Sign Up) -->
          <form class="auth-form" id="auth-form" autocomplete="on">
            ${!isLogin ? `
              <!-- Full Name (Sign Up only) -->
              <div class="auth-input-group">
                <label class="auth-input-label" for="auth-name">Full Name</label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    id="auth-name" 
                    class="auth-text-input" 
                    placeholder="e.g. Harnoor Kaur"
                    required
                    autocomplete="name"
                  />
                </div>
              </div>
            ` : ''}

            <!-- Email Address -->
            <div class="auth-input-group">
              <label class="auth-input-label" for="auth-email">Email Address</label>
              <div class="auth-input-wrapper">
                <span class="auth-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input 
                  type="email" 
                  id="auth-email" 
                  class="auth-text-input" 
                  placeholder="name@example.com" 
                  value="${prefillEmail || ''}"
                  required
                  autocomplete="email"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="auth-input-group">
              <label class="auth-input-label" for="auth-password">Password</label>
              <div class="auth-input-wrapper">
                <span class="auth-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input 
                  type="password" 
                  id="auth-password" 
                  class="auth-text-input" 
                  placeholder="${isLogin ? 'Enter your password' : 'Create a secure password (min 6 chars)'}" 
                  required
                  minlength="6"
                  autocomplete="${isLogin ? 'current-password' : 'new-password'}"
                />
                <button type="button" class="btn-toggle-password" id="btn-toggle-password" title="Show/Hide Password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            ${!isLogin ? `
              <!-- Confirm Password (Sign Up only) -->
              <div class="auth-input-group">
                <label class="auth-input-label" for="auth-confirm-password">Confirm Password</label>
                <div class="auth-input-wrapper">
                  <span class="auth-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input 
                    type="password" 
                    id="auth-confirm-password" 
                    class="auth-text-input" 
                    placeholder="Repeat your password" 
                    required
                    minlength="6"
                    autocomplete="new-password"
                  />
                </div>
              </div>
            ` : `
              <!-- Remember Me & Forgot Password (Sign In only) -->
              <div class="auth-options-row">
                <label class="auth-checkbox-wrap">
                  <input type="checkbox" id="auth-remember-me" checked />
                  <span>Remember me</span>
                </label>
                <button type="button" class="auth-link-btn" id="btn-forgot-password">
                  Forgot password?
                </button>
              </div>
            `}

            <!-- Submit Button with Dynamic Shimmer -->
            <button class="btn-auth-submit" id="btn-auth-submit" type="submit" ${isLoading ? 'disabled' : ''}>
              ${isLoading ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon" style="animation: spin 1s linear infinite;">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                </svg>
                <span>${isLogin ? 'Authenticating with Supabase...' : 'Registering in Supabase...'}</span>
              ` : `
                <span>${isLogin ? 'Sign In' : 'Create Account'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              `}
            </button>
          </form>

          <!-- Guest Workspace Option -->
          <div class="auth-guest-divider">or explore</div>
          <button class="btn-auth-guest" id="btn-auth-guest" type="button">
            <span>Continue as Guest Workspace</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Back to System Dashboard -->
          <div style="margin-top: 0.75rem; text-align: center;">
            <button class="btn-auth-back-dashboard" id="btn-auth-back-dashboard" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Back to System Dashboard</span>
            </button>
          </div>

          <!-- Supabase Cloud Footer Connection Badge -->
          <div class="auth-footer-note">
            <span>Data securely stored in</span>
            <span class="supabase-brand-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.368 13.916a.792.792 0 0 0 .616 1.284H12v8.958a.396.396 0 0 0 .716.233l10.916-13.753a.792.792 0 0 0-.616-1.284z"/>
              </svg>
              Supabase Cloud
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Interactive Constellation Canvas Particle Animation ──
export function initConstellationCanvas() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const canvas = document.getElementById('auth-constellation-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const onResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  // Generate 42 smooth particles
  const particleCount = Math.min(Math.floor((width * height) / 22000), 50);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.5 + 1.2,
      baseColor: i % 3 === 0 ? '167, 139, 250' : (i % 3 === 1 ? '124, 109, 240' : '96, 165, 250'),
      alpha: Math.random() * 0.4 + 0.3
    });
  }

  let mouseX = -1000;
  let mouseY = -1000;

  const bubbles = document.querySelectorAll('.auth-glass-bubble');

  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Gentle 3D perspective parallax for floating glass bubbles
    const centerX = width / 2;
    const centerY = height / 2;
    const offsetX = mouseX - centerX;
    const offsetY = mouseY - centerY;

    bubbles.forEach(b => {
      const depth = parseFloat(b.getAttribute('data-depth')) || 0.04;
      b.style.transform = `translate(${offsetX * depth}px, ${offsetY * depth}px)`;
    });
  };

  const onMouseLeave = () => {
    mouseX = -1000;
    mouseY = -1000;
    bubbles.forEach(b => {
      b.style.transform = '';
    });
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);

  const renderLoop = () => {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Mouse repulsion/attraction dynamic
      const dxMouse = mouseX - p.x;
      const dyMouse = mouseY - p.y;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      if (distMouse < 140) {
        const force = (140 - distMouse) / 140;
        p.x -= (dxMouse / distMouse) * force * 1.5;
        p.y -= (dyMouse / distMouse) * force * 1.5;
      }

      // Draw particle dot with soft glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.baseColor}, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${p.baseColor}, 0.5)`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Connect to other nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 115) {
          const lineAlpha = (1 - dist / 115) * 0.28;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  };

  renderLoop();

  // Return teardown function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseleave', onMouseLeave);
  };
}
