# Azure Governance & Discovery Portal

Enterprise resource naming standard enforcement, automated compliance monitoring, and estate discoverability portal built with React + Vite, Node.js + Express, and Azure Resource Graph SDK.

---

## Prerequisites
Before running the application on another laptop or machine, ensure the following are installed:

1. **Node.js**: v18.0.0 or higher (v22+ recommended)
2. **npm**: v9.0.0 or higher
3. **Azure CLI**: Required for Live Azure Mode (`az` command available in PATH)

---

## Setup & Running the Application

### 1. Azure Login (Required for Live Azure Mode)
Authenticate with your Azure account via Azure CLI in your terminal:
```bash
az login
```
Verify that your active subscription is selected:
```bash
az account show
```
If necessary, set your active subscription ID:
```bash
az account set --subscription "YOUR_AZURE_SUBSCRIPTION_ID"
```

---

### 2. Backend Setup & Startup
Navigate to the `backend` directory, install dependencies, and start the Express server:
```bash
cd backend
npm install
npm start
```
- **Backend API URL:** `http://localhost:5000`
- **Environment Configuration:** Copy `.env.example` to `.env` if you need custom port or subscription configuration:
  ```bash
  cp .env.example .env
  ```

---

### 3. Frontend Setup & Startup
In a separate terminal window, navigate to the `frontend` directory, install dependencies, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Portal URL:** `http://localhost:3000`
- **Environment Configuration:** Copy `.env.example` to `.env` if your backend is hosted on a different port or machine:
  ```bash
  cp .env.example .env
  ```

---

## Operating Modes

### 1. Live Azure Mode
- Queries your connected Azure subscription in real time using `@azure/arm-resourcegraph` and `@azure/identity` (`DefaultAzureCredential`).
- Authenticates seamlessly via your local `az login` session — zero hardcoded credentials, client secrets, or passwords required.
- If your Azure subscription currently contains zero resources, a clear empty-state notification is displayed:
  > *"Azure connected successfully, but no resources were found in this subscription."*
  > With a button to **Switch to Demo Data**.

### 2. Demo Data Mode
- Provides a synthetic dataset of 10 realistic Azure resources (Virtual Machines, App Services, Storage Accounts, Key Vaults, Virtual Networks, SQL Databases) to demonstrate governance rule validation, recommendations, and remediation workflows.
- All synthetic resources are explicitly labeled with **`DEMO DATA`** badges.

---

## Port Configuration & LAN Access

- **Default Backend Port:** `5000`
- **Default Frontend Port:** `3000`

### Sharing Access Across LAN / Wi-Fi
To allow another laptop on the same local network to access the portal:
1. Start the frontend with the `--host` flag:
   ```bash
   cd frontend
   npx vite --host 0.0.0.0 --port 3000
   ```
2. Set `VITE_API_BASE_URL` in `frontend/.env` to your host machine's IP address:
   ```env
   VITE_API_BASE_URL=http://<YOUR_HOST_IP>:5000
   ```
3. Open `http://<YOUR_HOST_IP>:3000` on the other laptop.

---

## Automated Tests & Production Build

Run backend unit and integration tests:
```bash
cd backend
npm test
```

Run frontend production build verification:
```bash
cd frontend
npm run build
```

---

## Troubleshooting

### 1. Backend Service Unreachable (`Backend: Offline`)
- Verify that the Express server is running on port `5000` (`cd backend && npm start`).
- Confirm `VITE_API_BASE_URL` in `frontend/.env` is set to `http://localhost:5000`.

### 2. Azure Authentication Error / 401 Unauthorized
- Ensure Azure CLI is installed and logged in (`az login`).
- Confirm your Azure account has read permissions on subscription `AZURE_SUBSCRIPTION_ID`.

### 3. Missing `.env` Files
- Ensure `backend/.env` exists with `AZURE_SUBSCRIPTION_ID` set.
- Copy `.env.example` to `.env` in both `backend/` and `frontend/` folders.

### 4. CORS Errors
- CORS is enabled in `backend/src/index.js` using `app.use(cors())`. If connecting across hostnames, verify origin headers.
"# CC-P097-T097" 
"# CC-P097-T097" 
