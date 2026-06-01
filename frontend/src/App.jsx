import React, { useState, useEffect, useRef } from 'react';

// Setup basic configuration
const API_BASE = '/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [activeTab, setActiveTab] = useState('assets'); // assets, inspections, reports
  const [error, setError] = useState('');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Assets state
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); // null for create, asset object for edit
  const [assetForm, setAssetForm] = useState({ name: '', code: '', type: 'turbine', status: 'active' });

  // Inspections state
  const [inspections, setInspections] = useState([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showInspectionDetailModal, setShowInspectionDetailModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({ asset_id: '', findings: '', recommendations: '' });
  
  // Editing inspection (admin status approval or inspector edits)
  const [editFindings, setEditFindings] = useState('');
  const [editRecommendations, setEditRecommendations] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Reports state
  const [reportSummary, setReportSummary] = useState(null);
  const [listenerCount, setListenerCount] = useState(0);

  // File Upload Reference
  const fileInputRef = useRef(null);

  // Set auth tokens helper
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setAssets([]);
    setInspections([]);
    setReportSummary(null);
  };

  // Fetch functions with Auth headers
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      // If unauthorized/token expired, force log out
      if (token) handleLogout();
    }
    return res;
  };

  // Load active tab data
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'assets') fetchAssets();
    if (activeTab === 'inspections') fetchInspections();
    if (activeTab === 'reports') fetchReportSummary();
  }, [token, activeTab]);

  // Load search query for assets
  useEffect(() => {
    if (!token) return;
    const delayDebounceFn = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Assets Actions
  const fetchAssets = async () => {
    try {
      const url = searchQuery 
        ? `${API_BASE}/assets/search?q=${encodeURIComponent(searchQuery)}`
        : `${API_BASE}/assets`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const saveAsset = async (e) => {
    e.preventDefault();
    try {
      const method = editingAsset ? 'PUT' : 'POST';
      const url = editingAsset ? `${API_BASE}/assets/${editingAsset.id}` : `${API_BASE}/assets`;
      
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(assetForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save asset');

      setShowAssetModal(false);
      setEditingAsset(null);
      setAssetForm({ name: '', code: '', type: 'turbine', status: 'active' });
      fetchAssets();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset? This will delete all linked inspections.')) return;
    try {
      const res = await authFetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAssets();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete asset');
      }
    } catch (err) {
      console.error('Delete asset error:', err);
    }
  };

  const openAssetModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm({ name: asset.name, code: asset.code, type: asset.type, status: asset.status });
    } else {
      setEditingAsset(null);
      setAssetForm({ name: '', code: '', type: 'turbine', status: 'active' });
    }
    setShowAssetModal(true);
  };

  // Inspections Actions
  const fetchInspections = async () => {
    try {
      const res = await authFetch(`${API_BASE}/inspections`);
      if (res.ok) {
        const data = await res.json();
        setInspections(data);
      }
    } catch (err) {
      console.error('Error fetching inspections:', err);
    }
  };

  const saveInspection = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/inspections`, {
        method: 'POST',
        body: JSON.stringify(inspectionForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create inspection');

      setShowInspectionModal(false);
      setInspectionForm({ asset_id: '', findings: '', recommendations: '' });
      fetchInspections();
    } catch (err) {
      alert(err.message);
    }
  };

  const openInspectionDetail = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/inspections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInspection(data);
        setEditFindings(data.findings);
        setEditRecommendations(data.recommendations);
        setEditStatus(data.status);
        setShowInspectionDetailModal(true);
      }
    } catch (err) {
      console.error('Failed to get inspection details:', err);
    }
  };

  const updateInspection = async () => {
    if (!selectedInspection) return;
    try {
      const res = await authFetch(`${API_BASE}/inspections/${selectedInspection.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          findings: editFindings,
          recommendations: editRecommendations,
          status: editStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update inspection');
      
      // Update local detailed state and refresh list
      setSelectedInspection(data);
      setShowInspectionDetailModal(false);
      fetchInspections();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedInspection) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch(`${API_BASE}/inspections/${selectedInspection.id}/attachments`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      // Update attachments lists locally
      setSelectedInspection(prev => ({
        ...prev,
        attachments: data.attachments
      }));
      fetchInspections();
    } catch (err) {
      alert(err.message);
    }
  };

  // Reports Actions
  const fetchReportSummary = async () => {
    try {
      const res = await authFetch(`${API_BASE}/reports/summary`);
      if (res.ok) {
        const data = await res.json();
        setReportSummary(data);
      }

      // Fetch memory leak listener stats
      const debugRes = await authFetch(`${API_BASE}/reports/debug/listeners`);
      if (debugRes.ok) {
        const debugData = await debugRes.json();
        setListenerCount(debugData.activeListeners);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  // Render Login
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🛡️</span>
            <h1 className="auth-title">Asset Inspection</h1>
            <p className="auth-subtitle">Industrial Asset Inspection & Compliance</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="inspector@platform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary">Sign In</button>
          </form>

          <div className="demo-credentials">
            <p><strong>Demo Roles:</strong></p>
            <p>Admin: <code>admin@platform.com</code> / <code>admin123</code></p>
            <p>Inspector: <code>inspector@platform.com</code> / <code>inspector123</code></p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard App
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-text">Inspection Platform</span>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <span className="nav-icon">🏗️</span>
            <span>Assets Management</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'inspections' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspections')}
          >
            <span className="nav-icon">📝</span>
            <span>Inspections</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="nav-icon">📊</span>
            <span>Operational Reports</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name.charAt(0)}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        
        {/* Tab 1: Assets Management */}
        {activeTab === 'assets' && (
          <div>
            <header className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Industrial Assets</h1>
                <p className="page-description">Create, update, and manage plants equipment database.</p>
              </div>
              {user?.role === 'admin' && (
                <button className="btn-action primary" onClick={() => openAssetModal()}>
                  <span>+</span> Add New Asset
                </button>
              )}
            </header>

            <div className="table-container">
              <div className="table-header-bar">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Assets Database</h2>
                <input 
                  type="text" 
                  className="table-search" 
                  placeholder="Search assets by name/code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <table className="app-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    {user?.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No assets found. Try a different query.
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => (
                      <tr key={asset.id}>
                        <td><span className="code-badge">{asset.code}</span></td>
                        <td style={{ fontWeight: '600' }}>{asset.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{asset.type}</td>
                        <td>
                          <span className={`badge ${asset.status}`}>
                            {asset.status}
                          </span>
                        </td>
                        {user?.role === 'admin' && (
                          <td>
                            <div className="table-actions">
                              <button className="btn-icon" onClick={() => openAssetModal(asset)}>✏️</button>
                              <button className="btn-icon danger" onClick={() => deleteAsset(asset.id)}>🗑️</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Inspections Workflow */}
        {activeTab === 'inspections' && (
          <div>
            <header className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Field Inspections</h1>
                <p className="page-description">Perform checks, upload attachments, and submit compliance reports.</p>
              </div>
              <button className="btn-action primary" onClick={() => setShowInspectionModal(true)}>
                <span>+</span> Record Inspection
              </button>
            </header>

            <div className="table-container">
              <div className="table-header-bar">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>All Inspections</h2>
              </div>

              <table className="app-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Date</th>
                    <th>Inspector</th>
                    <th>Status</th>
                    <th>Findings Snippet</th>
                    <th>Files</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No inspections recorded. Click "+ Record Inspection" to begin.
                      </td>
                    </tr>
                  ) : (
                    inspections.map((insp) => (
                      <tr key={insp.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{insp.asset_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{insp.asset_code}</div>
                        </td>
                        <td>{new Date(insp.date).toLocaleDateString()}</td>
                        <td>{insp.inspector_name}</td>
                        <td>
                          <span className={`badge ${insp.status}`}>
                            {insp.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {insp.findings}
                        </td>
                        <td><span className="code-badge">{insp.attachments?.length || 0} files</span></td>
                        <td>
                          <button className="btn-action" onClick={() => openInspectionDetail(insp.id)}>
                            Review & Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Operational Reports */}
        {activeTab === 'reports' && (
          <div>
            <header className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Operational Summary</h1>
                <p className="page-description">Global metrics compiled directly from plants analytics modules.</p>
              </div>
              <button className="btn-action" onClick={fetchReportSummary}>🔄 Refresh Metrics</button>
            </header>

            {reportSummary ? (
              <div>
                <div className="grid-metrics">
                  <div className="card-metric">
                    <p className="metric-label">Total Assets</p>
                    <p className="metric-value">{reportSummary.totalAssets}</p>
                  </div>
                  <div className="card-metric">
                    <p className="metric-label">Total Inspections</p>
                    <p className="metric-value">{reportSummary.totalInspections}</p>
                  </div>
                  <div className="card-metric">
                    <p className="metric-label">Critical Status Assets</p>
                    <p className="metric-value" style={{ color: 'var(--status-maintenance)' }}>{reportSummary.criticalAssets}</p>
                  </div>
                </div>

                <div className="table-container" style={{ padding: '30px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Inspections Breakdown</h3>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '150px', background: 'rgba(2, 6, 23, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ color: 'var(--status-draft)', fontWeight: 'bold' }}>DRAFTS</p>
                      <h4 style={{ fontSize: '1.8rem', marginTop: '10px' }}>{reportSummary.inspectionsByStatus?.draft}</h4>
                    </div>
                    <div style={{ flex: '1', minWidth: '150px', background: 'rgba(2, 6, 23, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ color: 'var(--status-pending)', fontWeight: 'bold' }}>PENDING REVIEW</p>
                      <h4 style={{ fontSize: '1.8rem', marginTop: '10px' }}>{reportSummary.inspectionsByStatus?.pending}</h4>
                    </div>
                    <div style={{ flex: '1', minWidth: '150px', background: 'rgba(2, 6, 23, 0.3)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ color: 'var(--status-approved)', fontWeight: 'bold' }}>APPROVED</p>
                      <h4 style={{ fontSize: '1.8rem', marginTop: '10px' }}>{reportSummary.inspectionsByStatus?.approved}</h4>
                    </div>
                  </div>
                </div>

                {/* Hidden Leak Monitor Dashboard for Developer/Students */}
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '24px', marginTop: '40px' }}>
                  <h3 style={{ color: '#fca5a5', fontFamily: 'var(--font-display)', marginBottom: '10px' }}>⚠️ System Diagnostics Monitor (Hidden Audit)</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    In production, the backend records audit reports. However, a developer flag notices event handlers are piling up on successive loads.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: '#020617', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Event Listeners: </span>
                      <strong style={{ color: listenerCount > 5 ? '#f87171' : 'var(--status-active)', fontFamily: 'var(--font-mono)' }}>{listenerCount}</strong>
                    </div>
                    {listenerCount > 5 && (
                      <span style={{ color: '#f87171', fontSize: '0.85rem' }}>
                        Warning: Memory leak detected. Multiple report generation events bound without garbage collection.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Loading report summary...</p>
            )}
          </div>
        )}

      </main>

      {/* MODAL 1: ADD/EDIT ASSET */}
      {showAssetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem' }}>{editingAsset ? 'Edit Industrial Asset' : 'Register New Asset'}</h2>
              <button className="btn-icon" onClick={() => setShowAssetModal(false)}>✕</button>
            </div>
            <form onSubmit={saveAsset}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Asset Code (Unique Identifier)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. WT-001" 
                    value={assetForm.code}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, code: e.target.value }))}
                    disabled={editingAsset !== null}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Wind Turbine Alpha" 
                    value={assetForm.name}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Equipment Category</label>
                  <select 
                    className="form-input"
                    value={assetForm.type}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="turbine">Wind Turbine</option>
                    <option value="pipeline">Offshore Pipeline</option>
                    <option value="drone">Inspection Drone</option>
                    <option value="generator">Backup Generator</option>
                    <option value="solar">Solar PV Panel</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operational Status</label>
                  <select 
                    className="form-input"
                    value={assetForm.status}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active (Fully Operational)</option>
                    <option value="maintenance">Maintenance Required</option>
                    <option value="inactive">Inactive (Decommissioned)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowAssetModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD NEW INSPECTION */}
      {showInspectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem' }}>Record Field Inspection</h2>
              <button className="btn-icon" onClick={() => setShowInspectionModal(false)}>✕</button>
            </div>
            <form onSubmit={saveInspection}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Equipment Under Check</label>
                  <select 
                    className="form-input"
                    value={inspectionForm.asset_id}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, asset_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose Asset --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Inspection Findings</label>
                  <textarea 
                    className="form-input" 
                    style={{ height: '120px', resize: 'none' }}
                    placeholder="Provide details on mechanical wear, thermal leakage, structural corrosion..."
                    value={inspectionForm.findings}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, findings: e.target.value }))}
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Corrective Recommendations (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Schedule visual checks or order repairs..." 
                    value={inspectionForm.recommendations}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, recommendations: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowInspectionModal(false)}>Cancel</button>
                <button type="submit" className="btn-action primary">Save Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INSPECTION DETAILS, EDIT & ATTACHMENTS */}
      {showInspectionDetailModal && selectedInspection && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.3rem' }}>Review Inspection #{selectedInspection.id}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Target: {selectedInspection.asset_name} ({selectedInspection.asset_code})
                </p>
              </div>
              <button className="btn-icon" onClick={() => setShowInspectionDetailModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* If inspection is approved, show the locked notification */}
              {selectedInspection.status === 'approved' && (
                <div className="locked-notice">
                  <span className="locked-icon">🔒</span>
                  <span><strong>Locked Record:</strong> This inspection was approved by an Admin and is closed for editing.</span>
                </div>
              )}

              {/* Inspector details info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Recorded By: </span>
                  <strong>{selectedInspection.inspector_name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Date: </span>
                  <strong>{new Date(selectedInspection.date).toLocaleString()}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Findings Details</label>
                <textarea 
                  className="form-input"
                  style={{ height: '100px', resize: 'none' }}
                  value={editFindings}
                  onChange={(e) => setEditFindings(e.target.value)}
                  // Note: Disabled in frontend if status is approved, but the backend doesn't protect it!
                  disabled={selectedInspection.status === 'approved'}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Recommendations</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editRecommendations}
                  onChange={(e) => setEditRecommendations(e.target.value)}
                  disabled={selectedInspection.status === 'approved'}
                />
              </div>

              {/* Status Update (Admin Only) */}
              <div className="form-group">
                <label className="form-label">Compliance Status</label>
                <select
                  className="form-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={selectedInspection.status === 'approved'}
                >
                  <option value="draft">Draft (Field collection)</option>
                  <option value="pending">Pending (Awaiting Audit)</option>
                  {/* Show Approved option only if Admin role is checking or if it is already approved */}
                  {(user?.role === 'admin' || selectedInspection.status === 'approved') && (
                    <option value="approved">Approved (Locked Record)</option>
                  )}
                </select>
              </div>

              {/* Attachments Section */}
              <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '10px' }}>Inspection Attachments</h4>
                
                {/* Upload Zone - Only if not approved */}
                {selectedInspection.status !== 'approved' ? (
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                      accept="image/*,application/pdf"
                    />
                    <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                      <div className="upload-icon">📸</div>
                      <p className="upload-text">
                        <span className="upload-highlight">Click to select files</span> to upload drone photos or logs.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uploading attachments is locked.</p>
                )}

                {/* Render Attachments Thumbnails */}
                <div className="attachment-list">
                  {selectedInspection.attachments?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', gridColumn: '1/-1' }}>No files attached to this inspection.</p>
                  ) : (
                    selectedInspection.attachments.map((file, idx) => (
                      <div key={idx} className="attachment-thumbnail">
                        {/* Assuming images for visual elegance */}
                        <img 
                          src={`/uploads/${file}`} 
                          alt="Attachment" 
                          onError={(e) => {
                            // fallback for non-image files or failed loads
                            e.target.src = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%231e293b%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2235%22 fill=%22%2364748b%22 text-anchor=%22middle%22>📄</text></svg>";
                          }}
                        />
                        <div className="attachment-label">{file.substring(file.indexOf('-') + 1)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
            
            <div className="modal-footer">
              <button className="btn-action" onClick={() => setShowInspectionDetailModal(false)}>Close</button>
              {selectedInspection.status !== 'approved' && (
                <button className="btn-action primary" onClick={updateInspection}>
                  Save Audit Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
