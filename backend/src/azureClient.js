const { DefaultAzureCredential } = require('@azure/identity');
const { ResourceGraphClient } = require('@azure/arm-resourcegraph');

const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID || '51eaa99b-a883-4ed3-a1bb-882394f5553f';

/**
 * Returns an instance of DefaultAzureCredential
 */
function getCredential() {
  return new DefaultAzureCredential();
}

/**
 * Returns an instance of ResourceGraphClient
 */
function getResourceGraphClient() {
  const credential = getCredential();
  return new ResourceGraphClient(credential);
}

/**
 * Verifies Azure credential and subscription access
 */
async function checkAzureStatus() {
  try {
    const client = getResourceGraphClient();
    // Simple light test query to verify authentication and access
    const queryRequest = {
      subscriptions: [SUBSCRIPTION_ID],
      query: 'Resources | summarize count()',
    };
    await client.resources(queryRequest);
    return {
      connected: true,
      subscriptionId: SUBSCRIPTION_ID,
      message: 'Azure connection successful',
    };
  } catch (error) {
    console.error('Azure authentication/connection error:', error);
    const statusCode = error.statusCode || error.status || (error.message?.includes('Authentication') ? 401 : 500);
    throw {
      statusCode: statusCode === 401 || statusCode === 403 ? statusCode : 500,
      connected: false,
      subscriptionId: SUBSCRIPTION_ID,
      message: error.message || 'Failed to connect to Azure',
    };
  }
}

/**
 * Queries Azure Resource Graph for resources in the subscription
 */
async function getAzureResources(queryOverride) {
  try {
    const client = getResourceGraphClient();
    const query = queryOverride || 'Resources | project id, name, type, resourceGroup, location, tags | limit 100';
    
    const queryRequest = {
      subscriptions: [SUBSCRIPTION_ID],
      query: query,
    };
    
    const response = await client.resources(queryRequest);
    const rawData = response.data || [];
    
    // Normalize data structure
    const resources = rawData.map(item => ({
      id: item.id || '',
      name: item.name || '',
      type: item.type || '',
      resourceGroup: item.resourceGroup || item.resourcegroup || '',
      location: item.location || '',
      tags: item.tags || {}
    }));

    return {
      count: resources.length,
      resources: resources
    };
  } catch (error) {
    console.error('Azure Resource Graph query error:', error);
    const statusCode = error.statusCode || error.status || 500;
    throw {
      statusCode: statusCode === 401 || statusCode === 403 ? statusCode : 500,
      error: error.message || 'Failed to query Azure Resource Graph'
    };
  }
}

module.exports = {
  SUBSCRIPTION_ID,
  checkAzureStatus,
  getAzureResources
};
