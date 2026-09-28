/**
 * Governance Exception Management Service (In-Memory Data Store)
 * Manages urgent deployment policy waiver workflows without bypassing security controls.
 * Supports mode separation ('demo' vs 'live' Azure exceptions).
 */

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED'];

// Initial synthetic demo exceptions (source: 'demo')
let exceptions = [
  {
    id: 'exc-101',
    resourceId: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-legacy-apps/providers/Microsoft.Compute/virtualMachines/MyOldVM123',
    resourceName: 'MyOldVM123',
    reason: 'Urgent hotfix deployment for Q3 legacy payment processing',
    requestedBy: 'alex.dev@company.com',
    durationHours: 48,
    status: 'PENDING',
    source: 'demo',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 46).toISOString()
  },
  {
    id: 'exc-102',
    resourceId: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/Default-Storage-WestUS/providers/Microsoft.Storage/storageAccounts/tempstorage2024',
    resourceName: 'tempstorage2024',
    reason: 'Emergency database backup export during outage recovery',
    requestedBy: 'sarah.ops@company.com',
    durationHours: 24,
    status: 'ACTIVE',
    source: 'demo',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 12).toISOString()
  },
  {
    id: 'exc-103',
    resourceId: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-auth-prod/providers/Microsoft.KeyVault/vaults/ProdKeyVaultSecret1',
    resourceName: 'ProdKeyVaultSecret1',
    reason: 'Temporary key rotation validation environment',
    requestedBy: 'sec-lead@company.com',
    durationHours: 72,
    status: 'EXPIRED',
    source: 'demo',
    createdAt: new Date(Date.now() - 3600000 * 100).toISOString(),
    expiresAt: new Date(Date.now() - 3600000 * 28).toISOString()
  }
];

let nextId = 104;

/**
 * Lists exceptions filtered strictly by mode ('demo' vs 'azure')
 */
function getAllExceptions(mode = 'azure') {
  const targetSource = mode === 'demo' ? 'demo' : 'live';
  const filtered = exceptions.filter(e => e.source === targetSource);

  const counts = {
    total: filtered.length,
    pending: filtered.filter(e => e.status === 'PENDING').length,
    approved: filtered.filter(e => e.status === 'APPROVED').length,
    rejected: filtered.filter(e => e.status === 'REJECTED').length,
    active: filtered.filter(e => e.status === 'ACTIVE').length,
    expired: filtered.filter(e => e.status === 'EXPIRED').length
  };

  return {
    mode: mode === 'demo' ? 'demo' : 'azure',
    source: targetSource,
    counts,
    exceptions: [...filtered]
  };
}

/**
 * Creates a new governance exception request
 */
function createException(data, mode = 'azure') {
  if (!data.resourceName || typeof data.resourceName !== 'string') {
    throw { statusCode: 400, message: 'Resource name is required' };
  }
  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length < 5) {
    throw { statusCode: 400, message: 'Reason must be at least 5 characters long' };
  }
  if (!data.requestedBy || typeof data.requestedBy !== 'string') {
    throw { statusCode: 400, message: 'Requested By identity is required' };
  }
  const hours = Number(data.durationHours) || 24;
  if (hours <= 0 || hours > 720) {
    throw { statusCode: 400, message: 'Duration must be between 1 and 720 hours' };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + hours * 3600000);
  const targetSource = (data.mode || mode) === 'demo' ? 'demo' : 'live';

  const newException = {
    id: `exc-${nextId++}`,
    resourceId: data.resourceId || `res-${Date.now()}`,
    resourceName: data.resourceName.trim(),
    reason: data.reason.trim(),
    requestedBy: data.requestedBy.trim(),
    durationHours: hours,
    status: 'PENDING',
    source: targetSource,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  exceptions.unshift(newException);
  return newException;
}

/**
 * Validates and transitions exception status
 */
function updateExceptionStatus(id, targetStatus) {
  const exception = exceptions.find(e => e.id === id);
  if (!exception) {
    throw { statusCode: 404, message: `Exception '${id}' not found` };
  }

  const current = exception.status;

  const allowedTransitions = {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['ACTIVE', 'REJECTED'],
    ACTIVE: ['EXPIRED'],
    REJECTED: [],
    EXPIRED: []
  };

  if (!allowedTransitions[current] || !allowedTransitions[current].includes(targetStatus)) {
    throw {
      statusCode: 400,
      message: `Invalid status transition from '${current}' to '${targetStatus}'. Allowed transitions: ${allowedTransitions[current]?.join(', ') || 'none'}`
    };
  }

  exception.status = targetStatus;
  return exception;
}

module.exports = {
  getAllExceptions,
  createException,
  updateExceptionStatus,
  VALID_STATUSES
};
