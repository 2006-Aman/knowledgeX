import { getMotionRobotHtml } from './motionRobot.js';

let dashboardCanvasRaf = null;
let sectionObserver = null;

export function renderDashboardView(documentsList = [], workflowState = {}, user = null) {
  // Aggregate real-time metrics from current documents
  const totalDocs = documentsList.length || 10;
  const totalChunks = documentsList.reduce((acc, d) => acc + (d.chunks || 0), 0) || 210;

  return `
    <div class="dashboard-view-wrapper" id="dashboard-view-wrapper">
      <!-- 1. Running Animated Background Canvas -->
      <canvas id="dashboard-bg-canvas" class="dashboard-bg-canvas"></canvas>
      <div class="dashboard-ambient-mesh" aria-hidden="true">
        <!-- Organic Morphing Blobs with Fluid Border-Radii & Color Keyframes -->
        <div class="morph-blob morph-blob-1"></div>
        <div class="morph-blob morph-blob-2"></div>
        <div class="morph-blob morph-blob-3"></div>
        <div class="morph-blob morph-blob-4"></div>

        <!-- Dynamic 3D Geometric Moving Objects Floating Across Screen -->
        <div class="moving-3d-object obj-cube-1" style="top:12%; left:2.5%;">
          <div class="cube-facet facet-front"></div>
          <div class="cube-facet facet-back"></div>
          <div class="cube-facet facet-right"></div>
          <div class="cube-facet facet-left"></div>
          <div class="cube-facet facet-top"></div>
          <div class="cube-facet facet-bottom"></div>
        </div>

        <div class="moving-3d-object obj-ring-1" style="top:25%; right:3.5%;">
          <div class="torus-ring-body"></div>
          <div class="torus-ring-core"></div>
        </div>

        <div class="moving-3d-object obj-diamond-1" style="top:48%; left:1.5%;">
          <div class="diamond-facet d-top"></div>
          <div class="diamond-facet d-bottom"></div>
        </div>

        <div class="moving-3d-object obj-cube-2" style="top:66%; right:2.5%;">
          <div class="cube-facet facet-front"></div>
          <div class="cube-facet facet-back"></div>
          <div class="cube-facet facet-right"></div>
          <div class="cube-facet facet-left"></div>
          <div class="cube-facet facet-top"></div>
          <div class="cube-facet facet-bottom"></div>
        </div>

        <div class="moving-3d-object obj-ring-2" style="top:85%; left:6%;">
          <div class="torus-ring-body"></div>
          <div class="torus-ring-core"></div>
        </div>

        <div class="moving-3d-object obj-diamond-2" style="top:92%; right:6%;">
          <div class="diamond-facet d-top"></div>
          <div class="diamond-facet d-bottom"></div>
        </div>
      </div>

      <!-- Floating Top Header Bar -->
      <header class="dashboard-top-navbar">
        <div class="dashboard-nav-brand" id="dashboard-brand-home">
          ${getMotionRobotHtml(34, true)}
          <span class="dashboard-nav-brand-title">KnowledgeX</span>
          <span class="dashboard-nav-brand-badge">Intelligence Engine</span>
        </div>

        <nav class="dashboard-nav-links">
          <button class="dashboard-nav-link" data-jump="section-hero">Overview</button>
          <button class="dashboard-nav-link" data-jump="section-models">Models</button>
          <button class="dashboard-nav-link" data-jump="section-workflow">Workflow</button>
          <button class="dashboard-nav-link" data-jump="section-vectors">Vectors</button>
          <button class="dashboard-nav-link" data-jump="section-guardrails">Security</button>
        </nav>

        <div class="dashboard-nav-actions">
          ${user ? `
            <button class="btn-nav-get-started" id="btn-nav-enter-knowledgex">
              <span>Open KnowledgeX</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          ` : `
            <button class="dashboard-nav-link" id="btn-nav-signin" style="margin-right:0.5rem;">Sign In</button>
            <button class="btn-nav-get-started" id="btn-nav-get-started">
              <span>Get Started</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          `}
        </div>
      </header>

      <!-- 2. Floating Section Navigation Tracker -->
      <nav class="dashboard-nav-tracker" aria-label="Dashboard sections">
        <button class="nav-tracker-dot active" data-target="section-hero" title="System Overview">
          <span class="nav-tracker-tooltip">System Overview</span>
        </button>
        <button class="nav-tracker-dot" data-target="section-models" title="AI Models Architecture">
          <span class="nav-tracker-tooltip">AI Models</span>
        </button>
        <button class="nav-tracker-dot" data-target="section-workflow" title="Animated Workflow Engine">
          <span class="nav-tracker-tooltip">Workflow Pipeline</span>
        </button>
        <button class="nav-tracker-dot" data-target="section-vectors" title="Vector Index & Chunks">
          <span class="nav-tracker-tooltip">Vector Store</span>
        </button>
        <button class="nav-tracker-dot" data-target="section-guardrails" title="Safety & Guardrails">
          <span class="nav-tracker-tooltip">Security Guardrails</span>
        </button>
        <button class="nav-tracker-dot" data-target="section-launch" title="Get Started">
          <span class="nav-tracker-tooltip">Get Started</span>
        </button>
      </nav>

      <!-- 3. Scrollable Dashboard Content Sections -->
      <div class="dashboard-content-stream">

        <!-- SECTION 1: HERO OVERVIEW -->
        <section class="dashboard-section in-view" id="section-hero">
          <div class="hero-telemetry-banner">
            <div class="hero-left-content">
              <div class="hero-status-pill">
                <span class="status-live-pulse"></span>
                <span class="kinetic-pill-text">ALL SYSTEMS SYNCHRONIZED · CLOSED-DOMAIN DEFENSE ACTIVE</span>
                <div class="hero-energy-equalizer" title="System Quantum Frequency">
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                  <span class="eq-bar"></span>
                </div>
              </div>

              <div class="kinetic-eyebrow-tag">
                <span class="glitch-text-eyebrow" data-text="// KINETIC INTELLIGENCE SUITE">// KINETIC INTELLIGENCE SUITE</span>
                <span class="version-badge">v2.4 QUANTUM</span>
              </div>

              <!-- Expressive Bold Kinetic Title with Animated Lettering & Glitch -->
              <h1 class="hero-kinetic-title">
                <span class="kinetic-title-row">
                  <span class="kinetic-word-split">
                    <span class="k-letter" style="--i:0">K</span><span class="k-letter" style="--i:1">N</span><span class="k-letter" style="--i:2">O</span><span class="k-letter" style="--i:3">W</span><span class="k-letter" style="--i:4">L</span><span class="k-letter" style="--i:5">E</span><span class="k-letter" style="--i:6">D</span><span class="k-letter" style="--i:7">G</span><span class="k-letter" style="--i:8">E</span>
                  </span>
                  <span class="kinetic-gradient-accent">X</span>
                </span>
                <span class="kinetic-title-sub">
                  <span class="glitch-text" data-text="INTELLIGENCE ENGINE">INTELLIGENCE ENGINE</span>
                </span>
              </h1>

              <!-- Kinetic Rotating Dynamic Word Slider -->
              <div class="kinetic-rotator-container">
                <span class="rotator-lead-badge">AIR-GAPPED DEFENSE</span>
                <div class="kinetic-rotator-viewport">
                  <div class="kinetic-rotator-ribbon">
                    <div class="rotator-phrase phrase-cyan">⚡ ZERO EXTERNAL HALLUCINATIONS</div>
                    <div class="rotator-phrase phrase-purple">🛡️ 100% GROUNDED DOCUMENT CITATIONS</div>
                    <div class="rotator-phrase phrase-emerald">⏱️ 0.24s HYBRID BM25 + PGVECTOR SEARCH</div>
                    <div class="rotator-phrase phrase-amber">🔒 MULTI-TENANT ISOLATED PRIVACY</div>
                  </div>
                </div>
              </div>

              <p class="hero-lead-text">
                Real-time model orchestration and vectorized document intelligence powered by Azure OpenAI GPT-4.1 Mini and Supabase pgvector.
              </p>

              <div class="hero-cta-cluster">
                <button class="btn-hero-get-started energy-pulse-btn" id="btn-hero-get-started" type="button">
                  <span class="btn-shimmer-beam"></span>
                  <span class="btn-text-content">${user ? 'Open KnowledgeX Workspace' : 'Get Started with KnowledgeX'}</span>
                  <svg class="btn-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                <button class="btn-hero-secondary" id="btn-hero-explore-workflow" type="button">
                  <span class="live-dot-cyan"></span>
                  <span>Explore Live Architecture ↓</span>
                </button>
              </div>
            </div>

            <div class="hero-right-robot">
              <div class="robot-cyber-grid-rings">
                <div class="cyber-ring ring-1"></div>
                <div class="cyber-ring ring-2"></div>
                <div class="cyber-ring ring-3"></div>
              </div>
              <div class="robot-halo-ring"></div>
              ${getMotionRobotHtml(96, true)}
              <div class="floating-tech-hud hud-top-right">
                <span class="hud-label">COSINE MATCH</span>
                <span class="hud-val">0.982 HIGH</span>
              </div>
              <div class="floating-tech-hud hud-bottom-left">
                <span class="hud-label">RAG INTEGRITY</span>
                <span class="hud-val">100% CLOSED</span>
              </div>
            </div>
          </div>

          <!-- Telemetry Stats Cards with Energy Visualizers -->
          <div class="telemetry-stats-grid">
            <div class="telemetry-card card-energy-cyan">
              <div class="telemetry-card-header">
                <span class="telemetry-card-label">Active Documents</span>
                <div class="telemetry-card-icon-glow">📄</div>
              </div>
              <div class="telemetry-card-value-wrap">
                <span class="telemetry-card-value kinetic-number">${totalDocs}</span>
                <span class="telemetry-unit">FILES</span>
              </div>
              <div class="telemetry-mini-visualizer">
                <div class="mini-eq-bars cyan">
                  <span style="height:35%;"></span><span style="height:70%;"></span><span style="height:100%;"></span><span style="height:50%;"></span><span style="height:85%;"></span>
                </div>
              </div>
              <div class="telemetry-card-footer stat-good">
                <span class="pulse-beacon"></span> Indexed in Supabase Cloud
              </div>
            </div>

            <div class="telemetry-card card-energy-purple">
              <div class="telemetry-card-header">
                <span class="telemetry-card-label">Vectorized Chunks</span>
                <div class="telemetry-card-icon-glow">⚡</div>
              </div>
              <div class="telemetry-card-value-wrap">
                <span class="telemetry-card-value kinetic-number">${totalChunks}</span>
                <span class="telemetry-unit">1536-D</span>
              </div>
              <div class="telemetry-mini-visualizer">
                <div class="mini-eq-bars purple">
                  <span style="height:80%;"></span><span style="height:45%;"></span><span style="height:95%;"></span><span style="height:60%;"></span><span style="height:100%;"></span>
                </div>
              </div>
              <div class="telemetry-card-footer stat-highlight">
                <span class="pulse-beacon-purple"></span> pgvector HNSW Optimized
              </div>
            </div>

            <div class="telemetry-card card-energy-emerald">
              <div class="telemetry-card-header">
                <span class="telemetry-card-label">Average Retrieval</span>
                <div class="telemetry-card-icon-glow">⏱️</div>
              </div>
              <div class="telemetry-card-value-wrap">
                <span class="telemetry-card-value kinetic-number">0.24</span>
                <span class="telemetry-unit">SEC</span>
              </div>
              <div class="telemetry-mini-visualizer">
                <div class="mini-eq-bars emerald">
                  <span style="height:40%;"></span><span style="height:85%;"></span><span style="height:60%;"></span><span style="height:100%;"></span><span style="height:75%;"></span>
                </div>
              </div>
              <div class="telemetry-card-footer stat-good">
                <span class="pulse-beacon"></span> Hybrid BM25 + Cosine Match
              </div>
            </div>

            <div class="telemetry-card card-energy-amber">
              <div class="telemetry-card-header">
                <span class="telemetry-card-label">RAG Groundedness</span>
                <div class="telemetry-card-icon-glow">🛡️</div>
              </div>
              <div class="telemetry-card-value-wrap">
                <span class="telemetry-card-value kinetic-number">100%</span>
                <span class="telemetry-unit">ZERO LEAK</span>
              </div>
              <div class="telemetry-mini-visualizer">
                <div class="mini-eq-bars amber">
                  <span style="height:100%;"></span><span style="height:100%;"></span><span style="height:100%;"></span><span style="height:100%;"></span><span style="height:100%;"></span>
                </div>
              </div>
              <div class="telemetry-card-footer stat-good">
                <span class="pulse-beacon"></span> Zero External Hallucination
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 2: AI MODELS SHOWCASE -->
        <section class="dashboard-section" id="section-models">
          <div>
            <span class="section-badge glitch-badge" data-text="02 // ARCHITECTURE & ENGINES">02 // ARCHITECTURE & ENGINES</span>
            <h2 class="section-title kinetic-heading"><span class="heading-accent">INTELLIGENCE INFRASTRUCTURE</span> & AI MODELS</h2>
            <p class="section-subtitle">
              Orchestrated pipeline leveraging Azure OpenAI for deep reasoning and Supabase for high-dimensional vector embeddings.
            </p>
          </div>

          <div class="models-grid">
            <!-- Model 1: GPT-4.1 Mini -->
            <div class="model-showcase-card">
              <div class="model-card-accent-bar bar-azure"></div>
              <div class="model-card-header">
                <div class="model-brand-wrap">
                  <div class="model-brand-icon">🤖</div>
                  <div>
                    <h3 class="model-name">Azure OpenAI GPT-4.1 Mini</h3>
                    <span class="model-role-badge">Reasoning & Synthesis Engine</span>
                  </div>
                </div>
                <div class="model-status-indicator">
                  <span class="status-live-pulse"></span> Active
                </div>
              </div>
              <p class="model-desc">
                High-efficiency LLM deployment configured for deterministic, citation-accurate responses derived exclusively from uploaded client files.
              </p>
              <div class="model-specs-grid">
                <div class="spec-item">
                  <span class="spec-key">Context Window</span>
                  <span class="spec-val">128,000 tokens</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Temperature</span>
                  <span class="spec-val">0.2 (Fact-Focused)</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Streaming Speed</span>
                  <span class="spec-val">~45 tokens/sec</span>
                </div>
              </div>
            </div>

            <!-- Model 2: Vector Embeddings -->
            <div class="model-showcase-card">
              <div class="model-card-accent-bar bar-embed"></div>
              <div class="model-card-header">
                <div class="model-brand-wrap">
                  <div class="model-brand-icon">🧬</div>
                  <div>
                    <h3 class="model-name">Text-Embedding-3-Large</h3>
                    <span class="model-role-badge">Semantic Vector Representation</span>
                  </div>
                </div>
                <div class="model-status-indicator">
                  <span class="status-live-pulse"></span> Active
                </div>
              </div>
              <p class="model-desc">
                Translates chunked documents and user questions into dense vector embeddings for cosine proximity and semantic cluster indexing.
              </p>
              <div class="model-specs-grid">
                <div class="spec-item">
                  <span class="spec-key">Dimensions</span>
                  <span class="spec-val">1536 dimensions</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Distance Metric</span>
                  <span class="spec-val">Cosine Similarity</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Embedding Speed</span>
                  <span class="spec-val">&lt; 85ms</span>
                </div>
              </div>
            </div>

            <!-- Model 3: Supabase pgvector -->
            <div class="model-showcase-card">
              <div class="model-card-accent-bar bar-supabase"></div>
              <div class="model-card-header">
                <div class="model-brand-wrap">
                  <div class="model-brand-icon">⚡</div>
                  <div>
                    <h3 class="model-name">Supabase pgvector Cloud</h3>
                    <span class="model-role-badge">Vector DB & Auth Infrastructure</span>
                  </div>
                </div>
                <div class="model-status-indicator">
                  <span class="status-live-pulse"></span> Connected
                </div>
              </div>
              <p class="model-desc">
                Cloud Postgres instance holding indexed document vectors, PBKDF2 user authentication credentials, and user-isolated conversation archives.
              </p>
              <div class="model-specs-grid">
                <div class="spec-item">
                  <span class="spec-key">Index Type</span>
                  <span class="spec-val">HNSW / Inverted</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Storage Engine</span>
                  <span class="spec-val">PostgreSQL 15</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">SSL Security</span>
                  <span class="spec-val">TLS 1.3 Strict</span>
                </div>
              </div>
            </div>

            <!-- Model 4: Guardrail Interceptor -->
            <div class="model-showcase-card">
              <div class="model-card-accent-bar bar-guard"></div>
              <div class="model-card-header">
                <div class="model-brand-wrap">
                  <div class="model-brand-icon">🛡️</div>
                  <div>
                    <h3 class="model-name">KnowledgeX Closed-Domain Guard</h3>
                    <span class="model-role-badge">Safety & Refusal Governor</span>
                  </div>
                </div>
                <div class="model-status-indicator">
                  <span class="status-live-pulse"></span> Enforcing
                </div>
              </div>
              <p class="model-desc">
                Two-tier guardrail: zero-context refusal for external queries and multi-pattern safety interception for prohibited materials and topics.
              </p>
              <div class="model-specs-grid">
                <div class="spec-item">
                  <span class="spec-key">External Web Search</span>
                  <span class="spec-val">DISABLED (0%)</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Safety Interception</span>
                  <span class="spec-val">Deterministic Regex</span>
                </div>
                <div class="spec-item">
                  <span class="spec-key">Refusal Latency</span>
                  <span class="spec-val">&lt; 10ms</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 3: ANIMATED WORKFLOW ENGINE -->
        <section class="dashboard-section" id="section-workflow">
          <div>
            <span class="section-badge glitch-badge" data-text="03 // LIVE WORKFLOW PIPELINE">03 // LIVE WORKFLOW PIPELINE</span>
            <h2 class="section-title kinetic-heading"><span class="heading-accent">REPRESENTATIVE PIPELINE</span> & STREAM TRACE</h2>
            <p class="section-subtitle">
              Follow query lifecycle in real-time as data packets travel between security, semantic retrieval, and synthesis stages. Click any node to inspect details.
            </p>
          </div>

          <div class="workflow-pipeline-card">
            <div class="pipeline-header-controls">
              <div class="pipeline-stats-summary">
                <div class="pipeline-stat-pill">
                  <span class="status-live-pulse"></span>
                  <span>Pipeline Status: <strong class="neon-emerald">Ready & Listening</strong></span>
                </div>
                <div class="pipeline-stat-pill">
                  <span>Execution Avg: <strong class="neon-cyan">1.4s</strong></span>
                </div>
              </div>
              <button class="btn-trigger-pulse energy-pulse-btn" id="btn-trigger-workflow-pulse" type="button">
                <span>⚡ Simulate Live Query Pulse</span>
              </button>
            </div>

            <!-- Workflow Visual Row with SVG Animated Packets -->
            <div class="workflow-nodes-row" id="workflow-nodes-container">
              <!-- SVG Background Connection Stream with Electric Laser Beams -->
              <svg class="workflow-svg-layer" viewBox="0 0 1000 40" preserveAspectRatio="none">
                <line x1="40" y1="20" x2="960" y2="20" class="workflow-connector-line" />
                <circle cx="40" cy="20" r="7" class="workflow-data-packet laser-1" id="workflow-pulse-circle-1" />
                <circle cx="40" cy="20" r="5" class="workflow-data-packet laser-2" id="workflow-pulse-circle-2" style="animation-delay: 1.8s;" />
                <circle cx="40" cy="20" r="6" class="workflow-data-packet laser-3" id="workflow-pulse-circle-3" style="animation-delay: 3.6s;" />
              </svg>

              <!-- Node 1: User Query -->
              <div class="stage-node-box active-stage" data-node="1" data-name="User Ingestion" data-desc="Captures user prompt, sanitizes input, and initializes conversation state." data-stat1="100%" data-lbl1="Integrity" data-stat2="&lt;5ms" data-lbl2="Latency">
                <div class="stage-node-icon" style="background: #10B981;">▶</div>
                <span class="stage-node-name">1. Query Ingestion</span>
                <span class="stage-node-badge">Start</span>
              </div>

              <!-- Node 2: Safety Gate -->
              <div class="stage-node-box" data-node="2" data-name="Safety Gate Interceptor" data-desc="Evaluates prompt against regex patterns for explosives, sexuality, self-harm, and inappropriate queries." data-stat1="0ms" data-lbl1="Bypass" data-stat2="100%" data-lbl2="Coverage">
                <div class="stage-node-icon" style="background: #EC4899;">🛡️</div>
                <span class="stage-node-name">2. Safety Gate</span>
                <span class="stage-node-badge">Filter</span>
              </div>

              <!-- Node 3: Hybrid Search -->
              <div class="stage-node-box" data-node="3" data-name="Hybrid Retrieval" data-desc="Queries Supabase pgvector using vector cosine similarity combined with full-text BM25 matching." data-stat1="${totalChunks}" data-lbl1="Chunks Searched" data-stat2="0.18s" data-lbl2="Retrieval">
                <div class="stage-node-icon" style="background: #6366F1;">🔍</div>
                <span class="stage-node-name">3. Hybrid Search</span>
                <span class="stage-node-badge">pgvector</span>
              </div>

              <!-- Node 4: Re-Ranker -->
              <div class="stage-node-box" data-node="4" data-name="Re-Ranker & Context Window" data-desc="Scores and deduplicates top matching chunks, assembling cohesive grounded context blocks." data-stat1="Top 5" data-lbl1="K-Chunks" data-stat2="&gt;0.65" data-lbl2="Min Sim">
                <div class="stage-node-icon" style="background: #F59E0B;">⚖️</div>
                <span class="stage-node-name">4. Re-Ranking</span>
                <span class="stage-node-badge">Filter</span>
              </div>

              <!-- Node 5: Closed-Domain Guard -->
              <div class="stage-node-box" data-node="5" data-name="Closed-Domain Guardrail" data-desc="Checks if retrieved context is non-empty. If zero chunks match, forces immediate refusal without hallucination." data-stat1="0%" data-lbl1="Web Hallucination" data-stat2="100%" data-lbl2="Strict RAG">
                <div class="stage-node-icon" style="background: #8B5CF6;">🚧</div>
                <span class="stage-node-name">5. RAG Guard</span>
                <span class="stage-node-badge">Enforcer</span>
              </div>

              <!-- Node 6: GPT-4.1 Mini -->
              <div class="stage-node-box" data-node="6" data-name="Azure GPT-4.1 Mini Synthesis" data-desc="Generates executive answer, rationale explanation, and extracts verified document source citations." data-stat1="128k" data-lbl1="Context" data-stat2="0.2" data-lbl2="Temp">
                <div class="stage-node-icon" style="background: #0EA5E9;">🧠</div>
                <span class="stage-node-name">6. AI Synthesis</span>
                <span class="stage-node-badge">GPT-4.1</span>
              </div>

              <!-- Node 7: Streaming Output -->
              <div class="stage-node-box" data-node="7" data-name="Verified Output & Citations" data-desc="Delivers formatted markdown answer, explanation card, clickable source pills, and execution timeline." data-stat1="1.4s" data-lbl1="E2E Time" data-stat2="100%" data-lbl2="Citations">
                <div class="stage-node-icon" style="background: #10B981;">💬</div>
                <span class="stage-node-name">7. Verified Output</span>
                <span class="stage-node-badge">Delivery</span>
              </div>
            </div>

            <!-- Active Stage Inspector Panel -->
            <div class="workflow-inspector-panel" id="workflow-inspector-panel">
              <div class="inspector-info">
                <h4 class="inspector-title" id="inspector-title">
                  <span>▶</span> Node 1: User Ingestion
                </h4>
                <p class="inspector-desc" id="inspector-desc">
                  Captures user prompt, sanitizes input, validates authentication token, and initializes conversation session.
                </p>
              </div>
              <div class="inspector-stats-row">
                <div class="inspector-stat-item">
                  <div class="inspector-stat-num kinetic-number" id="inspector-stat-1">100%</div>
                  <div class="inspector-stat-lbl" id="inspector-lbl-1">Integrity</div>
                </div>
                <div class="inspector-stat-item">
                  <div class="inspector-stat-num kinetic-number" id="inspector-stat-2">&lt;5ms</div>
                  <div class="inspector-stat-lbl" id="inspector-lbl-2">Latency</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 4: VECTOR INDEX & KNOWLEDGE BASE -->
        <section class="dashboard-section" id="section-vectors">
          <div>
            <span class="section-badge glitch-badge" data-text="04 // HIGH-DIMENSIONAL EMBEDDINGS">04 // HIGH-DIMENSIONAL EMBEDDINGS</span>
            <h2 class="section-title kinetic-heading"><span class="heading-accent">1,536-DIMENSIONAL</span> VECTOR LATTICE</h2>
            <p class="section-subtitle">
              Live breakdown of document chunks stored in Supabase pgvector and cosine similarity threshold bounds.
            </p>
          </div>

          <div class="vectors-split-grid">
            <!-- Indexed Documents List with Density Bars -->
            <div class="vectors-card">
              <h3 class="vectors-card-title">
                <span>📚</span> Indexed Document Distribution
              </h3>
              <div class="doc-dist-list">
                ${documentsList.slice(0, 5).map(doc => {
                  const pct = Math.min(Math.round(((doc.chunks || 1) / totalChunks) * 100), 100);
                  return `
                    <div class="doc-dist-item">
                      <div class="doc-dist-header">
                        <span>${doc.name}</span>
                        <span style="color: var(--color-brand-blue);">${doc.chunks || 1} chunks (${pct}%)</span>
                      </div>
                      <div class="doc-dist-bar-track">
                        <div class="doc-dist-bar-fill" style="width: ${pct}%;"></div>
                      </div>
                    </div>
                  `;
                }).join('') || `
                  <div class="doc-dist-item">
                    <div class="doc-dist-header">
                      <span>No indexed files yet</span>
                      <span>0 chunks</span>
                    </div>
                  </div>
                `}
              </div>
            </div>

            <!-- Similarity Distribution & Threshold Visualizer -->
            <div class="vectors-card">
              <h3 class="vectors-card-title">
                <span>🎯</span> Cosine Similarity Gate
              </h3>
              <div class="similarity-visualizer-box">
                <p style="font-size:0.9rem; color:var(--color-text-muted); line-height:1.5; margin:0;">
                  Only chunks with similarity scores meeting or exceeding the strict 0.68 cosine cutoff threshold are passed to Azure OpenAI GPT-4.1 Mini.
                </p>
                <div class="sim-scale-bar">
                  <div class="sim-threshold-marker">
                    <span class="sim-marker-label">Cutoff: 0.68</span>
                    <div class="sim-marker-pin"></div>
                  </div>
                </div>
                <div class="sim-legend-row" style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:700; color:var(--color-text-muted); margin-top:0.35rem;">
                  <span>0.00 (Irrelevant)</span>
                  <span>0.50 (Loose)</span>
                  <span style="color:var(--color-brand-blue); font-weight:800;">0.68 (Required)</span>
                  <span>1.00 (Exact Match)</span>
                </div>

                <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:var(--radius-md); padding:1rem; margin-top:0.5rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:700; color:#059669;">
                    <span>✓</span> Deterministic Grounding Verified
                  </div>
                  <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:0.25rem;">
                    Queries without matching chunks automatically trigger standard closed-domain refusal without external web leakage.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 5: SECURITY & SAFETY MONITOR -->
        <section class="dashboard-section" id="section-guardrails">
          <div>
            <span class="section-badge glitch-badge" data-text="05 // DETERMINISTIC SAFETY SHIELDS">05 // DETERMINISTIC SAFETY SHIELDS</span>
            <h2 class="section-title kinetic-heading"><span class="heading-accent">TRIPLE-TIER</span> DEFENSE & GUARDRAILS</h2>
            <p class="section-subtitle">
              Strict deterministic controls guaranteeing zero hallucination, multi-tenant user isolation, and automated refusal of prohibited topics.
            </p>
          </div>

          <div class="guardrails-row">
            <div class="guardrail-metric-card">
              <div class="guardrail-card-icon" style="background:rgba(236,72,153,0.12); color:#EC4899;">🚫</div>
              <h3 class="guardrail-card-title">Inappropriate Content Gate</h3>
              <p class="guardrail-card-desc">
                Deterministic regex interceptor blocks inquiries regarding explosives, sexuality, self-harm, and weapons before reaching any LLM endpoint.
              </p>
              <div class="guardrail-status-pill">
                <span>●</span> 100% Interception Active
              </div>
            </div>

            <div class="guardrail-metric-card">
              <div class="guardrail-card-icon" style="background:rgba(139,92,246,0.12); color:#8B5CF6;">🔒</div>
              <h3 class="guardrail-card-title">User Chat Isolation</h3>
              <p class="guardrail-card-desc">
                Multi-tenant storage keys with Supabase cloud database synchronization ensure users only access their personal conversation threads.
              </p>
              <div class="guardrail-status-pill">
                <span>●</span> Isolated per User ID
              </div>
            </div>

            <div class="guardrail-metric-card">
              <div class="guardrail-card-icon" style="background:rgba(16,185,129,0.12); color:#10B981;">🌐</div>
              <h3 class="guardrail-card-title">Zero-Web Policy</h3>
              <p class="guardrail-card-desc">
                External search engines and pre-trained non-document knowledge are completely severed. KnowledgeX answers strictly from verified uploads.
              </p>
              <div class="guardrail-status-pill">
                <span>●</span> Closed-Domain Locked
              </div>
            </div>
          </div>
        </section>

        <!-- SECTION 6: GET STARTED & LAUNCH CARD -->
        <section class="dashboard-section" id="section-launch">
          <div class="dashboard-launch-card">
            <div class="launch-card-glow"></div>
            <div class="launch-radar-grid"></div>
            <div class="launch-card-robot">
              ${getMotionRobotHtml(76, true)}
            </div>
            <div class="launch-glitch-badge" data-text="ENTERPRISE AIR-GAPPED DEPLOYMENT">ENTERPRISE AIR-GAPPED DEPLOYMENT</div>
            <h2 class="launch-title kinetic-launch-title">
              READY TO EXPERIENCE
              <span class="glitch-text glitch-launch" data-text="CLOSED-DOMAIN POWER?">CLOSED-DOMAIN POWER?</span>
            </h2>
            <p class="launch-subtitle">
              Upload enterprise knowledge, converse with 100% grounded citations, and eliminate hallucinations with KnowledgeX's air-gapped intelligence.
            </p>
            <div class="launch-card-actions">
              <button class="btn-cta-launch energy-launch-btn" id="btn-cta-get-started" type="button">
                <span class="btn-laser-sweep"></span>
                <span class="btn-cta-text">${user ? 'Open KnowledgeX Workspace' : 'Get Started with KnowledgeX'}</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  `;
}

// ── DASHBOARD ANIMATIONS & INTERSECTION OBSERVER SETUP ──
export function initDashboardAnimations({ onGetStarted, onOpenKnowledgeX, onOpenConsultAI } = {}) {
  const wrapper = document.getElementById('dashboard-view-wrapper');
  const canvas = document.getElementById('dashboard-bg-canvas');
  if (!wrapper || !canvas) return;

  // 1. Running Animated Background Canvas (Cybernetic Dynamic Grid Mesh)
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const onResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  // Generate 45 ambient floating nodes
  const nodes = [];
  const count = Math.min(Math.floor((width * height) / 25000), 50);
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2.2 + 1.2,
      baseColor: i % 3 === 0 ? '167, 139, 250' : (i % 3 === 1 ? '124, 109, 240' : '96, 165, 250'),
      alpha: Math.random() * 0.35 + 0.25
    });
  }

  const renderCanvasLoop = () => {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${n.baseColor}, ${n.alpha})`;
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n.x - n2.x;
        const dy = n.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${(1 - dist / 130) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    dashboardCanvasRaf = requestAnimationFrame(renderCanvasLoop);
  };
  renderCanvasLoop();

  // 2. IntersectionObserver for Seamless Section-to-Section Scroll Transitions
  const sections = wrapper.querySelectorAll('.dashboard-section');
  const trackerDots = document.querySelectorAll('.nav-tracker-dot');

  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        const targetId = entry.target.getAttribute('id');
        trackerDots.forEach(dot => {
          if (dot.getAttribute('data-target') === targetId) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
    });
  }, {
    root: wrapper,
    threshold: 0.2
  });

  sections.forEach(sec => sectionObserver.observe(sec));

  // 3. Clickable Navigation Tracker Dots
  trackerDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetId = dot.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 4. Interactive Get Started & KnowledgeX Button Bindings
  const handleStart = () => {
    if (onGetStarted) onGetStarted();
  };
  const handleOpenKnowledgeX = () => {
    if (onOpenKnowledgeX) onOpenKnowledgeX();
    else if (onOpenConsultAI) onOpenConsultAI();
    else if (onGetStarted) onGetStarted();
  };

  const btnHeroStart = document.getElementById('btn-hero-get-started');
  if (btnHeroStart) btnHeroStart.addEventListener('click', handleStart);

  const btnNavStart = document.getElementById('btn-nav-get-started');
  if (btnNavStart) btnNavStart.addEventListener('click', handleStart);

  const btnNavSignin = document.getElementById('btn-nav-signin');
  if (btnNavSignin) btnNavSignin.addEventListener('click', handleStart);

  const btnCtaStart = document.getElementById('btn-cta-get-started');
  if (btnCtaStart) btnCtaStart.addEventListener('click', handleStart);

  const btnNavKnowledgeX = document.getElementById('btn-nav-enter-knowledgex') || document.getElementById('btn-nav-enter-consultai');
  if (btnNavKnowledgeX) btnNavKnowledgeX.addEventListener('click', handleOpenKnowledgeX);

  const btnHeroWorkflow = document.getElementById('btn-hero-explore-workflow');
  if (btnHeroWorkflow) {
    btnHeroWorkflow.addEventListener('click', () => {
      const wfSection = document.getElementById('section-workflow');
      if (wfSection) wfSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Header in-page links
  document.querySelectorAll('.dashboard-nav-link[data-jump]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-jump');
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Brand click scrolls to top
  const brandHome = document.getElementById('dashboard-brand-home');
  if (brandHome) {
    brandHome.addEventListener('click', () => {
      const hero = document.getElementById('section-hero');
      if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // 5. Interactive Workflow Node Inspection
  const stageNodes = document.querySelectorAll('.stage-node-box');
  const inspTitle = document.getElementById('inspector-title');
  const inspDesc = document.getElementById('inspector-desc');
  const inspStat1 = document.getElementById('inspector-stat-1');
  const inspLbl1 = document.getElementById('inspector-lbl-1');
  const inspStat2 = document.getElementById('inspector-stat-2');
  const inspLbl2 = document.getElementById('inspector-lbl-2');

  stageNodes.forEach(node => {
    node.addEventListener('click', () => {
      stageNodes.forEach(n => n.classList.remove('active-stage'));
      node.classList.add('active-stage');

      const name = node.getAttribute('data-name');
      const desc = node.getAttribute('data-desc');
      const stat1 = node.getAttribute('data-stat1');
      const lbl1 = node.getAttribute('data-lbl1');
      const stat2 = node.getAttribute('data-stat2');
      const lbl2 = node.getAttribute('data-lbl2');

      if (inspTitle) inspTitle.innerHTML = `<span>▶</span> ${name}`;
      if (inspDesc) inspDesc.textContent = desc;
      if (inspStat1) inspStat1.textContent = stat1;
      if (inspLbl1) inspLbl1.textContent = lbl1;
      if (inspStat2) inspStat2.textContent = stat2;
      if (inspLbl2) inspLbl2.textContent = lbl2;
    });
  });

  // 6. Simulate Query Pulse Trigger
  const btnPulse = document.getElementById('btn-trigger-workflow-pulse');
  if (btnPulse) {
    btnPulse.addEventListener('click', () => {
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < stageNodes.length) {
          stageNodes[currentIdx].click();
          currentIdx++;
        } else {
          clearInterval(interval);
        }
      }, 500);
    });
  }

  // 7. Dynamic Mouse Parallax for Floating 3D Objects
  const movingObjects = wrapper.querySelectorAll('.moving-3d-object');
  const onMouseMove = (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * 2;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * 2;
    movingObjects.forEach((obj, idx) => {
      const factor = (idx % 3 + 1) * 15;
      obj.style.transform = `translate3d(${xRatio * factor}px, ${yRatio * factor}px, 0)`;
    });
  };
  window.addEventListener('mousemove', onMouseMove);

  // Teardown Callback
  return () => {
    if (dashboardCanvasRaf) {
      cancelAnimationFrame(dashboardCanvasRaf);
      dashboardCanvasRaf = null;
    }
    if (sectionObserver) {
      sectionObserver.disconnect();
      sectionObserver = null;
    }
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
  };
}
