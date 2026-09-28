/**
 * Reusable Azure Naming Convention Validation & Recommendation Engine
 * Distinguishes Azure Platform Validity from Organizational Naming Standards.
 */

const RESOURCE_PREFIX_MAP = {
  'microsoft.compute/virtualmachines': 'vm',
  'microsoft.web/sites': 'app',
  'microsoft.storage/storageaccounts': 'st',
  'microsoft.keyvault/vaults': 'kv',
  'microsoft.network/virtualnetworks': 'vnet',
  'microsoft.sql/servers': 'sql',
  'microsoft.resources/resourcegroups': 'rg',
  'microsoft.network/networkinterfaces': 'nic',
  'microsoft.network/publicipaddresses': 'pip',
  'microsoft.network/networksecuritygroups': 'nsg'
};

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

const REGION_SHORT_MAP = {
  'indiasouthcentral': 'sc',
  'southcentralindia': 'sc',
  'centralindia': 'ci',
  'southindia': 'si',
  'westindia': 'wi',
  'eastus': 'eastus',
  'eastus2': 'eus2',
  'westus': 'westus',
  'westus2': 'wus2',
  'westeurope': 'weu',
  'northeurope': 'neu',
  'southeastasia': 'sea',
  'eastasia': 'ea'
};

const VALID_ENVIRONMENTS = ['prod', 'dev', 'stage', 'test', 'qa', 'uat', 'dr'];

/**
 * Returns human-readable display name for Azure resource types
 */
function formatResourceType(type = '') {
  const norm = (type || '').toLowerCase();
  return RESOURCE_TYPE_DISPLAY_MAP[norm] || type.split('/').pop() || type;
}

/**
 * Returns the normalized prefix for a given Azure resource type
 */
function getResourcePrefix(type = '') {
  const norm = (type || '').toLowerCase();
  if (norm.includes('storageaccounts') || norm.includes('storage')) return 'st';
  if (norm.includes('virtualmachines')) return 'vm';
  if (norm.includes('sites')) return 'app';
  if (norm.includes('vaults')) return 'kv';
  if (norm.includes('virtualnetworks')) return 'vnet';
  if (norm.includes('servers')) return 'sql';
  if (norm.includes('resourcegroups')) return 'rg';
  return RESOURCE_PREFIX_MAP[norm] || 'res';
}

/**
 * Shortens a region name for storage account constraints
 */
function getShortRegion(region = '') {
  const norm = (region || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (REGION_SHORT_MAP[norm]) return REGION_SHORT_MAP[norm];
  if (norm.length <= 4) return norm;
  return norm.substring(0, 4);
}

/**
 * Helper to infer workload from name or resource group
 */
function inferWorkloadFromName(name = '', resourceGroup = '') {
  const combined = `${name} ${resourceGroup}`.toLowerCase();
  if (combined.includes('governance') || combined.includes('gov')) return 'gov';
  if (combined.includes('payment')) return 'payment';
  if (combined.includes('order')) return 'orders';
  if (combined.includes('analytic')) return 'analytics';
  if (combined.includes('auth')) return 'auth';
  if (combined.includes('net')) return 'net';
  if (combined.includes('db') || combined.includes('database')) return 'db';
  return 'workload';
}

/**
 * Helper to infer environment from name or resource group
 */
function inferEnvironmentFromName(name = '', resourceGroup = '') {
  const combined = `${name} ${resourceGroup}`.toLowerCase();
  for (const env of VALID_ENVIRONMENTS) {
    if (combined.includes(env)) return env;
  }
  return 'prod';
}

/**
 * Generates recommended compliant name based on resource-type specific rules
 */
function generateRecommendedName(resource) {
  const type = resource.type || 'Microsoft.Compute/virtualMachines';
  const prefix = getResourcePrefix(type);
  const tags = resource.tags || {};

  const workload = (
    tags.Workload ||
    tags.App ||
    resource.workload ||
    inferWorkloadFromName(resource.name, resource.resourceGroup)
  ).toLowerCase().replace(/[^a-z0-9]/g, '');

  const environment = (
    tags.Environment ||
    resource.environment ||
    inferEnvironmentFromName(resource.name, resource.resourceGroup)
  ).toLowerCase().replace(/[^a-z0-9]/g, '');

  const rawLocation = (
    resource.location ||
    tags.Region ||
    'eastus'
  ).toLowerCase().replace(/[^a-z0-9]/g, '');

  const instance = (
    resource.instance ||
    tags.Instance ||
    '001'
  ).toString().padStart(3, '0');

  // STORAGE ACCOUNT SPECIFIC CONVENTION: st<workload><environment><region><instance>
  if (prefix === 'st') {
    const shortRegion = getShortRegion(rawLocation);
    let stName = `${prefix}${workload}${environment}${shortRegion}${instance}`.toLowerCase();
    
    if (stName.length > 24) {
      const trimmedWorkload = workload.substring(0, 6);
      stName = `${prefix}${trimmedWorkload}${environment}${shortRegion}${instance}`.toLowerCase();
    }
    
    return stName.substring(0, 24);
  }

  // STANDARD HYPHENATED AZURE RESOURCES: <prefix>-<workload>-<environment>-<region>-<instance>
  return `${prefix}-${workload}-${environment}-${rawLocation}-${instance}`.toLowerCase();
}

/**
 * Validates a resource name against:
 * 1. Azure Platform Validity (lowercase, alphanumeric/hyphens, length rules)
 * 2. Organizational Governance Naming Convention (<prefix><workload><environment><region><instance>)
 */
function validateResourceName(resource) {
  const name = resource.name || '';
  const type = resource.type || '';
  const prefix = getResourcePrefix(type);
  const recommendedName = generateRecommendedName(resource);

  const checks = {
    azureValid: false,
    resourceType: false,
    workload: false,
    environment: false,
    region: false,
    instance: false,
    lowercase: false,
    characters: false,
    length: false
  };

  const reasons = [];

  // =========================================================================
  // STORAGE ACCOUNT VALIDATION (Azure Validity vs Org Compliance)
  // =========================================================================
  if (prefix === 'st') {
    // 1. Azure Platform Validity
    checks.lowercase = name === name.toLowerCase();
    checks.characters = /^[a-z0-9]+$/.test(name);
    checks.length = name.length >= 3 && name.length <= 24;
    checks.azureValid = checks.lowercase && checks.characters && checks.length;

    if (!checks.lowercase) reasons.push('Azure Platform Warning: Must contain lowercase characters only');
    if (!checks.characters) reasons.push('Azure Platform Violation: Permits letters and numbers only (no hyphens or special characters)');
    if (!checks.length) reasons.push('Azure Platform Violation: Length must be between 3 and 24 characters');

    // 2. Organizational Naming Convention Checks
    checks.resourceType = name.startsWith('st');
    if (!checks.resourceType) reasons.push("Organizational Naming Violation: Must start with type prefix 'st'");

    // Check environment segment explicitly in actual name or tags
    const hasValidEnvTag = resource.tags?.Environment && VALID_ENVIRONMENTS.includes(resource.tags.Environment.toLowerCase());
    const hasValidEnvInName = VALID_ENVIRONMENTS.some(env => name.includes(env));
    checks.environment = hasValidEnvTag || hasValidEnvInName;
    if (!checks.environment) {
      reasons.push(`Organizational Naming Violation: Missing standard environment segment (expected: ${VALID_ENVIRONMENTS.join(', ')})`);
    }

    // Check region code segment in actual name or tags
    const shortReg = getShortRegion(resource.location);
    const hasRegionInName = shortReg && name.includes(shortReg);
    checks.region = Boolean(hasRegionInName);
    if (!checks.region) {
      reasons.push(`Organizational Naming Violation: Missing region code segment '${shortReg}' in resource name`);
    }

    // Check 3-digit instance identifier
    checks.instance = /00[1-9]|0[1-9]\d|[1-9]\d{2}$/.test(name);
    if (!checks.instance) {
      reasons.push('Organizational Naming Violation: Missing standard 3-digit instance number (e.g. 001)');
    }

    checks.workload = name.length >= 5 && checks.resourceType;

    const orgCompliant = checks.resourceType && checks.environment && checks.region && checks.instance && checks.workload;
    const compliant = checks.azureValid && orgCompliant;

    const totalChecks = Object.keys(checks).length - 1;
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return {
      compliant,
      azureValid: checks.azureValid,
      orgCompliant,
      currentName: name,
      recommendedName,
      score,
      checks,
      reasons
    };
  }

  // =========================================================================
  // STANDARD HYPHENATED AZURE RESOURCES (VM, App, KeyVault, VNet, SQL, RG)
  // =========================================================================
  checks.lowercase = name === name.toLowerCase();
  checks.characters = /^[a-z0-9-]+$/.test(name);
  checks.length = name.length >= 2 && name.length <= 64;
  checks.azureValid = checks.lowercase && checks.characters && checks.length;

  if (!checks.lowercase) reasons.push('Azure Platform Warning: Contains uppercase characters');
  if (!checks.characters) reasons.push('Azure Platform Violation: Contains invalid characters (only lowercase, numbers, hyphens allowed)');
  if (!checks.length) reasons.push('Azure Platform Violation: Length must be between 2 and 64 characters');

  checks.resourceType = name.startsWith(`${prefix}-`);
  if (!checks.resourceType) reasons.push(`Organizational Naming Violation: Must start with type prefix '${prefix}-'`);

  const parts = name.split('-');
  if (parts.length >= 5) {
    checks.workload = parts[1].length > 0;
    checks.environment = VALID_ENVIRONMENTS.includes(parts[2]);
    if (!checks.environment) {
      reasons.push(`Organizational Naming Violation: Invalid environment '${parts[2]}'. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`);
    }

    checks.region = parts[3].length > 0;
    checks.instance = /^\d{3}$/.test(parts[parts.length - 1]);
    if (!checks.instance) {
      reasons.push(`Organizational Naming Violation: Invalid instance number '${parts[parts.length - 1]}'. Must be a 3-digit number (e.g. 001)`);
    }
  } else {
    reasons.push(`Organizational Naming Violation: Invalid segment structure. Expected standard pattern: ${prefix}-<workload>-<environment>-<region>-<instance>`);
  }

  const orgCompliant = checks.resourceType && checks.environment && checks.region && checks.instance && checks.workload;
  const compliant = checks.azureValid && orgCompliant;

  const totalChecks = Object.keys(checks).length - 1;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    compliant,
    azureValid: checks.azureValid,
    orgCompliant,
    currentName: name,
    recommendedName,
    score,
    checks,
    reasons
  };
}

module.exports = {
  RESOURCE_PREFIX_MAP,
  RESOURCE_TYPE_DISPLAY_MAP,
  VALID_ENVIRONMENTS,
  formatResourceType,
  getResourcePrefix,
  generateRecommendedName,
  validateResourceName
};
