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
import { CitizenPortal } from './components/CitizenPortal';

// Import i18n initialization
import './i18n/i18n';

function App() {
  const { i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<'officer' | 'citizen'>('officer');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(nextLang);
  };

  // Render active dashboard tab
  const renderTabContent = () => {
    if (userRole === 'citizen') {
      return <CitizenPortal currentTab={currentTab} setCurrentTab={setCurrentTab} />;
    }

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
    <div className="min-h-screen text-slate-800 bg-[#f4f6f9] font-sans selection:bg-govsaffron selection:text-white">
      {/* 1. LANDING PAGE VIEW */}
      {viewMode === 'landing' && (
        <div className="relative overflow-hidden bg-slate-50 min-h-screen flex flex-col justify-between">
          {/* Top National Tricolor Indicator Strip */}
          <div className="w-full gov-tricolor-strip z-20" />

          {/* Official Indian Gov Header Banner */}
          <div className="bg-white border-b border-slate-200 py-3 shadow-sm z-20">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Ashoka Emblem Vector representation */}
                <div className="w-12 h-14 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1.5 shadow-sm">
                  <div className="flex flex-col items-center select-none text-[8px] font-bold text-amber-800">
                    <span className="text-xs">🦁</span>
                    <span className="tracking-tighter">सत्यमेव</span>
                    <span className="tracking-tighter">जयते</span>
                  </div>
                </div>
                <div className="flex flex-col select-none">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Ministry of Rural Development • Government of Maharashtra</span>
                  <span className="font-extrabold text-govnavy tracking-tight text-lg">KHED SHIVAPUR GRAM PANCHAYAT</span>
                  <span className="text-[10px] font-bold text-govsaffron uppercase tracking-widest mt-0.5">Decision Support Support Portal (DSS)</span>
                </div>
              </div>

              {/* PM/CM & Flag Section */}
              <div className="flex items-center gap-6 self-end md:self-center">
                <div className="text-right hidden sm:block">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Digital Governance</span>
                  <span className="text-xs font-extrabold text-govgreen uppercase block">Swachh Bharat Abhiyan Mapped</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-sm">🇮🇳</span>
                  <span className="text-xs font-bold text-slate-700">English | मराठी</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Landing Page Navigation */}
          <header className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-govsaffron animate-pulse" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GraphRAG AI Operational Mode</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switch */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-bold shadow-sm"
              >
                <Globe size={14} className="text-govnavy" />
                <span>{i18n.language === 'en' ? 'मराठी' : 'English'}</span>
              </button>
              
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 rounded-lg bg-govnavy hover:bg-govblue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Explore Dashboard</span>
                <LayoutDashboard size={14} />
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <main className="max-w-7xl mx-auto w-full px-6 py-12 sm:py-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-govnavy/10 text-govnavy text-[11px] font-bold uppercase tracking-wider border border-govnavy/15 select-none">
                <Sparkles size={12} className="text-govsaffron animate-pulse" />
                <span>AI Governance Systems Integration</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-govnavy leading-tight tracking-tight m-0 font-sans">
                Smarter Panchayats.<br />
                <span className="text-govsaffron">Better Decisions.</span>
              </h1>
              
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                AI-powered decision support for transparent, efficient, and data-driven rural governance. Translates fragmented databases, spatial maps, and Sabha transcripts into instantly actionable administrative insights.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => {
                    setCurrentTab('dashboard');
                    setViewMode('dashboard');
                  }}
                  className="px-6 py-3 rounded-lg bg-govnavy hover:bg-govblue-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:translate-y-[-1px]"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('ai_assistant');
                    setViewMode('dashboard');
                  }}
                  className="px-6 py-3 rounded-lg bg-white border border-govsaffron text-govsaffron hover:bg-orange-50/50 font-bold text-sm flex items-center gap-2 transition-all"
                >
                  <Bot size={16} />
                  <span>Ask Panchayat AI</span>
                </button>
              </div>
            </div>

            {/* Right Flow Diagram Card */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm border-t-4 border-govsaffron relative overflow-hidden">
                
                <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Database size={14} className="text-govnavy" />
                  <span>Unified Panchayat Data Architecture</span>
                </h3>

                {/* Vertical Step Flow */}
                <div className="space-y-3.5 text-xs font-semibold font-sans">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-200">1</span>
                    <span className="text-slate-700">PANCHAYAT DATA (Citizens, GIS, Sabha transcripts, Budgets)</span>
                  </div>
                  {/* Arrow */}
                  <div className="h-3 border-l-2 border-dashed border-govsaffron/40 ml-5"></div>
                  {/* Step 2 */}
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-200">2</span>
                    <span className="text-slate-700">DATABASES (PostgreSQL + PostGIS + pgvector + Neo4j)</span>
                  </div>
                  {/* Arrow */}
                  <div className="h-3 border-l-2 border-dashed border-govsaffron/40 ml-5"></div>
                  {/* Step 3 */}
                  <div className="flex items-center gap-3 bg-govblue-50 p-2.5 rounded border border-govblue-200">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] text-govnavy font-bold border border-govblue-200">3</span>
                    <span className="text-govnavy font-bold flex items-center gap-1">
                      <Sparkles size={12} className="text-govsaffron animate-pulse" />
                      <span>GraphRAG + Multilingual Embeddings LLM</span>
                    </span>
                  </div>
                  {/* Arrow */}
                  <div className="h-3 border-l-2 border-dashed border-govsaffron/40 ml-5"></div>
                  {/* Step 4 */}
                  <div className="flex items-center gap-3 bg-emerald-50 p-2.5 rounded border border-emerald-250">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] text-govgreen font-bold border border-emerald-200">4</span>
                    <span className="text-govgreen font-extrabold">BETTER DECISIONS (Officer Insights & Recommendations)</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Features Grid Showcase */}
          <section className="bg-slate-100/80 border-t border-slate-200 py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 text-left space-y-2.5 border-t-3 border-govsaffron">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-govsaffron border border-orange-100">
                  <Award size={18} />
                </div>
                <h4 className="text-sm font-bold text-govblue-900 tracking-wide uppercase">AI Recommendations</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Assess citizen demographic parameters programmatically against criteria guidelines for pension or housing support.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 text-left space-y-2.5 border-t-3 border-govnavy">
                <div className="w-9 h-9 rounded-lg bg-govblue-50 flex items-center justify-center text-govnavy border border-govblue-100">
                  <Layers size={18} />
                </div>
                <h4 className="text-sm font-bold text-govblue-900 tracking-wide uppercase">GIS Intelligence</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Pinpoint water wells, primary ZP schools, health clinics, civil projects, and unresolved grievances on a dark-themed street map.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 text-left space-y-2.5 border-t-3 border-govgreen">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-govgreen border border-emerald-100">
                  <AlertTriangle size={18} />
                </div>
                <h4 className="text-sm font-bold text-govblue-900 tracking-wide uppercase">Smart Grievances</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Dynamic NLP heuristic categorizer that parses complaints to suggest category labels, urgency, coordinates, and route departments.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 text-left space-y-2.5 border-t-3 border-govnavy">
                <div className="w-9 h-9 rounded-lg bg-govblue-50 flex items-center justify-center text-govnavy border border-govblue-100">
                  <LineChart size={18} />
                </div>
                <h4 className="text-sm font-bold text-govblue-900 tracking-wide uppercase">Project Monitoring</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Monitor ongoing civil constructions, track expenditures against budget ceilings, and flag delays via visual progress meters.</p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 text-left space-y-2.5 border-t-3 border-govsaffron">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-govsaffron border border-orange-100">
                  <FileText size={18} />
                </div>
                <h4 className="text-sm font-bold text-govblue-900 tracking-wide uppercase">Gram Sabha AI</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Upload minutes documents to run automated GraphRAG summarization, extracting decisions and tracking action item task status.</p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 text-left space-y-2.5 border-t-3 border-govgreen">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-govgreen border border-emerald-100">
                  <Bot size={18} />
                </div>
                <h4 className="text-sm font-bold text-govblue-900 tracking-wide uppercase">Unified Panchayat Data</h4>
                <p className="text-xs text-slate-500 leading-relaxed">A unified GraphRAG ChatGPT-style interface helping officials query budgets, citizen profiles, and files in English and Marathi.</p>
              </div>

            </div>
          </section>

          {/* National Informatics Centre (NIC) stamp footer */}
          <footer className="bg-white border-t border-slate-200 z-20 text-[11px] text-slate-500">
            <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span>© 2026 Khed Shivapur Gram Panchayat. Built for rural governance analytics.</span>
              <div className="flex gap-4 font-bold text-slate-600">
                <span className="select-none">Designed by National Informatics Centre (NIC) Mode</span>
                <span>•</span>
                <a href="#" className="hover:underline">Terms & Conditions</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* 2. DASHBOARD VIEW WITH SIDEBAR */}
      {viewMode === 'dashboard' && (
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar 
            currentTab={currentTab} 
            setCurrentTab={setCurrentTab} 
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            role={userRole}
          />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar Header */}
            <header className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-20 select-none shadow-sm">
              <div className="flex items-center gap-3">
                {/* Small Emblem stamp */}
                <span className="text-xs font-extrabold text-govblue-900 uppercase">Khed Shivapur Gram Panchayat Portal</span>
                <span className="bg-govgreen/10 text-govgreen text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase border border-govgreen/20">Active Session</span>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <span className="text-[10px] font-bold text-slate-500">PORTAL VIEW:</span>
                  <select
                    value={userRole}
                    onChange={(e) => {
                      setUserRole(e.target.value as any);
                      setCurrentTab('dashboard'); // Reset default view
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-govblue-900 rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="officer">Panchayat Officer 👤</option>
                    <option value="citizen">Public Citizen 👥</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('landing')}
                  className="text-xs font-bold text-govsaffron hover:text-orange-600 transition-colors"
                >
                  ← Exit Portal
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
