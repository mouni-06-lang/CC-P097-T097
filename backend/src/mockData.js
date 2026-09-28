/**
 * Mock Azure Resources for Demo Mode
 * Represents realistic Azure resources with a mix of compliant and non-compliant names.
 * All items explicitly set isDemo: true.
 */

const DEMO_RESOURCES = [
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-payment-prod-eastus-001/providers/Microsoft.Compute/virtualMachines/vm-payment-prod-eastus-001',
    name: 'vm-payment-prod-eastus-001',
    type: 'Microsoft.Compute/virtualMachines',
    resourceGroup: 'rg-payment-prod-eastus-001',
    location: 'eastus',
    environment: 'prod',
    workload: 'payment',
    instance: '001',
    tags: { Environment: 'production', Owner: 'FinTech Team' },
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-legacy-apps/providers/Microsoft.Compute/virtualMachines/MyOldVM123',
    name: 'MyOldVM123',
    type: 'Microsoft.Compute/virtualMachines',
    resourceGroup: 'rg-legacy-apps',
    location: 'eastus',
    environment: 'unknown',
    workload: 'legacy',
    instance: '123',
    tags: { Environment: 'legacy' },
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-orders-dev-westeurope-001/providers/Microsoft.Web/sites/app-orders-dev-westeurope-001',
    name: 'app-orders-dev-westeurope-001',
    type: 'Microsoft.Web/sites',
    resourceGroup: 'rg-orders-dev-westeurope-001',
    location: 'westeurope',
    environment: 'dev',
    workload: 'orders',
    instance: '001',
    tags: { App: 'OrderProcessing' },
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-orders-dev/providers/Microsoft.Web/sites/orders_web_api_dev',
    name: 'orders_web_api_dev',
    type: 'Microsoft.Web/sites',
    resourceGroup: 'rg-orders-dev',
    location: 'westeurope',
    environment: 'dev',
    workload: 'orders',
    instance: '001',
    tags: {},
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-analytics-prod-centralindia-001/providers/Microsoft.Storage/storageAccounts/stanalyticsprodcentralindia001',
    name: 'stanalyticsprodcentralindia001',
    type: 'Microsoft.Storage/storageAccounts',
    resourceGroup: 'rg-analytics-prod-centralindia-001',
    location: 'centralindia',
    environment: 'prod',
    workload: 'analytics',
    instance: '001',
    tags: { DataClassification: 'Confidential' },
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/Default-Storage-WestUS/providers/Microsoft.Storage/storageAccounts/tempstorage2024',
    name: 'tempstorage2024',
    type: 'Microsoft.Storage/storageAccounts',
    resourceGroup: 'Default-Storage-WestUS',
    location: 'westus',
    environment: 'temp',
    workload: 'temp',
    instance: '2024',
    tags: {},
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-auth-prod-eastus-001/providers/Microsoft.KeyVault/vaults/kv-auth-prod-eastus-001',
    name: 'kv-auth-prod-eastus-001',
    type: 'Microsoft.KeyVault/vaults',
    resourceGroup: 'rg-auth-prod-eastus-001',
    location: 'eastus',
    environment: 'prod',
    workload: 'auth',
    instance: '001',
    tags: { SecurityTier: 'High' },
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-auth-prod/providers/Microsoft.KeyVault/vaults/ProdKeyVaultSecret1',
    name: 'ProdKeyVaultSecret1',
    type: 'Microsoft.KeyVault/vaults',
    resourceGroup: 'rg-auth-prod',
    location: 'eastus',
    environment: 'prod',
    workload: 'auth',
    instance: '001',
    tags: {},
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-net-prod-eastus-001/providers/Microsoft.Network/virtualNetworks/vnet-net-prod-eastus-001',
    name: 'vnet-net-prod-eastus-001',
    type: 'Microsoft.Network/virtualNetworks',
    resourceGroup: 'rg-net-prod-eastus-001',
    location: 'eastus',
    environment: 'prod',
    workload: 'net',
    instance: '001',
    tags: { Tier: 'Networking' },
    isDemo: true
  },
  {
    id: '/subscriptions/51eaa99b-a883-4ed3-a1bb-882394f5553f/resourceGroups/rg-database-prod-eastus-001/providers/Microsoft.Sql/servers/sql-db-prod-eastus-001',
    name: 'sql-db-prod-eastus-001',
    type: 'Microsoft.Sql/servers',
    resourceGroup: 'rg-database-prod-eastus-001',
    location: 'eastus',
    environment: 'prod',
    workload: 'db',
    instance: '001',
    tags: { Criticality: 'High' },
    isDemo: true
  }
];

module.exports = {
  DEMO_RESOURCES
};
