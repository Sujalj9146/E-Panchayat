# 🏛️ Loni Kalbhor E-Panchayat Decision Support Portal

An interactive, high-fidelity Government-Tech (Gov-Tech) portal and AI Administration System custom-designed for the **Loni Kalbhor** Gram Panchayat in Pune, Maharashtra. 

This platform integrates automated policy verification rules, GIS mappings, department-specific grievance routing, meeting transcript processing, and active citizen data persistence with a multi-mode **Google Gemini 2.5 Flash Cloud LLM** / offline search engine assistant.

---

## ✨ Features Breakdown

### 🤖 1. Dual AI Helpdesks (Officer AI Assistant & Citizen Portal Chat)
- **Zero-Config Cloud LLM**: Fully integrates with Google's Gemini API via Vite environment variables.
- **Offline GraphRAG Fallback Engine**: If no key is present or the API experiences network failure, the chatbots dynamically query a local offline database utilizing mock semantic routing paths.
- **Departmental Knowledge injection**: Automatically constructs local contextual prompts regarding unresolved grievances, delayed civil projects, and Sabha schedules for accurate generative outputs.

### 📋 2. Automated Scheme Eligibility & Document Auditor
- **Automatic Demographics Filter**: Scans candidates based on age bounds, occupation, and family income thresholds.
- **Digital Locker Verification**: Automatically checks citizen folders for required documents (e.g., Aadhaar Card, 7/12 Extract, Income Certificate).
- **Status Audit Tracker**: Indicates whether citizens are **Eligible** (criteria and files verified), **Missing Papers** (demographics match but files are missing/pending), or **Ineligible** (demographics do not match policy requirements).

### 📍 3. Interactive GIS Map Layer
- **CartoDB Dark Theme Mappings**: Loaded dynamically with custom-styled map marker nodes.
- **Custom Facility Filters**: Toggle displays for healthcare sub-centres, public schools, active road projects, and unresolved grievances.
- **Detail Popups**: Displays live metrics (progress bars, priority alerts, budget spent) directly upon clicking pins.

### 📁 4. Gram Sabha transcript Processor (Document AI)
- **Mock Document Upload**: Processes raw meeting minutes or audio transcripts.
- **Structured Action Items**: Extracts major decisions and populates an interactive, trackable checklist of tasks.
- **Status Toggling & Retention**: Toggle actions between *Pending*, *In Progress*, and *Completed* with instant local caching.

### 📊 5. Financial & Demographics Analytics
- **Recharts Data Visualization Panels**: Displays dynamic charts for:
  - Age demographics distribution.
  - Project budgets vs. actual expenditure (in ₹ Lakhs).
  - Potential scheme enrollment capacities.
  - Grievance volume load by department.
- **Hover Logic Clarification**: Sleek `(i)` icons next to every title display precise formulas on hover.

---

## 🛠️ Technical Architecture

```
   ┌─────────────────────────────────────────────────────────────┐
   │                       React Frontend                        │
   └───────────────┬─────────────────────────────┬───────────────┘
                   ▼                             ▼
       ┌──────────────────────┐       ┌──────────────────────┐
       │   LocalStorage Caching│       │   react-i18next      │
       │   (Local Persistence)│       │   (Bilingual EN/MR)  │
       └──────────────────────┘       └──────────────────────┘
                   ▲
                   │ (Loads & Syncs Core Datasets)
                   ▼
┌────────────────────────────────────────────────────────────────┐
│                          Mock Database                         │
│   (CITIZENS, GRIEVANCES, PROJECTS, SCHEMES, CITIZEN_DOCUMENTS)  │
└───────────────────────────────┬────────────────────────────────┘
                                │
                                ▼
       ┌─────────────────────────────────────────────────┐
       │             AI Orchestrator Client              │
       └───────────────┬─────────────────┬───────────────┘
                       │                 │
       (If API Key)    ▼                 ▼  (If Offline / Error)
    ┌─────────────────────┐           ┌─────────────────────┐
    │  Google Gemini API  │           │ Offline GraphRAG    │
    │  (2.5 Flash Cloud)  │           │ Simulated Search    │
    └─────────────────────┘           └─────────────────────┘
```

---

## 💾 Data Persistence Layer
The portal implements a client-side persistence layer utilizing `localStorage`. This ensures that all modifications:
- Submitting a new citizen grievance.
- Approving or dismissing new government scheme feeds.
- Creating or editing Gram Sabha action items.
- Approving or rejecting citizen digital locker files.
- Modifying civil project progress metrics.

...are **fully retained** even after refreshing the page or restarting your browser.

---

## 🚀 Setup & Execution Instructions

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 2. Installation
Clone this repository, navigate to the folder, and install all dependencies:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(If no `.env` file is created, the application will automatically fall back to the offline search mode).*

### 4. Running Locally
Launch the local Vite development server:
```bash
npm run dev
```
Open your browser and navigate to the printed URL (typically `http://localhost:5173`).

### 5. Production Compilation
Generate the optimized static build folder:
```bash
npm run build
```
The compiled HTML, CSS, and JS output will be placed inside the `./dist` directory.
