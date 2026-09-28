const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/index');
const { validateResourceName, generateRecommendedName, formatResourceType } = require('../src/namingValidator');

describe('Naming Validator Unit Tests', () => {
  test('Compliant VM resource name should pass validation', () => {
    const resource = {
      name: 'vm-payment-prod-eastus-001',
      type: 'Microsoft.Compute/virtualMachines',
      location: 'eastus',
      environment: 'prod',
      workload: 'payment',
      instance: '001'
    };
    const result = validateResourceName(resource);
    assert.strictEqual(result.compliant, true);
    assert.strictEqual(result.azureValid, true);
    assert.strictEqual(result.orgCompliant, true);
  });

  test('Non-compliant VM resource name should fail with specific reasons', () => {
    const resource = {
      name: 'MyOldVM123',
      type: 'Microsoft.Compute/virtualMachines',
      location: 'eastus'
    };
    const result = validateResourceName(resource);
    assert.strictEqual(result.compliant, false);
    assert.ok(result.reasons.length > 0);
  });

  test('Real Azure Storage Account stgovdemo2026 should be Azure-Valid PASS but Organizational NON-COMPLIANT', () => {
    const realStorageAccount = {
      name: 'stgovdemo2026',
      type: 'Microsoft.Storage/storageAccounts',
      resourceGroup: 'rg-governance-demo',
      location: 'indiasouthcentral'
    };
    const result = validateResourceName(realStorageAccount);
    assert.strictEqual(result.azureValid, true); // Azure Validity: PASS
    assert.strictEqual(result.orgCompliant, false); // Organizational Governance: FAIL (missing env, instance, region tokens)
    assert.strictEqual(result.compliant, false); // Overall Governance: Non-Compliant
    assert.strictEqual(result.recommendedName, 'stgovprodsc001');
  });

  test('formatResourceType should format Azure resource type strings nicely', () => {
    assert.strictEqual(formatResourceType('Microsoft.Storage/storageAccounts'), 'Storage Account');
    assert.strictEqual(formatResourceType('Microsoft.Compute/virtualMachines'), 'Virtual Machine');
    assert.strictEqual(formatResourceType('Microsoft.Web/sites'), 'App Service');
  });

  test('generateRecommendedName should derive compliant names accurately', () => {
    const resource = {
      name: 'MyOldVM123',
      type: 'Microsoft.Compute/virtualMachines',
      location: 'eastus',
      resourceGroup: 'rg-payment-prod'
    };
    assert.strictEqual(generateRecommendedName(resource), 'vm-payment-prod-eastus-001');
  });
});

describe('Backend API Endpoints Integration Tests', () => {
  test('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'ok' });
  });

  test('GET /api/azure/status should attempt connection to Azure', async () => {
    const res = await request(app).get('/api/azure/status');
    assert.ok(res.status === 200 || res.status === 401 || res.status === 403 || res.status === 500);
    assert.ok(typeof res.body.connected === 'boolean');
  });

  test('GET /api/azure/resources should return live Azure state', async () => {
    const res = await request(app).get('/api/azure/resources');
    assert.ok(res.status === 200 || res.status === 401 || res.status === 403 || res.status === 500);
    if (res.status === 200) {
      assert.ok(typeof res.body.count === 'number');
      assert.ok(Array.isArray(res.body.resources));
    }
  });

  test('GET /api/governance/resources?mode=demo should return demo resources', async () => {
    const res = await request(app).get('/api/governance/resources?mode=demo');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.mode, 'demo');
    assert.ok(res.body.count > 0);
  });

  test('GET /api/governance/compliance?mode=demo should return compliance summary & breakdown', async () => {
    const res = await request(app).get('/api/governance/compliance?mode=demo');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.mode, 'demo');
    assert.ok(res.body.namingBreakdown);
  });

  test('GET /api/governance/remediation?mode=demo should return remediation steps for non-compliant resources', async () => {
    const res = await request(app).get('/api/governance/remediation?mode=demo');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.remediations));
  });
});

describe('Urgent Deployment Exception Workflow Tests', () => {
  let createdId = '';

  test('GET /api/governance/exceptions?mode=azure should return zero initial live exceptions', async () => {
    const res = await request(app).get('/api/governance/exceptions?mode=azure');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.counts.total, 0);
    assert.strictEqual(res.body.exceptions.length, 0);
  });

  test('GET /api/governance/exceptions?mode=demo should return seeded demo exceptions', async () => {
    const res = await request(app).get('/api/governance/exceptions?mode=demo');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.counts.total, 3);
    assert.strictEqual(res.body.exceptions.length, 3);
  });

  test('POST /api/governance/exceptions?mode=azure should create a live exception request', async () => {
    const payload = {
      resourceId: '/subscriptions/sub1/resourceGroups/rg1/providers/Microsoft.Storage/storageAccounts/stgovdemo2026',
      resourceName: 'stgovdemo2026',
      reason: 'Urgent hotfix release for production storage access',
      requestedBy: 'developer@company.com',
      durationHours: 48
    };

    const res = await request(app)
      .post('/api/governance/exceptions?mode=azure')
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.status, 'PENDING');
    assert.strictEqual(res.body.source, 'live');
    createdId = res.body.id;
  });

  test('PATCH /api/governance/exceptions/:id/approve should transition PENDING -> APPROVED', async () => {
    const res = await request(app).patch(`/api/governance/exceptions/${createdId}/approve`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'APPROVED');
  });

  test('PATCH /api/governance/exceptions/:id/activate should transition APPROVED -> ACTIVE', async () => {
    const res = await request(app).patch(`/api/governance/exceptions/${createdId}/activate`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ACTIVE');
  });

  test('PATCH /api/governance/exceptions/:id/expire should transition ACTIVE -> EXPIRED', async () => {
    const res = await request(app).patch(`/api/governance/exceptions/${createdId}/expire`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'EXPIRED');
  });

  test('Invalid status transition (e.g. EXPIRED -> ACTIVE) should return HTTP 400', async () => {
    const res = await request(app).patch(`/api/governance/exceptions/${createdId}/activate`);
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('Invalid status transition'));
  });

  test('Creating exception with missing parameters should return HTTP 400', async () => {
    const res = await request(app)
      .post('/api/governance/exceptions')
      .send({
        resourceName: 'test',
        reason: 'short'
      });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });
});
