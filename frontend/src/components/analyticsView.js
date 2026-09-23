export function renderAnalyticsView(analyticsData) {
  const docsCount = analyticsData?.indexed_documents_count ?? 0;
  const totalChunks = analyticsData?.tokens_processed ? Math.round(analyticsData.tokens_processed / 600) : 0;
  const topSources = analyticsData?.top_sources || [];

  const metrics = [
    { label: "Active Knowledge Base Docs", value: `${docsCount} Documents`, change: docsCount > 0 ? "Supabase Live" : "Empty" },
    { label: "Indexed Vector Chunks", value: `${totalChunks}`, change: totalChunks > 0 ? "pgvector Active" : "No Chunks" },
    { label: "AI Model", value: "GPT-4.1 Mini", change: "Azure Connected" },
    { label: "Embedding Engine", value: "text-embedding-3", change: "1536 dims" }
  ];

  return `
    <div class="full-tab-workspace">
      <div>
        <h1 class="tab-header-title">Executive Analytics & Usage</h1>
        <p class="tab-header-desc">Telemetry metrics on knowledge synthesis, execution latency, and top cited sources from your Supabase database.</p>
      </div>

      <div class="analytics-metrics-grid">
        ${metrics.map(m => `
          <div class="metric-stat-card">
            <span class="metric-label">${m.label}</span>
            <span class="metric-value">${m.value}</span>
            <span style="font-size:0.75rem;font-weight:600;color:${m.change.includes('Live') || m.change.includes('Active') || m.change.includes('Connected') ? '#059669' : '#94A3B8'};">${m.change}</span>
          </div>
        `).join('')}
      </div>

      <div style="background:#FFFFFF;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1.25rem;margin-top:1rem;">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:0.75rem;">Your Documents in Supabase Vector Store</h3>
        <div style="display:flex;flex-direction:column;gap:0.6rem;">
          ${topSources.length ? topSources.map(s => `
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;padding:0.4rem 0;border-bottom:1px solid var(--color-border);">
              <span style="font-weight:600;">📄 ${s.name}</span>
              <span style="color:var(--color-primary);font-weight:700;">${s.queries} vector chunks</span>
            </div>
          `).join('') : `
            <div style="color:var(--color-text-muted);font-size:0.85rem;">No documents uploaded yet. Go to Documents to upload your first PDF or image.</div>
          `}
        </div>
      </div>
    </div>
  `;
}
