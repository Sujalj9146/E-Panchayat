import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Award, 
  Database,
  ArrowRight,
  Sparkles,
  Layers,
  Globe,
  LayoutDashboard,
  AlertTriangle,
  LineChart,
  FileText
} from 'lucide-react';

// Import local components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CitizenManagement } from './components/CitizenManagement';
import { BeneficiaryRecommendations } from './components/BeneficiaryRecommendations';
import { GrievanceManagement } from './components/GrievanceManagement';
import { DevelopmentProjects } from './components/DevelopmentProjects';
import { GramSabhaAI } from './components/GramSabhaAI';
import { GISMap } from './components/GISMap';
import { AIAssistant } from './components/AIAssistant';
import { Analytics } from './components/Analytics';

// Import i18n initialization
import './i18n/i18n';

function App() {
  const { i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);



  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(nextLang);
  };

  // Render active dashboard tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentTab={setCurrentTab} 
          />
        );
      case 'citizens':
        return <CitizenManagement />;
      case 'schemes':
        return <BeneficiaryRecommendations />;
      case 'grievances':
        return <GrievanceManagement />;
      case 'projects':
        return <DevelopmentProjects />;
      case 'sabha':
        return <GramSabhaAI />;
      case 'gis_map':
        return <GISMap />;
      case 'ai_assistant':
        return <AIAssistant />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. LANDING PAGE VIEW */}
      {viewMode === 'landing' && (
        <div className="relative overflow-hidden bg-[#070b13] min-h-screen flex flex-col justify-between">
          {/* Ambient Glows */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl -z-10" />

          {/* Navigation Bar */}
          <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-slate-900/60 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-extrabold text-lg">P</span>
              </div>
              <div className="flex flex-col select-none">
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">E-Panchayat AI</span>
                <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase">Gov-Tech Decision Support</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Switch */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
              >
                <Globe size={14} className="text-indigo-400" />
                <span>{i18n.language === 'en' ? 'मराठी' : 'English'}</span>
              </button>
              
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <span>Dashboard</span>
                <LayoutDashboard size={14} />
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <main className="max-w-7xl mx-auto w-full px-6 py-12 sm:py-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <Sparkles size={12} className="animate-pulse" />
                <span>Next-Generation Rural Governance Platform</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight font-sans m-0">
                Smarter Panchayats.<br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Better Decisions.</span>
              </h1>
              
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                AI-powered decision support for transparent, efficient, and data-driven rural governance. Translates fragmented databases, spatial maps, and Sabha transcripts into instantly actionable administrative insights.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => {
                    setCurrentTab('dashboard');
                    setViewMode('dashboard');
                  }}
                  className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/15 hover:translate-y-[-1px]"
                >
                  <span>Explore Dashboard</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('ai_assistant');
                    setViewMode('dashboard');
                  }}
                  className="px-6 py-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white font-bold text-sm flex items-center gap-2 transition-all"
                >
                  <Bot size={16} className="text-purple-400" />
                  <span>Ask Panchayat AI</span>
                </button>
              </div>
            </div>

            {/* Right Interactive Core Flow Graphic */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full max-w-md glass-card rounded-2xl border border-slate-850 p-6 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
                
                <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-3 flex items-center gap-2">
                  <Database size={14} className="text-indigo-400" />
                  <span>GraphRAG Data Architecture Flow</span>
                </h3>

                {/* Vertical Step Flow SVG/HTML */}
                <div className="space-y-4 text-xs font-mono">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded border border-slate-850">
                    <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-800">1</span>
                    <span className="text-slate-300">Fragmentation Sources (Citizen, GIS, Budgets)</span>
                  </div>
                  {/* Arrow */}
                  <div className="h-4 border-l border-indigo-500/30 ml-5"></div>
                  {/* Step 2 */}
                  <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded border border-slate-850">
                    <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-800">2</span>
                    <span className="text-slate-300">Vector Store (PostGIS + pgvector + Neo4j Graph)</span>
                  </div>
                  {/* Arrow */}
                  <div className="h-4 border-l border-indigo-500/30 ml-5"></div>
                  {/* Step 3 */}
                  <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded border border-slate-850">
                    <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-800">3</span>
                    <span className="text-purple-400 font-semibold flex items-center gap-1">
                      <Sparkles size={11} className="animate-spin text-purple-400" />
                      <span>Multilingual GraphRAG + LLM Engine</span>
                    </span>
                  </div>
                  {/* Arrow */}
                  <div className="h-4 border-l border-indigo-500/30 ml-5"></div>
                  {/* Step 4 */}
                  <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-950 to-purple-950 p-2.5 rounded border border-indigo-500/30">
                    <span className="w-5 h-5 rounded-full bg-indigo-900 flex items-center justify-center text-[10px] text-indigo-300 font-bold">4</span>
                    <span className="text-slate-200 font-semibold">Decisions support (Recommendations, Map, AI Chat)</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Features Grid Showcase */}
          <section className="bg-slate-950/40 border-t border-slate-900/60 py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="glass-card rounded-xl p-5 border border-slate-850 text-left space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Award size={18} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">AI Recommendations</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Assess citizen demographic parameters programmatically against criteria guidelines for pension or housing support.</p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card rounded-xl p-5 border border-slate-850 text-left space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Layers size={18} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">GIS Intelligence</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Pinpoint water wells, primary ZP schools, health clinics, civil projects, and unresolved grievances on a dark-themed street map.</p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card rounded-xl p-5 border border-slate-850 text-left space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <AlertTriangle size={18} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Smart Grievances</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Dynamic NLP heuristic categorizer that parses complaints to suggest category labels, urgency, coordinates, and route departments.</p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card rounded-xl p-5 border border-slate-850 text-left space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <LineChart size={18} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Project Monitoring</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Monitor ongoing civil constructions, track expenditures against budget ceilings, and flag delays via visual progress meters.</p>
              </div>

              {/* Feature 5 */}
              <div className="glass-card rounded-xl p-5 border border-slate-850 text-left space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <FileText size={18} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Gram Sabha AI</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Upload minutes documents to run automated GraphRAG summarization, extracting decisions and tracking action item task status.</p>
              </div>

              {/* Feature 6 */}
              <div className="glass-card rounded-xl p-5 border border-slate-850 text-left space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Bot size={18} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Unified Panchayat Data</h4>
                <p className="text-xs text-slate-400 leading-relaxed">A unified GraphRAG ChatGPT-style interface helping officials query budgets, citizen profiles, and files in English and Marathi.</p>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto w-full px-6 py-5 border-t border-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-20 text-[11px] text-slate-500">
            <span>© 2026 E-Panchayat AI. All rights reserved. Decision Support Portal.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400">Government Guidelines</a>
            </div>
          </footer>
        </div>
      )}

      {/* 2. DASHBOARD VIEW WITH SIDEBAR */}
      {viewMode === 'dashboard' && (
        <div className="flex min-h-screen bg-[#0b0f19]">
          <Sidebar 
            currentTab={currentTab} 
            setCurrentTab={setCurrentTab} 
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar Header */}
            <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 p-4 flex items-center justify-between z-20 select-none">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Khed Shivapur Gram Panchayat Portal</span>
                <span className="bg-indigo-600/20 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Active Session</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('landing')}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  ← Exit Dashboard
                </button>
              </div>
            </header>

            {/* Dashboard Content Outlet */}
            <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
              {renderTabContent()}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
