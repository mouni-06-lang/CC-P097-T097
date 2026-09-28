import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Activity,
  RefreshCw,
  Search,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  Cloud,
  ArrowRight,
  Info,
  X,
  Copy,
  Check,
  PieChart,
  FileText,
  Clock,
  UserCheck,
  AlertOctagon,
  PlusCircle,
  Send,
  CheckSquare
} from 'lucide-react';

const RESOURCE_TYPE_DISPLAY_MAP = {
  'microsoft.compute/virtualmachines': 'Virtual Machine',
  'virtualmachines': 'Virtual Machine',
  'microsoft.web/sites': 'App Service',
  'sites': 'App Service',
  'microsoft.storage/storageaccounts': 'Storage Account',
  'storageaccounts': 'Storage Account',
  'microsoft.keyvault/vaults': 'Key Vault',
  'vaults': 'Key Vault',
  'microsoft.network/virtualnetworks': 'Virtual Network',
  'virtualnetworks': 'Virtual Network',
  'microsoft.sql/servers': 'SQL Server',
  'servers': 'SQL Server',
  'microsoft.resources/resourcegroups': 'Resource Group',
  'resourcegroups': 'Resource Group',
  'microsoft.network/networkinterfaces': 'Network Interface',
  'networkinterfaces': 'Network Interface',
  'microsoft.network/publicipaddresses': 'Public IP Address',
  'publicipaddresses': 'Public IP Address',
  'microsoft.network/networksecuritygroups': 'Network Security Group',
  'networksecuritygroups': 'Network Security Group'
};

function formatResourceType(type = '') {
  const norm = (type || '').toLowerCase();
  return RESOURCE_TYPE_DISPLAY_MAP[norm] || type.split('/').pop() || type;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataMode, setDataMode] = useState('demo');

  const [azureStatus, setAzureStatus] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [exceptionsData, setExceptionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Resource for Details Modal
  const [selectedResource, setSelectedResource] = useState(null);
  const [copied, setCopied] = useState(false);

  // Exception Request Form Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    resourceId: '',
    resourceName: '',
    reason: '',
    requestedBy: 'lead.architect@company.com',
    durationHours: 48
  });
  const [submittingException, setSubmittingException] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterEnvironment, setFilterEnvironment] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterCompliance, setFilterCompliance] = useState('ALL');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const fetchDashboardData = async (mode = dataMode) => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await fetch(`${API_BASE_URL}/api/azure/status`);
      const statusData = await statusRes.json();
      setAzureStatus(statusData);

      const complianceRes = await fetch(`${API_BASE_URL}/api/governance/compliance?mode=${mode}`);
      if (!complianceRes.ok) throw new Error(`Compliance API failed with status ${complianceRes.status}`);
      const summaryData = await complianceRes.json();
      setComplianceData(summaryData);

      // Fetch mode-filtered exceptions (mode=demo vs mode=azure)
      const excRes = await fetch(`${API_BASE_URL}/api/governance/exceptions?mode=${mode}`);
      if (excRes.ok) {
        const excData = await excRes.json();
        setExceptionsData(excData);
      }
    } catch (err) {
      console.error('Failed to load governance portal data:', err);
      setError(err.message || 'Connection error to governance backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dataMode);
  }, [dataMode]);

  const updateExceptionStatus = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/governance/exceptions/${id}/${action}`, {
        method: 'PATCH'
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to update exception status');
        return;
      }
      fetchDashboardData(dataMode);
    } catch (err) {
      alert(err.message || 'Network error updating exception');
    }
  };

  const handleCreateExceptionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingException(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/governance/exceptions?mode=${dataMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestForm, mode: dataMode })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit exception request');
        return;
      }
      setShowRequestModal(false);
      setRequestForm({
        resourceId: '',
        resourceName: '',
        reason: '',
        requestedBy: 'lead.architect@company.com',
        durationHours: 48
      });
      setActiveTab('exceptions');
      fetchDashboardData(dataMode);
    } catch (err) {
      alert(err.message || 'Network error creating exception');
    } finally {
      setSubmittingException(false);
    }
  };

  const openExceptionModalForResource = (resource) => {
    setRequestForm({
      resourceId: resource.id,
      resourceName: resource.name,
      reason: `Urgent deployment exception requested for non-compliant resource '${resource.name}'`,
      requestedBy: 'lead.architect@company.com',
      durationHours: 48
    });
    setSelectedResource(null);
    setShowRequestModal(true);
  };

  const resourcesList = complianceData?.resourcesWithIssues || [];

  const availableTypes = useMemo(() => Array.from(new Set(resourcesList.map(r => r.type))), [resourcesList]);
  const availableEnvironments = useMemo(() => Array.from(new Set(resourcesList.map(r => r.environment || 'N/A'))), [resourcesList]);
  const availableRegions = useMemo(() => Array.from(new Set(resourcesList.map(r => r.location))), [resourcesList]);

  const filteredResources = useMemo(() => {
    return resourcesList.filter(res => {
      const matchesSearch =
        !searchQuery ||
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.resourceGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatResourceType(res.type).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'ALL' || res.type === filterType;
      const matchesEnv = filterEnvironment === 'ALL' || (res.environment || 'N/A') === filterEnvironment;
      const matchesRegion = filterRegion === 'ALL' || res.location === filterRegion;
      const matchesCompliance =
        filterCompliance === 'ALL' ||
        (filterCompliance === 'COMPLIANT' && res.compliance?.compliant) ||
        (filterCompliance === 'NON_COMPLIANT' && !res.compliance?.compliant);

      return matchesSearch && matchesType && matchesEnv && matchesRegion && matchesCompliance;
    });
  }, [resourcesList, searchQuery, filterType, filterEnvironment, filterRegion, filterCompliance]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-container">
      {/* HEADER NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <ShieldCheck className="brand-icon" />
          <span className="brand-title">Azure Governance &amp; Discovery Portal</span>
        </div>

        <div className="nav-actions">
          <div className="mode-toggle-group">
            <button
              className={`mode-btn ${dataMode === 'azure' ? 'active' : ''}`}
              onClick={() => setDataMode('azure')}
            >
              <Cloud size={14} /> Live Azure
            </button>
            <button
              className={`mode-btn demo ${dataMode === 'demo' ? 'active demo' : ''}`}
              onClick={() => setDataMode('demo')}
            >
              <Database size={14} /> Demo Data
            </button>
          </div>

          <div className="connection-pill">
            {azureStatus?.connected ? (
              <span className="status-badge connected" title={`Subscription: ${azureStatus.subscriptionId}`}>
                <span className="status-indicator-dot"></span>
                Azure Connected
              </span>
            ) : (
              <span className="status-badge disconnected">
                <span className="status-indicator-dot"></span>
                Azure Disconnected
              </span>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* TOP TAB NAVIGATION */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Layers size={16} /> Governance Dashboard &amp; Explorer
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'exceptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('exceptions')}
          >
            <AlertOctagon size={16} /> Urgent Deployment Exceptions
            {exceptionsData?.counts?.pending > 0 && (
              <span className="badge-tag PENDING" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                {exceptionsData.counts.pending} PENDING
              </span>
            )}
          </button>
        </nav>

        {/* DEMO MODE NOTICE BANNER */}
        {dataMode === 'demo' && (
          <div className="demo-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="demo-tag">DEMO MODE</span>
              <span>Showing synthetic Azure resource dataset for governance standard demonstration.</span>
            </div>
            <button
              onClick={() => setDataMode('azure')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#c084fc',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              Switch to Live Azure
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: DASHBOARD & RESOURCE EXPLORER VIEW
            ========================================================================= */}
        {activeTab === 'dashboard' && (
          <>
            <section className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Total Resources</span>
                  <Layers className="metric-icon" style={{ color: 'var(--azure-cyan)' }} />
                </div>
                <div className="metric-value azure">{complianceData?.totalResources ?? 0}</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Compliant</span>
                  <CheckCircle2 className="metric-icon" style={{ color: 'var(--status-success-text)' }} />
                </div>
                <div className="metric-value success">{complianceData?.compliantResources ?? 0}</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Non-Compliant</span>
                  <XCircle className="metric-icon" style={{ color: 'var(--status-error-text)' }} />
                </div>
                <div className="metric-value error">{complianceData?.nonCompliantResources ?? 0}</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Compliance Rate</span>
                  <Activity className="metric-icon" style={{ color: 'var(--azure-blue)' }} />
                </div>
                <div className="metric-value" style={{ color: '#38bdf8' }}>
                  {complianceData?.compliancePercentage ?? 0}%
                </div>
              </div>
            </section>

            {complianceData?.namingBreakdown && (
              <section className="breakdown-section">
                <div className="breakdown-card">
                  <h4 className="breakdown-title">
                    <PieChart size={16} style={{ color: 'var(--azure-cyan)' }} />
                    Compliance by Resource Type
                  </h4>
                  {Object.entries(complianceData.namingBreakdown.byResourceType || {}).map(([type, stats]) => (
                    <div key={type} className="breakdown-item">
                      <span style={{ fontWeight: 600 }}>{formatResourceType(type)}</span>
                      <span style={{ color: stats.nonCompliant > 0 ? 'var(--status-error-text)' : 'var(--status-success-text)' }}>
                        {stats.compliant}/{stats.total} Compliant ({Math.round((stats.compliant / stats.total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>

                <div className="breakdown-card">
                  <h4 className="breakdown-title">
                    <AlertTriangle size={16} style={{ color: 'var(--status-warning-text)' }} />
                    Top Naming Non-Compliance Issues
                  </h4>
                  {Object.entries(complianceData.namingBreakdown.commonIssues || {}).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No non-compliance issues found!</p>
                  ) : (
                    Object.entries(complianceData.namingBreakdown.commonIssues || {}).slice(0, 4).map(([issue, count]) => (
                      <div key={issue} className="breakdown-item">
                        <span style={{ color: 'var(--text-secondary)' }}>{issue}</span>
                        <span className="badge-tag non-compliant" style={{ fontSize: '0.7rem' }}>{count} resources</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            <section className="controls-bar">
              <div className="search-box">
                <Search className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search resources by name, type, or resource group..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filters-group">
                <select
                  className="filter-select"
                  value={filterCompliance}
                  onChange={e => setFilterCompliance(e.target.value)}
                >
                  <option value="ALL">All Compliance Statuses</option>
                  <option value="COMPLIANT">Compliant Only</option>
                  <option value="NON_COMPLIANT">Non-Compliant Only</option>
                </select>

                <select
                  className="filter-select"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option value="ALL">All Resource Types</option>
                  {availableTypes.map(t => (
                    <option key={t} value={t}>{formatResourceType(t)}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={filterEnvironment}
                  onChange={e => setFilterEnvironment(e.target.value)}
                >
                  <option value="ALL">All Environments</option>
                  {availableEnvironments.map(env => (
                    <option key={env} value={env}>{env.toUpperCase()}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={filterRegion}
                  onChange={e => setFilterRegion(e.target.value)}
                >
                  <option value="ALL">All Regions</option>
                  {availableRegions.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>

                <button className="action-btn" onClick={() => fetchDashboardData(dataMode)} disabled={loading}>
                  <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </button>
              </div>
            </section>

            {dataMode === 'azure' && complianceData?.totalResources === 0 && !loading && (
              <div className="empty-state-box">
                <Cloud className="empty-state-icon" />
                <h3 className="empty-state-title">Azure Connected Successfully</h3>
                <p className="empty-state-text">
                  Azure connected successfully via Azure CLI, but no resources were found in subscription{' '}
                  <code>{azureStatus?.subscriptionId}</code>.
                </p>
                <button className="action-btn primary" onClick={() => setDataMode('demo')}>
                  <Database size={16} /> Switch to Demo Data
                </button>
              </div>
            )}

            {(dataMode === 'demo' || complianceData?.totalResources > 0) && (
              <div className="table-container">
                <table className="resource-table">
                  <thead>
                    <tr>
                      <th>Resource Name</th>
                      <th>Type</th>
                      <th>Resource Group</th>
                      <th>Region</th>
                      <th>Env</th>
                      <th>Status</th>
                      <th>Recommended Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No resources match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredResources.map(res => (
                        <tr key={res.id} onClick={() => setSelectedResource(res)}>
                          <td>
                            <div className="resource-name-cell">
                              {res.isDemo && <span className="demo-tag" style={{ fontSize: '0.65rem' }}>DEMO</span>}
                              <span>{res.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {formatResourceType(res.type)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {res.resourceGroup}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{res.location}</td>
                          <td>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--azure-cyan)' }}>
                              {res.environment || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {res.compliance?.compliant ? (
                              <span className="badge-tag compliant">Compliant</span>
                            ) : (
                              <div>
                                <span className="badge-tag non-compliant">Non-Compliant</span>
                                {res.compliance?.reasons?.length > 0 && (
                                  <ul className="reasons-list">
                                    {res.compliance.reasons.map((r, idx) => (
                                      <li key={idx}>&bull; {r}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="recommended-name">{res.compliance?.recommendedName}</span>
                          </td>
                          <td>
                            <button
                              className="action-btn sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResource(res);
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            TAB 2: URGENT DEPLOYMENT EXCEPTIONS WORKFLOW VIEW
            ========================================================================= */}
        {activeTab === 'exceptions' && (
          <>
            <div className="gov-banner">
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>GOVERNANCE WORKFLOW DEMONSTRATION &mdash; MODE: {dataMode.toUpperCase()}</strong>
                <p style={{ marginTop: '0.2rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  This exception management workflow records organizational policy waivers for urgent deployment scenarios. Approving an exception tracks policy compliance deferrals for audit trailing without directly overriding Azure Cloud security boundaries or RBAC rules.
                </p>
              </div>
            </div>

            <section className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Total Exceptions</span>
                  <FileText className="metric-icon" style={{ color: 'var(--azure-cyan)' }} />
                </div>
                <div className="metric-value azure">{exceptionsData?.counts?.total ?? 0}</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Pending Approval</span>
                  <Clock className="metric-icon" style={{ color: 'var(--status-warning-text)' }} />
                </div>
                <div className="metric-value warning">{exceptionsData?.counts?.pending ?? 0}</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Approved</span>
                  <UserCheck className="metric-icon" style={{ color: 'var(--status-success-text)' }} />
                </div>
                <div className="metric-value success">{exceptionsData?.counts?.approved ?? 0}</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Active Exceptions</span>
                  <Activity className="metric-icon" style={{ color: '#38bdf8' }} />
                </div>
                <div className="metric-value" style={{ color: '#38bdf8' }}>
                  {exceptionsData?.counts?.active ?? 0}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Expired</span>
                  <XCircle className="metric-icon" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div className="metric-value" style={{ color: 'var(--text-secondary)' }}>
                  {exceptionsData?.counts?.expired ?? 0}
                </div>
              </div>
            </section>

            <section className="controls-bar">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Policy Exception Request Register ({dataMode === 'demo' ? 'DEMO DATA' : 'LIVE AZURE'})
              </h3>
              <button
                className="action-btn primary"
                onClick={() => {
                  setRequestForm({
                    resourceId: '',
                    resourceName: '',
                    reason: '',
                    requestedBy: 'lead.architect@company.com',
                    durationHours: 48
                  });
                  setShowRequestModal(true);
                }}
              >
                <PlusCircle size={16} /> Request New Exception
              </button>
            </section>

            <div className="table-container">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Target Resource</th>
                    <th>Requester</th>
                    <th>Reason</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Expiration</th>
                    <th>Governance Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!exceptionsData?.exceptions || exceptionsData.exceptions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No governance exceptions recorded for {dataMode === 'demo' ? 'Demo Data' : 'Live Azure'} mode.
                      </td>
                    </tr>
                  ) : (
                    exceptionsData.exceptions.map(exc => (
                      <tr key={exc.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--azure-cyan)' }}>
                          {exc.id}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{exc.resourceName}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{exc.requestedBy}</td>
                        <td style={{ maxWidth: '280px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {exc.reason}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{exc.durationHours} hrs</td>
                        <td>
                          <span className={`badge-tag ${exc.status}`}>{exc.status}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(exc.expiresAt).toLocaleDateString()} {new Date(exc.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {exc.status === 'PENDING' && (
                              <>
                                <button
                                  className="action-btn success sm"
                                  onClick={() => updateExceptionStatus(exc.id, 'approve')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="action-btn danger sm"
                                  onClick={() => updateExceptionStatus(exc.id, 'reject')}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {exc.status === 'APPROVED' && (
                              <button
                                className="action-btn primary sm"
                                onClick={() => updateExceptionStatus(exc.id, 'activate')}
                              >
                                Activate
                              </button>
                            )}

                            {exc.status === 'ACTIVE' && (
                              <button
                                className="action-btn sm"
                                onClick={() => updateExceptionStatus(exc.id, 'expire')}
                              >
                                Expire
                              </button>
                            )}

                            {(exc.status === 'REJECTED' || exc.status === 'EXPIRED') && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finalized</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* RESOURCE DETAILS MODAL */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Resource Details &amp; Naming Governance</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {formatResourceType(selectedResource.type)} &bull; {selectedResource.resourceGroup}
                </span>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Dual Compliance Overview Card */}
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Resource:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700 }}>
                      {selectedResource.name}
                    </div>
                  </div>
                  <div>
                    {selectedResource.compliance?.compliant ? (
                      <span className="badge-tag compliant" style={{ fontSize: '0.85rem' }}>Organizational Compliant</span>
                    ) : (
                      <span className="badge-tag non-compliant" style={{ fontSize: '0.85rem' }}>Non-Compliant</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Azure Platform Validity:</span>
                    {selectedResource.compliance?.azureValid ? (
                      <span className="badge-tag compliant" style={{ fontSize: '0.75rem' }}>PASS</span>
                    ) : (
                      <span className="badge-tag non-compliant" style={{ fontSize: '0.75rem' }}>FAIL</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Organizational Convention:</span>
                    {selectedResource.compliance?.orgCompliant ? (
                      <span className="badge-tag compliant" style={{ fontSize: '0.75rem' }}>PASS</span>
                    ) : (
                      <span className="badge-tag non-compliant" style={{ fontSize: '0.75rem' }}>FAIL</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommended Name Box */}
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>Recommended Compliant Name:</span>
                  <button
                    className="action-btn sm"
                    onClick={() => handleCopy(selectedResource.compliance?.recommendedName)}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Name'}
                  </button>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                  {selectedResource.compliance?.recommendedName}
                </div>
              </div>

              {/* Naming Checks Breakdown */}
              <h4 className="modal-section-title">Naming Rules Validation Checks</h4>
              <div className="checks-grid">
                {Object.entries(selectedResource.compliance?.checks || {}).map(([ruleKey, passed]) => (
                  <div key={ruleKey} className="check-item">
                    <span style={{ textTransform: 'capitalize' }}>{ruleKey}</span>
                    {passed ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--status-success-text)' }} />
                    ) : (
                      <XCircle size={16} style={{ color: 'var(--status-error-text)' }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Remediation & Exception Request */}
              {!selectedResource.compliance?.compliant && (
                <>
                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="modal-section-title" style={{ color: 'var(--status-error-text)', margin: 0 }}>
                      Recommended Remediation Plan
                    </h4>
                    <button
                      className="action-btn primary sm"
                      onClick={() => openExceptionModalForResource(selectedResource)}
                    >
                      <AlertOctagon size={12} /> Request Exception
                    </button>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="remediation-step">
                      1. Deploy replacement {formatResourceType(selectedResource.type)} using compliant name '<strong>{selectedResource.compliance?.recommendedName}</strong>' in resource group '<strong>{selectedResource.resourceGroup}</strong>'.
                    </div>
                    <div className="remediation-step">
                      2. Migrate workload configuration, secrets, and data assets from '<strong>{selectedResource.name}</strong>' to '<strong>{selectedResource.compliance?.recommendedName}</strong>'.
                    </div>
                    <div className="remediation-step">
                      3. Update dependent application configuration, DNS, and Azure RBAC role assignments.
                    </div>
                    <div className="remediation-step">
                      4. Conduct compliance validation and health checks on the new compliant resource.
                    </div>
                    <div className="remediation-step">
                      5. Decommission and safely retire non-compliant resource '<strong>{selectedResource.name}</strong>' in accordance with organization policy.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REQUEST EXCEPTION FORM MODAL */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Request Urgent Deployment Exception</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExceptionSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Target Resource Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. MyOldVM123 or stgovdemo2026"
                  value={requestForm.resourceName}
                  onChange={e => setRequestForm({ ...requestForm, resourceName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Requester Identity (Email / User) *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="e.g. developer@company.com"
                  value={requestForm.requestedBy}
                  onChange={e => setRequestForm({ ...requestForm, requestedBy: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Urgent Exception *</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  required
                  placeholder="Explain why this urgent deployment cannot wait for naming remediation..."
                  value={requestForm.reason}
                  onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Waiver Duration (Hours) *</label>
                <select
                  className="form-select"
                  value={requestForm.durationHours}
                  onChange={e => setRequestForm({ ...requestForm, durationHours: Number(e.target.value) })}
                >
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>168 Hours (1 Week)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn primary"
                  disabled={submittingException}
                >
                  <Send size={14} /> Submit Exception Request ({dataMode.toUpperCase()} Mode)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        Azure Governance &amp; Discovery Portal &mdash; Hackathon Edition
      </footer>
    </div>
  );
}
