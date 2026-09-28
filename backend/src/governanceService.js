const { getAzureResources } = require('./azureClient');
const { DEMO_RESOURCES } = require('./mockData');
const { validateResourceName } = require('./namingValidator');

/**
 * Retrieves normalized resources based on mode ('demo' or 'azure')
 */
async function getResourcesByMode(mode = 'azure') {
  if (mode === 'demo') {
    return {
      mode: 'demo',
      count: DEMO_RESOURCES.length,
      resources: DEMO_RESOURCES
    };
  }

  const azureResult = await getAzureResources();
  const normalizedResources = (azureResult.resources || []).map(res => ({
    ...res,
    isDemo: false
  }));

  return {
    mode: 'azure',
    count: normalizedResources.length,
    resources: normalizedResources
  };
}

/**
 * Calculates governance compliance summary with structured breakdown
 */
async function getComplianceSummary(mode = 'azure') {
  const resourceData = await getResourcesByMode(mode);
  const rawResources = resourceData.resources || [];

  let compliantCount = 0;
  let nonCompliantCount = 0;

  const byResourceType = {};
  const byEnvironment = {};
  const commonIssuesCount = {};

  const evaluatedResources = rawResources.map(res => {
    const validation = validateResourceName(res);
    const rType = res.type.split('/').pop() || res.type;
    const rEnv = (res.environment || 'N/A').toUpperCase();

    // Breakdown by type
    if (!byResourceType[rType]) byResourceType[rType] = { total: 0, compliant: 0, nonCompliant: 0 };
    byResourceType[rType].total++;

    // Breakdown by env
    if (!byEnvironment[rEnv]) byEnvironment[rEnv] = { total: 0, compliant: 0, nonCompliant: 0 };
    byEnvironment[rEnv].total++;

    if (validation.compliant) {
      compliantCount++;
      byResourceType[rType].compliant++;
      byEnvironment[rEnv].compliant++;
    } else {
      nonCompliantCount++;
      byResourceType[rType].nonCompliant++;
      byEnvironment[rEnv].nonCompliant++;

      validation.reasons.forEach(reason => {
        commonIssuesCount[reason] = (commonIssuesCount[reason] || 0) + 1;
      });
    }

    return {
      ...res,
      compliance: {
        compliant: validation.compliant,
        currentName: validation.currentName,
        recommendedName: validation.recommendedName,
        score: validation.score,
        checks: validation.checks,
        reasons: validation.reasons
      }
    };
  });

  const total = rawResources.length;
  const percentage = total > 0 ? Math.round((compliantCount / total) * 100) : 100;

  return {
    mode: resourceData.mode,
    totalResources: total,
    compliantResources: compliantCount,
    nonCompliantResources: nonCompliantCount,
    compliancePercentage: percentage,
    resourcesWithIssues: evaluatedResources,
    namingBreakdown: {
      byResourceType,
      byEnvironment,
      commonIssues: commonIssuesCount
    }
  };
}

/**
 * Generates remediation actions for non-compliant resources
 */
async function getRemediationPlan(mode = 'azure') {
  const complianceData = await getComplianceSummary(mode);
  const nonCompliantResources = (complianceData.resourcesWithIssues || []).filter(r => !r.compliance?.compliant);

  const remediations = nonCompliantResources.map(res => {
    const recommendedName = res.compliance?.recommendedName;
    const typeShort = res.type.split('/').pop();

    return {
      id: res.id,
      name: res.name,
      currentName: res.name,
      recommendedName: recommendedName,
      resourceType: res.type,
      resourceGroup: res.resourceGroup,
      location: res.location,
      reasons: res.compliance?.reasons || [],
      checks: res.compliance?.checks || {},
      score: res.compliance?.score || 0,
      remediationSteps: [
        `1. Deploy replacement ${typeShort} using compliant name '${recommendedName}' in resource group '${res.resourceGroup}'.`,
        `2. Migrate workload configuration, data, and access control policies from '${res.name}' to '${recommendedName}'.`,
        `3. Update DNS records, connection strings, and application configuration references.`,
        `4. Run validation checks to ensure zero-downtime transition to '${recommendedName}'.`,
        `5. Decommission and retire non-compliant resource '${res.name}' according to governance retention policy.`
      ]
    };
  });

  return {
    mode: complianceData.mode,
    nonCompliantCount: remediations.length,
    remediations: remediations
  };
}

module.exports = {
  getResourcesByMode,
  getComplianceSummary,
  getRemediationPlan
};
