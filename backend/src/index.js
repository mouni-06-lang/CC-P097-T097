require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { checkAzureStatus, getAzureResources } = require('./azureClient');
const { getResourcesByMode, getComplianceSummary, getRemediationPlan } = require('./governanceService');
const { getAllExceptions, createException, updateExceptionStatus } = require('./exceptionService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Azure Status endpoint
app.get('/api/azure/status', async (req, res) => {
  try {
    const status = await checkAzureStatus();
    res.json(status);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      connected: false,
      subscriptionId: err.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID || '51eaa99b-a883-4ed3-a1bb-882394f5553f',
      message: err.message || 'Azure connection failed'
    });
  }
});

// Azure Resource Graph query endpoint
app.get('/api/azure/resources', async (req, res) => {
  try {
    const result = await getAzureResources();
    res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.error || 'Failed to retrieve Azure resources',
      count: 0,
      resources: []
    });
  }
});

// Governance Resources endpoint
app.get('/api/governance/resources', async (req, res) => {
  try {
    const mode = req.query.mode === 'demo' ? 'demo' : 'azure';
    const result = await getResourcesByMode(mode);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Failed to fetch governance resources',
      mode: req.query.mode || 'azure',
      count: 0,
      resources: []
    });
  }
});

// Governance Compliance Summary endpoint
app.get('/api/governance/compliance', async (req, res) => {
  try {
    const mode = req.query.mode === 'demo' ? 'demo' : 'azure';
    const summary = await getComplianceSummary(mode);
    res.json(summary);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Failed to calculate compliance summary',
      mode: req.query.mode || 'azure',
      totalResources: 0,
      compliantResources: 0,
      nonCompliantResources: 0,
      compliancePercentage: 0,
      resourcesWithIssues: [],
      namingBreakdown: {}
    });
  }
});

// Governance Remediation Plan endpoint
app.get('/api/governance/remediation', async (req, res) => {
  try {
    const mode = req.query.mode === 'demo' ? 'demo' : 'azure';
    const remediation = await getRemediationPlan(mode);
    res.json(remediation);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Failed to generate remediation plan',
      mode: req.query.mode || 'azure',
      nonCompliantCount: 0,
      remediations: []
    });
  }
});

/* =========================================================================
   GOVERNANCE EXCEPTION MANAGEMENT ENDPOINTS (Supports mode=demo or mode=azure)
   ========================================================================= */

// GET /api/governance/exceptions - List exceptions filtered by mode
app.get('/api/governance/exceptions', (req, res) => {
  try {
    const mode = req.query.mode === 'demo' ? 'demo' : 'azure';
    const data = getAllExceptions(mode);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list exceptions' });
  }
});

// POST /api/governance/exceptions - Create exception request for specific mode
app.post('/api/governance/exceptions', (req, res) => {
  try {
    const mode = req.query.mode || req.body.mode || 'azure';
    const exception = createException(req.body, mode);
    res.status(201).json(exception);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Failed to create exception' });
  }
});

// PATCH /api/governance/exceptions/:id/approve
app.patch('/api/governance/exceptions/:id/approve', (req, res) => {
  try {
    const updated = updateExceptionStatus(req.params.id, 'APPROVED');
    res.json(updated);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// PATCH /api/governance/exceptions/:id/reject
app.patch('/api/governance/exceptions/:id/reject', (req, res) => {
  try {
    const updated = updateExceptionStatus(req.params.id, 'REJECTED');
    res.json(updated);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// PATCH /api/governance/exceptions/:id/activate
app.patch('/api/governance/exceptions/:id/activate', (req, res) => {
  try {
    const updated = updateExceptionStatus(req.params.id, 'ACTIVE');
    res.json(updated);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// PATCH /api/governance/exceptions/:id/expire
app.patch('/api/governance/exceptions/:id/expire', (req, res) => {
  try {
    const updated = updateExceptionStatus(req.params.id, 'EXPIRED');
    res.json(updated);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Azure Governance Backend running on port ${PORT}`);
  });
}

module.exports = app;
