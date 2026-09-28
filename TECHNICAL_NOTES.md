# Technical Notes - Azure Governance & Discovery Portal

## Phase 3: Azure Resource Graph & Authentication Integration

### 1. Azure Authentication Method
- **Credential Provider:** `@azure/identity` using `DefaultAzureCredential`.
- **Authentication Source:** Local Azure CLI login (`az login`) session.
- **Security:** Zero hardcoded secrets, client secrets, passwords, or tokens. Authentication seamlessly leverages developer/workload context.

### 2. Azure Resource Graph SDK
- **Package:** `@azure/arm-resourcegraph` (`ResourceGraphClient`).
- **Client Instantiation:** `new ResourceGraphClient(new DefaultAzureCredential())`.

### 3. Subscription & Tenant Configuration
- **Subscription ID:** `51eaa99b-a883-4ed3-a1bb-882394f5553f` (Azure for Students)
- **Tenant ID:** `808cc83e-a546-47e7-a03f-73a1ebba24f3`
- **Configured via:** `backend/.env` variable `AZURE_SUBSCRIPTION_ID`.

---

## Phase 5, 7, & 8: Core Governance Engine Architecture

### 4. Naming Rules & Resource-Type Specific Conventions
- **General Pattern:** `<resource-type>-<workload>-<environment>-<region>-<instance>`
- **Storage Accounts Pattern:** `st<workload><environment><region><instance>`
- **Resource Display Names:**
  - `Microsoft.Compute/virtualMachines` &rarr; `Virtual Machine` (Prefix: `vm`)
  - `Microsoft.Web/sites` &rarr; `App Service` (Prefix: `app`)
  - `Microsoft.Storage/storageAccounts` &rarr; `Storage Account` (Prefix: `st`)
  - `Microsoft.KeyVault/vaults` &rarr; `Key Vault` (Prefix: `kv`)
  - `Microsoft.Network/virtualNetworks` &rarr; `Virtual Network` (Prefix: `vnet`)
  - `Microsoft.Sql/servers` &rarr; `SQL Server` (Prefix: `sql`)
  - `Microsoft.Resources/resourceGroups` &rarr; `Resource Group` (Prefix: `rg`)

### 5. Dual Compliance Validation Algorithm
Implemented in `backend/src/namingValidator.js`:
1. **Azure Platform Validity (`azureValid`):** Evaluates if the resource name satisfies Azure cloud provider rules (e.g. Storage Accounts: lowercase, alphanumeric, 3–24 characters, no hyphens).
2. **Organizational Naming Standard (`orgCompliant`):** Evaluates if the resource name strictly contains required organizational tokens (`prefix` + `workload` + `environment` + `region` + `instance`).
3. **Overall Compliance (`compliant`):** Requires `azureValid === true && orgCompliant === true`.
4. **Real Resource Evaluation (`stgovdemo2026`):**
   - **Azure Platform Validity:** `PASS` (`azureValid: true`)
   - **Organizational Governance Status:** `FAIL` (`orgCompliant: false`)
   - **Non-Compliance Reasons:**
     - Missing standard environment segment (`prod`, `dev`, `stage`, `test`, `qa`, `uat`, `dr`)
     - Missing region code segment `sc` in resource name
   - **Instance Check:** `PASS` (`checks.instance: true`, digits `2026` present)
   - **Recommended Replacement Name:** `stgovprodsc001` (fully Azure-valid and organizationally compliant)

---

## Phase 9 & 10: Exception Management & Final QA Polish

### 6. Mode-Isolated Governance Exception Management
- Endpoint `GET /api/governance/exceptions?mode=demo|azure` strictly separates exceptions by operating mode:
  - `mode=demo`: Returns seeded demo exception requests (`source: 'demo'`).
  - `mode=azure`: Returns live exception requests created during Live Azure operation (`source: 'live'`).
- **State Machine:** `PENDING` &rarr; `APPROVED` &rarr; `ACTIVE` &rarr; `EXPIRED`.

### 7. Final Verification Checklist
- **Backend Tests:** 19 / 19 tests passing (`npm test`).
- **Frontend Production Build:** Vite build passing in ~2s (`npm run build`).
- **Live Azure Connection:** Verified live connection to subscription `51eaa99b-a883-4ed3-a1bb-882394f5553f`.
- **Live Resource (`stgovdemo2026`):** Successfully discovered via Resource Graph, evaluated with dual compliance status (`Azure Validity: PASS`, `Org Governance: NON-COMPLIANT`), with recommended name `stgovprodsc001`.
