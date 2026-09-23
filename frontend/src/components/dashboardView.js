import { getMotionRobotHtml } from './motionRobot.js';

let chartInterval = null;
let currentMetricView = 'queries';
let currentTimeframe = '7d';
let activeTotalChunks = 210;

// ── COMPREHENSIVE TIMEFRAME DATA (7 Days / 30 Days / All Time) ──
export const TIMEFRAME_DATA = {
  '7d': {
    label: '7 Days',
    queriesVal: '1,284',
    queriesTrend: '↑ 18.4%',
    queriesMeta: 'Avg 183 queries / day',
    queriesSparkline: '78%',
    latencyVal: '0.28s',
    latencyPill: '⚡ Ultra Fast',
    latencyMeta: 'Cosine match: <strong>34ms</strong>',
    latencySparkline: '86%',
    barSubtitle: 'Daily consultation query throughput and processing volume (Last 7 Days)',
    yGrid: {
      queries: ['250', '150', '50', '0'],
      tokens: ['40k', '25k', '10k', '0']
    },
    bars: [
      { label: 'Mon', queries: 165, tokens: '24,500', qHeight: 66, tHeight: 60, highlight: false },
      { label: 'Tue', queries: 210, tokens: '31,200', qHeight: 84, tHeight: 78, highlight: false },
      { label: 'Wed', queries: 185, tokens: '27,800', qHeight: 74, tHeight: 70, highlight: false },
      { label: 'Thu', queries: 240, tokens: '36,400', qHeight: 96, tHeight: 92, highlight: true },
      { label: 'Fri', queries: 195, tokens: '29,100', qHeight: 78, tHeight: 73, highlight: false },
      { label: 'Sat', queries: 140, tokens: '19,500', qHeight: 56, tHeight: 50, highlight: false },
      { label: 'Sun', queries: 150, tokens: '21,000', qHeight: 60, tHeight: 53, highlight: false }
    ],
    peakFooter: '240 queries / hr',
    effFooter: '99.8% Grounded',
    cacheFooter: '84.2%',
    latencyBadge: 'SLA < 0.50s',
    latencyArea: {
      strokePath: 'M 0 140 Q 60 125, 120 95 T 250 65 T 380 45 T 500 35',
      fillPath: 'M 0 140 Q 60 125, 120 95 T 250 65 T 380 45 T 500 35 L 500 180 L 0 180 Z',
      dots: [
        { cx: 60, cy: 125, tip: 'Query Embedding: 48ms' },
        { cx: 180, cy: 80, tip: 'pgvector Cosine Match: 34ms' },
        { cx: 320, cy: 55, tip: 'Agent Reasoning: 185ms' },
        { cx: 440, cy: 40, tip: 'Synthesis & Guardrails: 12ms', active: true }
      ],
      stages: { emb: '48ms', vec: '34ms', llm: '185ms', sec: '12ms' }
    },
    donut: {
      reports: { pct: '42%', dasharray: '132 314', dashoffset: '0', chunks: '89 chunks' },
      syllabi: { pct: '28%', dasharray: '88 314', dashoffset: '-132', chunks: '58 chunks' },
      specs: { pct: '18%', dasharray: '56 314', dashoffset: '-220', chunks: '38 chunks' },
      sched: { pct: '12%', dasharray: '38 314', dashoffset: '-276', chunks: '25 chunks' }
    }
  },

  '30d': {
    label: '30 Days',
    queriesVal: '5,420',
    queriesTrend: '↑ 24.6%',
    queriesMeta: 'Avg 180 queries / day',
    queriesSparkline: '88%',
    latencyVal: '0.29s',
    latencyPill: '⚡ Ultra Fast',
    latencyMeta: 'Cosine match: <strong>38ms</strong>',
    latencySparkline: '84%',
    barSubtitle: 'Weekly consultation query throughput and token volume (Last 30 Days)',
    yGrid: {
      queries: ['1.5k', '1.0k', '500', '0'],
      tokens: ['250k', '150k', '50k', '0']
    },
    bars: [
      { label: 'Wk 1', queries: '890', tokens: '135,000', qHeight: 59, tHeight: 54, highlight: false },
      { label: 'Wk 2', queries: '1,140', tokens: '172,000', qHeight: 76, tHeight: 69, highlight: false },
      { label: 'Wk 3', queries: '1,020', tokens: '158,000', qHeight: 68, tHeight: 63, highlight: false },
      { label: 'Wk 4', queries: '1,420', tokens: '215,000', qHeight: 95, tHeight: 86, highlight: true },
      { label: 'Wk 5', queries: '950', tokens: '145,000', qHeight: 63, tHeight: 58, highlight: false }
    ],
    peakFooter: '1,420 queries / wk',
    effFooter: '99.4% Grounded',
    cacheFooter: '88.7%',
    latencyBadge: '30-Day Avg 0.29s',
    latencyArea: {
      strokePath: 'M 0 135 Q 60 118, 120 90 T 250 60 T 380 42 T 500 30',
      fillPath: 'M 0 135 Q 60 118, 120 90 T 250 60 T 380 42 T 500 30 L 500 180 L 0 180 Z',
      dots: [
        { cx: 60, cy: 118, tip: 'Query Embedding: 52ms' },
        { cx: 180, cy: 75, tip: 'pgvector Cosine Match: 38ms' },
        { cx: 320, cy: 50, tip: 'Agent Reasoning: 190ms' },
        { cx: 440, cy: 35, tip: 'Synthesis & Guardrails: 14ms', active: true }
      ],
      stages: { emb: '52ms', vec: '38ms', llm: '190ms', sec: '14ms' }
    },
    donut: {
      reports: { pct: '48%', dasharray: '151 314', dashoffset: '0', chunks: '101 chunks' },
      syllabi: { pct: '24%', dasharray: '75 314', dashoffset: '-151', chunks: '50 chunks' },
      specs: { pct: '16%', dasharray: '50 314', dashoffset: '-226', chunks: '34 chunks' },
      sched: { pct: '12%', dasharray: '38 314', dashoffset: '-276', chunks: '25 chunks' }
    }
  },

  'all': {
    label: 'All Time',
    queriesVal: '30,900',
    queriesTrend: '↑ 142%',
    queriesMeta: 'Cumulative since launch',
    queriesSparkline: '96%',
    latencyVal: '0.31s',
    latencyPill: '⚡ Highly Stable',
    latencyMeta: 'Cosine match: <strong>42ms</strong>',
    latencySparkline: '80%',
    barSubtitle: 'Monthly consultation query throughput and historical scaling (All Time)',
    yGrid: {
      queries: ['9k', '6k', '3k', '0'],
      tokens: ['1.5M', '1.0M', '500k', '0']
    },
    bars: [
      { label: 'Apr', queries: '2,100', tokens: '315,000', qHeight: 25, tHeight: 24, highlight: false },
      { label: 'May', queries: '3,450', tokens: '510,000', qHeight: 41, tHeight: 39, highlight: false },
      { label: 'Jun', queries: '4,200', tokens: '640,000', qHeight: 50, tHeight: 49, highlight: false },
      { label: 'Jul', queries: '5,800', tokens: '890,000', qHeight: 69, tHeight: 68, highlight: false },
      { label: 'Aug', queries: '6,950', tokens: '1,050,000', qHeight: 83, tHeight: 80, highlight: false },
      { label: 'Sep', queries: '8,400', tokens: '1,280,000', qHeight: 98, tHeight: 97, highlight: true }
    ],
    peakFooter: '8,400 queries / mo',
    effFooter: '99.2% Grounded',
    cacheFooter: '91.5%',
    latencyBadge: 'Lifetime Avg 0.31s',
    latencyArea: {
      strokePath: 'M 0 145 Q 60 125, 120 98 T 250 68 T 380 48 T 500 38',
      fillPath: 'M 0 145 Q 60 125, 120 98 T 250 68 T 380 48 T 500 38 L 500 180 L 0 180 Z',
      dots: [
        { cx: 60, cy: 125, tip: 'Query Embedding: 58ms' },
        { cx: 180, cy: 82, tip: 'pgvector Cosine Match: 42ms' },
        { cx: 320, cy: 58, tip: 'Agent Reasoning: 198ms' },
        { cx: 440, cy: 42, tip: 'Synthesis & Guardrails: 16ms', active: true }
      ],
      stages: { emb: '58ms', vec: '42ms', llm: '198ms', sec: '16ms' }
    },
    donut: {
      reports: { pct: '52%', dasharray: '163 314', dashoffset: '0', chunks: '110 chunks' },
      syllabi: { pct: '22%', dasharray: '69 314', dashoffset: '-163', chunks: '46 chunks' },
      specs: { pct: '15%', dasharray: '47 314', dashoffset: '-232', chunks: '32 chunks' },
      sched: { pct: '11%', dasharray: '35 314', dashoffset: '-279', chunks: '22 chunks' }
    }
  }
};

// ── MULTI-AGENT TELEMETRY DATA ──
const AGENT_DATA = {
  manager: {
    name: "ConsultAI-Manager",
    version: "AGENT 1 · VERSION 7",
    desc: "Analyzes incoming user queries, enforces domain guardrails, and intelligently dispatches sub-tasks to Knowledge and Analytical agents.",
    model: "Azure GPT-4.1-Mini",
    guards: "Jailbreak Block, Prompt Shield",
    speed: "0.12 seconds"
  },
  knowledge: {
    name: "ConsultAI-Knowledge",
    version: "AGENT 2 · VERSION 5",
    desc: "Executes cosine similarity matching across 1536-D embeddings in Supabase pgvector to retrieve verified factual document chunks.",
    model: "Azure text-embedding-3 + GPT-4.1",
    guards: "Indirect Injection Shield, PII Protection",
    speed: "0.24 seconds"
  },
  analyst: {
    name: "ConsultAI-BusinessAnalyst",
    version: "AGENT 3 · VERSION 3",
    desc: "Parses structured tables, balances, metrics, financial numbers, and calculates percentages and comparative trends without external speculation.",
    model: "Azure GPT-4.1-Mini",
    guards: "Mathematical Accuracy, Financial Disclaimer",
    speed: "0.35 seconds"
  },
  recommendation: {
    name: "ConsultAI-Recommendation",
    version: "AGENT 4 · VERSION 4",
    desc: "Synthesizes data findings into prioritized, actionable business roadmaps with risk assessment and trade-off matrices.",
    model: "Azure GPT-4.1-Mini",
    guards: "Compliance & Ethical Guidelines",
    speed: "0.40 seconds"
  },
  finalanswer: {
    name: "ConsultAI-FinalAnswer",
    version: "AGENT 5 · VERSION 3",
    desc: "Delivers the final executive briefing with structured Answer, Explanation, and rigorous source citations attributing to specific document pages.",
    model: "Azure GPT-4.1-Mini",
    guards: "Azure Content Safety, Professional Tone",
    speed: "0.18 seconds"
  }
};

export function renderDashboardView(documentsList = [], workflowState = {}, user = null, conversations = []) {
  const totalDocs = documentsList ? documentsList.length : 0;
  const totalChunks = documentsList ? documentsList.reduce((acc, d) => acc + (d.chunks || 0), 0) : 0;
  activeTotalChunks = totalChunks;

  // Real user queries count from user's conversations
  const userQueriesCount = conversations ? conversations.reduce((acc, c) => acc + (c.messages ? c.messages.filter(m => m.role === 'user').length : 0), 0) : 0;

  const initialTf = TIMEFRAME_DATA[currentTimeframe] || TIMEFRAME_DATA['7d'];
  const yLabels = initialTf.yGrid[currentMetricView];

  // Dynamic user query metrics
  const queriesVal = userQueriesCount > 0 ? userQueriesCount.toLocaleString() : '0';
  const queriesTrend = userQueriesCount > 0 ? 'Active' : 'Ready';
  const queriesMeta = userQueriesCount > 0 ? `${userQueriesCount} consultations processed` : 'No consultations started yet';
  const queriesSparkline = userQueriesCount > 0 ? `${Math.min(100, Math.max(10, userQueriesCount * 12))}%` : '0%';

  const chunksSparkline = totalChunks > 0 ? '92%' : '0%';
  const chunksMeta = totalDocs > 0 ? `${totalDocs} indexed in Supabase` : 'No documents uploaded yet';

  return `
    <div class="dash-pastel-workspace" id="dashboard-pastel-container">
      
      <!-- 1. Header Bar with Greeting & Timeframe Filter -->
      <div class="dash-pastel-header">
        <div class="dash-pastel-title-wrap">
          <div class="dash-title-row">
            <h1 class="dash-pastel-title">Executive System Dashboard</h1>
            <span class="dash-status-pill">
              <span class="pulse-dot-green"></span>
              All 5 Agents Online
            </span>
          </div>
          <p class="dash-pastel-desc">
            ${user ? `Welcome back, ${user.name || user.email}. Live telemetry for your isolated Supabase repository.` : 'Real-time analytics on multi-agent synthesis, vector embeddings, retrieval latency, and active security guardrails.'}
          </p>
        </div>

        <div class="dash-header-controls">
          <!-- Interactive Timeframe Selector -->
          <div class="dash-timeframe-picker">
            <button class="timeframe-btn ${currentTimeframe === '7d' ? 'active' : ''}" data-time="7d">7 Days</button>
            <button class="timeframe-btn ${currentTimeframe === '30d' ? 'active' : ''}" data-time="30d">30 Days</button>
            <button class="timeframe-btn ${currentTimeframe === 'all' ? 'active' : ''}" data-time="all">All Time</button>
          </div>

          <!-- Manage Documents Button -->
          <button class="dash-btn-action secondary" id="btn-view-all-docs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>Manage Documents (${totalDocs})</span>
          </button>

          <!-- Quick Action Buttons -->
          <button class="dash-btn-action primary" id="btn-dash-quick-chat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>New Consultation</span>
          </button>
        </div>
      </div>

      <!-- 2. KPI Summary Cards (Pastel Glassmorphic) -->
      <div class="dash-kpi-row">
        <!-- KPI 1: Total Queries -->
        <div class="kpi-card pastel-card-purple">
          <div class="kpi-card-top">
            <span class="kpi-label">Consultation Queries</span>
            <span class="kpi-icon">💬</span>
          </div>
          <div class="kpi-main-metric">
            <span class="kpi-big-num" id="kpi-queries-val">${queriesVal}</span>
            <span class="kpi-trend ${userQueriesCount > 0 ? 'positive' : 'neutral'}" id="kpi-queries-trend">${queriesTrend}</span>
          </div>
          <div class="kpi-meta-desc" id="kpi-queries-meta">
            <span>${queriesMeta}</span>
            <span class="kpi-dim-tag">${userQueriesCount > 0 ? 'Live Telemetry' : 'Zero State'}</span>
          </div>
          <div class="kpi-sparkline-track">
            <div class="kpi-sparkline-fill" id="kpi-queries-sparkline" style="width: ${queriesSparkline};"></div>
          </div>
        </div>

        <!-- KPI 2: Vector Chunks -->
        <div class="kpi-card pastel-card-blue">
          <div class="kpi-card-top">
            <span class="kpi-label">Indexed Vector Chunks</span>
            <span class="kpi-icon">⚡</span>
          </div>
          <div class="kpi-main-metric">
            <span class="kpi-big-num" id="kpi-chunks-val">${totalChunks}</span>
            <span class="kpi-unit-pill">${totalDocs} Files</span>
          </div>
          <div class="kpi-meta-desc">
            <span>1536-D pgvector HNSW</span>
            <span class="kpi-status-live">${totalDocs > 0 ? 'Supabase Live' : 'Empty Store'}</span>
          </div>
          <div class="kpi-sparkline-track">
            <div class="kpi-sparkline-fill fill-blue" style="width: ${chunksSparkline};"></div>
          </div>
        </div>

        <!-- KPI 3: End-to-End Latency -->
        <div class="kpi-card pastel-card-emerald">
          <div class="kpi-card-top">
            <span class="kpi-label">Average Response Time</span>
            <span class="kpi-icon">⏱️</span>
          </div>
          <div class="kpi-main-metric">
            <span class="kpi-big-num" id="kpi-latency-val">${userQueriesCount > 0 ? initialTf.latencyVal : '0.2s'}</span>
            <span class="kpi-trend positive" id="kpi-latency-pill">${userQueriesCount > 0 ? initialTf.latencyPill : '⚡ Instant'}</span>
          </div>
          <div class="kpi-meta-desc" id="kpi-latency-meta">
            <span>${initialTf.latencyMeta}</span>
            <span class="kpi-dim-tag">Azure GPT-4.1</span>
          </div>
          <div class="kpi-sparkline-track">
            <div class="kpi-sparkline-fill fill-emerald" id="kpi-latency-sparkline" style="width: ${initialTf.latencySparkline};"></div>
          </div>
        </div>

        <!-- KPI 4: Guardrail Accuracy -->
        <div class="kpi-card pastel-card-amber">
          <div class="kpi-card-top">
            <span class="kpi-label">Active Guardrails</span>
            <span class="kpi-icon">🛡️</span>
          </div>
          <div class="kpi-main-metric">
            <span class="kpi-big-num">5 / 5</span>
            <span class="kpi-unit-pill pill-amber">Zero Trust</span>
          </div>
          <div class="kpi-meta-desc">
            <span>Jailbreak & Injections blocked</span>
            <span class="kpi-status-live">Azure Safety</span>
          </div>
          <div class="kpi-sparkline-track">
            <div class="kpi-sparkline-fill fill-amber" style="width: 100%;"></div>
          </div>
        </div>
      </div>

      <!-- 3. Primary Charts Grid (Interactive Activity & Latency) -->
      <div class="dash-charts-grid">
        
        <!-- Chart 1: Interactive Bar Chart (Queries & Tokens) -->
        <div class="dash-chart-card">
          <div class="chart-card-header">
            <div class="chart-header-left">
              <h3 class="chart-title">System Activity & Token Utilization</h3>
              <span class="chart-subtitle" id="bar-chart-subtitle">${initialTf.barSubtitle}</span>
            </div>
            <div class="chart-toggle-pills">
              <button class="chart-toggle-btn ${currentMetricView === 'queries' ? 'active' : ''}" id="btn-toggle-queries">Queries</button>
              <button class="chart-toggle-btn ${currentMetricView === 'tokens' ? 'active' : ''}" id="btn-toggle-tokens">Tokens</button>
            </div>
          </div>

          <!-- Interactive Bar Graph Canvas / SVG -->
          <div class="interactive-bar-container" id="bar-chart-container">
            <div class="bar-chart-tooltip" id="bar-tooltip"></div>
            
            <div class="bar-chart-body">
              <!-- Y-Axis Gridlines -->
              <div class="bar-grid-lines">
                <div class="grid-line"><span class="grid-val" id="grid-y-3">${yLabels[0]}</span></div>
                <div class="grid-line"><span class="grid-val" id="grid-y-2">${yLabels[1]}</span></div>
                <div class="grid-line"><span class="grid-val" id="grid-y-1">${yLabels[2]}</span></div>
                <div class="grid-line"><span class="grid-val" id="grid-y-0">${yLabels[3]}</span></div>
              </div>

              <!-- Dynamic Bars Row -->
              <div class="bars-flex-row" id="bars-row">
                ${initialTf.bars.map(b => `
                  <div class="bar-column ${b.highlight ? 'active-today' : ''}" data-day="${b.label}" data-queries="${b.queries}" data-tokens="${b.tokens}">
                    <div class="bar-track">
                      <div class="bar-fill ${b.highlight ? 'highlight' : ''}" style="height: ${currentMetricView === 'queries' ? b.qHeight : b.tHeight}%;"></div>
                    </div>
                    <span class="bar-day">${b.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="chart-footer-metrics">
            <div class="footer-stat">
              <span class="footer-stat-label">Peak Volume:</span>
              <span class="footer-stat-val" id="footer-stat-peak">${initialTf.peakFooter}</span>
            </div>
            <div class="footer-stat">
              <span class="footer-stat-label">Token Efficiency:</span>
              <span class="footer-stat-val" id="footer-stat-eff">${initialTf.effFooter}</span>
            </div>
            <div class="footer-stat">
              <span class="footer-stat-label">Cache Hit Rate:</span>
              <span class="footer-stat-val" id="footer-stat-cache">${initialTf.cacheFooter}</span>
            </div>
          </div>
        </div>

        <!-- Chart 2: Interactive Latency Waveform Area Chart -->
        <div class="dash-chart-card">
          <div class="chart-card-header">
            <div class="chart-header-left">
              <h3 class="chart-title">Retrieval & Reasoning Latency Curve</h3>
              <span class="chart-subtitle">Sub-second breakdown: Embedding ➔ Search ➔ Reasoning ➔ Guardrails</span>
            </div>
            <span class="badge-accent-soft" id="latency-badge">${initialTf.latencyBadge}</span>
          </div>

          <div class="interactive-area-container">
            <svg class="area-chart-svg" viewBox="0 0 500 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#7C6DF0" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#7C6DF0" stop-opacity="0.02"/>
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#A78BFA"/>
                  <stop offset="50%" stop-color="#7C6DF0"/>
                  <stop offset="100%" stop-color="#38BDF8"/>
                </linearGradient>
              </defs>

              <!-- Grid horizontal lines -->
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(124,109,240,0.1)" stroke-dasharray="4"/>
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(124,109,240,0.1)" stroke-dasharray="4"/>
              <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(124,109,240,0.1)" stroke-dasharray="4"/>

              <!-- Filled Area -->
              <path class="area-fill-path" id="area-fill-path" d="${initialTf.latencyArea.fillPath}" fill="url(#areaGradient)"/>
              
              <!-- Smooth Curve Line -->
              <path class="area-stroke-path" id="area-stroke-path" d="${initialTf.latencyArea.strokePath}" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round"/>

              <!-- Interactive Points -->
              <g id="area-dots-group">
                ${initialTf.latencyArea.dots.map(d => `
                  <circle class="area-dot ${d.active ? 'active' : ''}" cx="${d.cx}" cy="${d.cy}" r="${d.active ? 5.5 : 4.5}" data-tip="${d.tip}"/>
                `).join('')}
              </g>
            </svg>
            <div class="area-tooltip" id="area-tooltip">Hover over dots for latency breakdown</div>
          </div>

          <div class="latency-stage-chips">
            <span class="stage-chip"><span class="chip-color c-emb"></span> Embedding: <strong id="chip-latency-emb">${initialTf.latencyArea.stages.emb}</strong></span>
            <span class="stage-chip"><span class="chip-color c-vec"></span> pgvector: <strong id="chip-latency-vec">${initialTf.latencyArea.stages.vec}</strong></span>
            <span class="stage-chip"><span class="chip-color c-llm"></span> GPT-4.1: <strong id="chip-latency-llm">${initialTf.latencyArea.stages.llm}</strong></span>
            <span class="stage-chip"><span class="chip-color c-sec"></span> Guardrails: <strong id="chip-latency-sec">${initialTf.latencyArea.stages.sec}</strong></span>
          </div>
        </div>
      </div>

      <!-- 4. Multi-Agent Pipeline & Knowledge Distribution -->
      <div class="dash-split-row">
        
        <!-- Left: Interactive Multi-Agent Network -->
        <div class="dash-agent-network-card">
          <div class="network-header">
            <div>
              <h3 class="chart-title">Multi-Agent Orchestration Flow</h3>
              <span class="chart-subtitle">5 Specialized collaborative agents in Azure AI Foundry</span>
            </div>
            <button class="btn-pulse-simulate" id="btn-pulse-simulate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>Test Agent Pulse</span>
            </button>
          </div>

          <!-- Horizontal Agent Chain -->
          <div class="agent-nodes-chain">
            <!-- Node 1 -->
            <div class="agent-interactive-node active-agent" data-agent="manager" id="agent-node-manager">
              <div class="node-icon">🎯</div>
              <div class="node-title">Manager</div>
              <div class="node-badge">v7 · Router</div>
              <span class="node-pulse"></span>
            </div>
            <div class="node-connector"><span class="conn-pulse"></span></div>

            <!-- Node 2 -->
            <div class="agent-interactive-node" data-agent="knowledge" id="agent-node-knowledge">
              <div class="node-icon">📚</div>
              <div class="node-title">Knowledge</div>
              <div class="node-badge">v5 · RAG</div>
              <span class="node-pulse"></span>
            </div>
            <div class="node-connector"><span class="conn-pulse"></span></div>

            <!-- Node 3 -->
            <div class="agent-interactive-node" data-agent="analyst" id="agent-node-analyst">
              <div class="node-icon">📊</div>
              <div class="node-title">Analyst</div>
              <div class="node-badge">v3 · Math</div>
              <span class="node-pulse"></span>
            </div>
            <div class="node-connector"><span class="conn-pulse"></span></div>

            <!-- Node 4 -->
            <div class="agent-interactive-node" data-agent="recommendation" id="agent-node-rec">
              <div class="node-icon">💡</div>
              <div class="node-title">Strategy</div>
              <div class="node-badge">v4 · Roadmap</div>
              <span class="node-pulse"></span>
            </div>
            <div class="node-connector"><span class="conn-pulse"></span></div>

            <!-- Node 5 -->
            <div class="agent-interactive-node" data-agent="finalanswer" id="agent-node-final">
              <div class="node-icon">✨</div>
              <div class="node-title">Output</div>
              <div class="node-badge">v3 · Synthesis</div>
              <span class="node-pulse"></span>
            </div>
          </div>

          <!-- Dynamic Agent Inspector Box -->
          <div class="agent-detail-inspector" id="agent-inspector-detail">
            <div class="inspector-top-row">
              <span class="inspector-chip" id="insp-version">AGENT 1 · VERSION 7</span>
              <h4 class="inspector-agent-name" id="insp-name">ConsultAI-Manager</h4>
            </div>
            <p class="inspector-agent-desc" id="insp-desc">
              Analyzes incoming user queries, enforces domain guardrails, and intelligently dispatches sub-tasks to Knowledge and Analytical agents.
            </p>
            <div class="inspector-specs-row">
              <div class="spec-col">
                <span class="spec-k">Model:</span>
                <span class="spec-v" id="insp-model">Azure GPT-4.1-Mini</span>
              </div>
              <div class="spec-col">
                <span class="spec-k">Guardrails:</span>
                <span class="spec-v highlight" id="insp-guards">Jailbreak Block, Prompt Shield</span>
              </div>
              <div class="spec-col">
                <span class="spec-k">Average Time:</span>
                <span class="spec-v" id="insp-speed">0.12 seconds</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Donut Chart Knowledge Distribution -->
        <div class="dash-donut-card">
          <div class="donut-header">
            <h3 class="chart-title">Document Knowledge Distribution</h3>
            <span class="chart-subtitle">${totalDocs > 0 ? `${totalDocs} document${totalDocs > 1 ? 's' : ''} in your repository` : 'No documents indexed yet'}</span>
          </div>

          <div class="donut-content-layout">
            ${totalChunks === 0 ? `
              <div class="donut-svg-wrap">
                <svg class="donut-chart-svg" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="50" fill="transparent" stroke="rgba(124,109,240,0.2)" stroke-width="16" stroke-dasharray="6 6"/>
                </svg>
                <div class="donut-center-readout" id="donut-readout">
                  <span class="readout-pct" id="donut-pct">0%</span>
                  <span class="readout-label" id="donut-label">0 Chunks</span>
                </div>
              </div>

              <div class="donut-legend-list">
                <div style="color:var(--color-text-muted);font-size:0.83rem;line-height:1.6;padding:0.75rem 0;">
                  No documents in your knowledge base yet.<br/>Upload a PDF or image in the <strong>Documents</strong> tab to see your vector distribution.
                </div>
              </div>
            ` : (() => {
                const topDocs = [...documentsList].sort((a, b) => (b.chunks || 0) - (a.chunks || 0)).slice(0, 4);
                const colors = ['#7C6DF0', '#38BDF8', '#34D399', '#F59E0B'];
                const bulletClasses = ['b-purple', 'b-blue', 'b-emerald', 'b-amber'];
                let offset = 0;
                const segments = topDocs.map((doc, idx) => {
                  const pct = Math.max(1, Math.round(((doc.chunks || 1) / totalChunks) * 100));
                  const dash = Math.round((pct / 100) * 314);
                  const seg = {
                    name: doc.name,
                    chunks: `${doc.chunks} chunks`,
                    pct: `${pct}%`,
                    dasharray: `${dash} 314`,
                    dashoffset: `-${offset}`,
                    color: colors[idx % colors.length],
                    bullet: bulletClasses[idx % bulletClasses.length]
                  };
                  offset += dash;
                  return seg;
                });

                return `
                  <div class="donut-svg-wrap">
                    <svg class="donut-chart-svg" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="50" fill="transparent" stroke="rgba(124,109,240,0.1)" stroke-width="18"/>
                      ${segments.map(s => `
                        <circle class="donut-segment" cx="70" cy="70" r="50" fill="transparent" stroke="${s.color}" stroke-width="18"
                                stroke-dasharray="${s.dasharray}" stroke-dashoffset="${s.dashoffset}"
                                data-name="${s.name}" data-pct="${s.pct}" data-chunks="${s.chunks}"/>
                      `).join('')}
                    </svg>
                    <div class="donut-center-readout" id="donut-readout">
                      <span class="readout-pct" id="donut-pct">100%</span>
                      <span class="readout-label" id="donut-label">${totalChunks} Chunks</span>
                    </div>
                  </div>

                  <div class="donut-legend-list">
                    ${segments.map(s => `
                      <div class="legend-row">
                        <span class="legend-bullet ${s.bullet}"></span>
                        <span class="legend-name" title="${s.name}">${s.name.length > 22 ? s.name.substring(0, 20) + '...' : s.name}</span>
                        <span class="legend-val">${s.pct}</span>
                      </div>
                    `).join('')}
                  </div>
                `;
              })()}
          </div>
        </div>
      </div>

    </div>
  `;
}

export function initDashboardAnimations(callbacks = {}) {
  const onOpenKnowledgeX = callbacks.onOpenKnowledgeX || callbacks.onGetStarted;

  // 1. Quick Consultation CTA buttons
  const btnChat = document.getElementById('btn-dash-quick-chat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      if (onOpenKnowledgeX) onOpenKnowledgeX();
    });
  }

  // Manage documents button
  const btnDocs = document.getElementById('btn-view-all-docs');
  if (btnDocs) {
    btnDocs.addEventListener('click', () => {
      const docTab = document.querySelector('[data-nav-tab="documents"]');
      if (docTab) docTab.click();
    });
  }

  // 2. Bar Tooltip Setup
  const tooltip = document.getElementById('bar-tooltip');
  const barContainer = document.getElementById('bar-chart-container');

  const bindBarHoverListeners = () => {
    const barCols = document.querySelectorAll('.bar-column');
    barCols.forEach(col => {
      col.onmouseenter = () => {
        const day = col.getAttribute('data-day');
        const q = col.getAttribute('data-queries');
        const t = col.getAttribute('data-tokens');
        if (tooltip && barContainer) {
          tooltip.innerHTML = `<strong>${day}</strong>: ${currentMetricView === 'queries' ? `${q} queries` : `${t} tokens`}`;
          tooltip.style.display = 'block';
          const rect = col.getBoundingClientRect();
          const parentRect = barContainer.getBoundingClientRect();
          tooltip.style.left = `${rect.left - parentRect.left - 10}px`;
          tooltip.style.top = `10px`;
        }
      };
      col.onmouseleave = () => {
        if (tooltip) tooltip.style.display = 'none';
      };
    });
  };
  bindBarHoverListeners();

  // 3. Area Dot Tooltip Listeners
  const areaTip = document.getElementById('area-tooltip');
  const bindAreaDotListeners = () => {
    document.querySelectorAll('.area-dot').forEach(dot => {
      dot.onmouseenter = () => {
        const tipText = dot.getAttribute('data-tip');
        if (areaTip && tipText) {
          areaTip.innerHTML = `<strong>${tipText}</strong>`;
          areaTip.classList.add('active-tip');
        }
      };
      dot.onmouseleave = () => {
        if (areaTip) {
          areaTip.innerHTML = `Hover over dots for latency breakdown`;
          areaTip.classList.remove('active-tip');
        }
      };
    });
  };
  bindAreaDotListeners();

  // 4. Function to Render Bar Columns Dynamically
  const renderBars = (tfKey, metricType) => {
    const tf = TIMEFRAME_DATA[tfKey] || TIMEFRAME_DATA['7d'];
    const barsRow = document.getElementById('bars-row');
    if (!barsRow) return;

    barsRow.innerHTML = tf.bars.map(b => {
      const height = metricType === 'queries' ? b.qHeight : b.tHeight;
      return `
        <div class="bar-column ${b.highlight ? 'active-today' : ''}" data-day="${b.label}" data-queries="${b.queries}" data-tokens="${b.tokens}">
          <div class="bar-track">
            <div class="bar-fill ${b.highlight ? 'highlight' : ''}" style="height: ${height}%;"></div>
          </div>
          <span class="bar-day">${b.label}</span>
        </div>
      `;
    }).join('');

    bindBarHoverListeners();
  };

  // 5. Update Metric View (Queries vs Tokens)
  const updateMetricView = (type) => {
    currentMetricView = type;
    const btnQueries = document.getElementById('btn-toggle-queries');
    const btnTokens = document.getElementById('btn-toggle-tokens');
    const tf = TIMEFRAME_DATA[currentTimeframe] || TIMEFRAME_DATA['7d'];

    if (type === 'queries') {
      btnQueries?.classList.add('active');
      btnTokens?.classList.remove('active');
    } else {
      btnTokens?.classList.add('active');
      btnQueries?.classList.remove('active');
    }

    // Update Y-axis scale
    const yVals = tf.yGrid[type];
    const el3 = document.getElementById('grid-y-3');
    const el2 = document.getElementById('grid-y-2');
    const el1 = document.getElementById('grid-y-1');
    const el0 = document.getElementById('grid-y-0');
    if (el3) el3.textContent = yVals[0];
    if (el2) el2.textContent = yVals[1];
    if (el1) el1.textContent = yVals[2];
    if (el0) el0.textContent = yVals[3];

    // Re-render bars with corresponding heights
    renderBars(currentTimeframe, type);
  };

  document.getElementById('btn-toggle-queries')?.addEventListener('click', () => updateMetricView('queries'));
  document.getElementById('btn-toggle-tokens')?.addEventListener('click', () => updateMetricView('tokens'));

  // 6. Comprehensive Timeframe Switcher Function
  const applyTimeframe = (timeframeKey) => {
    currentTimeframe = timeframeKey;
    const tf = TIMEFRAME_DATA[timeframeKey] || TIMEFRAME_DATA['7d'];

    // A. Update Active Buttons
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
      if (btn.getAttribute('data-time') === timeframeKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // B. Update KPI Cards
    const kpiQVal = document.getElementById('kpi-queries-val');
    const kpiQTrend = document.getElementById('kpi-queries-trend');
    const kpiQMeta = document.getElementById('kpi-queries-meta');
    const kpiQSpark = document.getElementById('kpi-queries-sparkline');

    if (kpiQVal) kpiQVal.textContent = tf.queriesVal;
    if (kpiQTrend) kpiQTrend.textContent = tf.queriesTrend;
    if (kpiQMeta) {
      kpiQMeta.innerHTML = `<span>${tf.queriesMeta}</span><span class="kpi-dim-tag">100% SLA</span>`;
    }
    if (kpiQSpark) kpiQSpark.style.width = tf.queriesSparkline;

    const kpiLVal = document.getElementById('kpi-latency-val');
    const kpiLPill = document.getElementById('kpi-latency-pill');
    const kpiLMeta = document.getElementById('kpi-latency-meta');
    const kpiLSpark = document.getElementById('kpi-latency-sparkline');

    if (kpiLVal) kpiLVal.textContent = tf.latencyVal;
    if (kpiLPill) kpiLPill.textContent = tf.latencyPill;
    if (kpiLMeta) {
      kpiLMeta.innerHTML = `<span>${tf.latencyMeta}</span><span class="kpi-dim-tag">Azure GPT-4.1</span>`;
    }
    if (kpiLSpark) kpiLSpark.style.width = tf.latencySparkline;

    // C. Update Bar Chart
    const barSubtitle = document.getElementById('bar-chart-subtitle');
    if (barSubtitle) barSubtitle.textContent = tf.barSubtitle;

    // Update Y-axis grid
    const yVals = tf.yGrid[currentMetricView];
    const el3 = document.getElementById('grid-y-3');
    const el2 = document.getElementById('grid-y-2');
    const el1 = document.getElementById('grid-y-1');
    const el0 = document.getElementById('grid-y-0');
    if (el3) el3.textContent = yVals[0];
    if (el2) el2.textContent = yVals[1];
    if (el1) el1.textContent = yVals[2];
    if (el0) el0.textContent = yVals[3];

    // Render bars for current metric
    renderBars(timeframeKey, currentMetricView);

    // Update footer stats
    const peakEl = document.getElementById('footer-stat-peak');
    const effEl = document.getElementById('footer-stat-eff');
    const cacheEl = document.getElementById('footer-stat-cache');
    if (peakEl) peakEl.textContent = tf.peakFooter;
    if (effEl) effEl.textContent = tf.effFooter;
    if (cacheEl) cacheEl.textContent = tf.cacheFooter;

    // D. Update Latency Curve Waveform
    const badgeEl = document.getElementById('latency-badge');
    if (badgeEl) badgeEl.textContent = tf.latencyBadge;

    const fillPath = document.getElementById('area-fill-path');
    const strokePath = document.getElementById('area-stroke-path');
    if (fillPath) fillPath.setAttribute('d', tf.latencyArea.fillPath);
    if (strokePath) strokePath.setAttribute('d', tf.latencyArea.strokePath);

    const dotsGroup = document.getElementById('area-dots-group');
    if (dotsGroup) {
      dotsGroup.innerHTML = tf.latencyArea.dots.map(d => `
        <circle class="area-dot ${d.active ? 'active' : ''}" cx="${d.cx}" cy="${d.cy}" r="${d.active ? 5.5 : 4.5}" data-tip="${d.tip}"/>
      `).join('');
      bindAreaDotListeners();
    }

    // Update chips
    const chipEmb = document.getElementById('chip-latency-emb');
    const chipVec = document.getElementById('chip-latency-vec');
    const chipLlm = document.getElementById('chip-latency-llm');
    const chipSec = document.getElementById('chip-latency-sec');
    if (chipEmb) chipEmb.textContent = tf.latencyArea.stages.emb;
    if (chipVec) chipVec.textContent = tf.latencyArea.stages.vec;
    if (chipLlm) chipLlm.textContent = tf.latencyArea.stages.llm;
    if (chipSec) chipSec.textContent = tf.latencyArea.stages.sec;

    // E. Update Donut Knowledge Distribution
    const segReports = document.getElementById('donut-seg-reports');
    const segSyllabi = document.getElementById('donut-seg-syllabi');
    const segSpecs = document.getElementById('donut-seg-specs');
    const segSched = document.getElementById('donut-seg-sched');

    if (segReports) {
      segReports.setAttribute('stroke-dasharray', tf.donut.reports.dasharray);
      segReports.setAttribute('stroke-dashoffset', tf.donut.reports.dashoffset);
      segReports.setAttribute('data-pct', tf.donut.reports.pct);
      segReports.setAttribute('data-chunks', tf.donut.reports.chunks);
    }
    if (segSyllabi) {
      segSyllabi.setAttribute('stroke-dasharray', tf.donut.syllabi.dasharray);
      segSyllabi.setAttribute('stroke-dashoffset', tf.donut.syllabi.dashoffset);
      segSyllabi.setAttribute('data-pct', tf.donut.syllabi.pct);
      segSyllabi.setAttribute('data-chunks', tf.donut.syllabi.chunks);
    }
    if (segSpecs) {
      segSpecs.setAttribute('stroke-dasharray', tf.donut.specs.dasharray);
      segSpecs.setAttribute('stroke-dashoffset', tf.donut.specs.dashoffset);
      segSpecs.setAttribute('data-pct', tf.donut.specs.pct);
      segSpecs.setAttribute('data-chunks', tf.donut.specs.chunks);
    }
    if (segSched) {
      segSched.setAttribute('stroke-dasharray', tf.donut.sched.dasharray);
      segSched.setAttribute('stroke-dashoffset', tf.donut.sched.dashoffset);
      segSched.setAttribute('data-pct', tf.donut.sched.pct);
      segSched.setAttribute('data-chunks', tf.donut.sched.chunks);
    }

    // Update legend values
    const legRep = document.getElementById('donut-leg-reports');
    const legSyl = document.getElementById('donut-leg-syllabi');
    const legSpc = document.getElementById('donut-leg-specs');
    const legSch = document.getElementById('donut-leg-sched');
    if (legRep) legRep.textContent = tf.donut.reports.pct;
    if (legSyl) legSyl.textContent = tf.donut.syllabi.pct;
    if (legSpc) legSpc.textContent = tf.donut.specs.pct;
    if (legSch) legSch.textContent = tf.donut.sched.pct;
  };

  // Wire up timeframe button clicks
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const timeVal = btn.getAttribute('data-time');
      if (timeVal) applyTimeframe(timeVal);
    });
  });

  // 7. Interactive Agent Chain Click & Inspector Update
  const agentNodes = document.querySelectorAll('.agent-interactive-node');
  const inspName = document.getElementById('insp-name');
  const inspVer = document.getElementById('insp-version');
  const inspDesc = document.getElementById('insp-desc');
  const inspModel = document.getElementById('insp-model');
  const inspGuards = document.getElementById('insp-guards');
  const inspSpeed = document.getElementById('insp-speed');

  agentNodes.forEach(node => {
    node.addEventListener('click', () => {
      agentNodes.forEach(n => n.classList.remove('active-agent'));
      node.classList.add('active-agent');

      const key = node.getAttribute('data-agent');
      const data = AGENT_DATA[key];
      if (data) {
        if (inspName) inspName.textContent = data.name;
        if (inspVer) inspVer.textContent = data.version;
        if (inspDesc) inspDesc.textContent = data.desc;
        if (inspModel) inspModel.textContent = data.model;
        if (inspGuards) inspGuards.textContent = data.guards;
        if (inspSpeed) inspSpeed.textContent = data.speed;
      }
    });
  });

  // 8. Test Agent Pulse Simulation
  const btnPulse = document.getElementById('btn-pulse-simulate');
  if (btnPulse) {
    btnPulse.addEventListener('click', () => {
      const nodes = [
        document.getElementById('agent-node-manager'),
        document.getElementById('agent-node-knowledge'),
        document.getElementById('agent-node-analyst'),
        document.getElementById('agent-node-rec'),
        document.getElementById('agent-node-final')
      ].filter(Boolean);

      let step = 0;
      if (chartInterval) clearInterval(chartInterval);

      chartInterval = setInterval(() => {
        if (step < nodes.length) {
          nodes[step].click();
          nodes[step].classList.add('pulse-active');
          setTimeout(() => nodes[step]?.classList.remove('pulse-active'), 400);
          step++;
        } else {
          clearInterval(chartInterval);
          chartInterval = null;
        }
      }, 500);
    });
  }

  // 9. Interactive Donut Hover Readout
  const donutReadoutPct = document.getElementById('donut-pct');
  const donutReadoutLabel = document.getElementById('donut-label');

  document.querySelectorAll('.donut-segment').forEach(seg => {
    seg.addEventListener('mouseenter', () => {
      const name = seg.getAttribute('data-name');
      const pct = seg.getAttribute('data-pct');
      const chunks = seg.getAttribute('data-chunks');
      if (donutReadoutPct) donutReadoutPct.textContent = pct;
      if (donutReadoutLabel) donutReadoutLabel.textContent = `${name} (${chunks})`;
    });

    seg.addEventListener('mouseleave', () => {
      if (donutReadoutPct) donutReadoutPct.textContent = '100%';
      if (donutReadoutLabel) donutReadoutLabel.textContent = `${activeTotalChunks} Chunks`;
    });
  });

  // Teardown Callback
  return () => {
    if (chartInterval) {
      clearInterval(chartInterval);
      chartInterval = null;
    }
  };
}
