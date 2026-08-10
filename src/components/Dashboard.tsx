import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Home, 
  Award, 
  AlertTriangle, 
  Hammer, 
  Coins, 
  ChevronRight,
  Bot,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 

  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { CITIZENS, GRIEVANCES, PROJECTS } from '../data/mockData';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  setCurrentTab
}) => {
  const { t, i18n } = useTranslation();

  // Summary Metrics (mix of official Panchayat Brief figures + real counts from database)
  const metrics = [
    { 
      label: t('dashboard.total_citizens'), 
      value: '12,450', 
      sub: `Active: ${CITIZENS.length} DB records`, 
      icon: Users, 
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/10'
    },
    { 
      label: t('dashboard.families'), 
      value: '3,210', 
      sub: 'Mapped: 4 main clans', 
      icon: Home, 
      color: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/10'
    },
    { 
      label: t('dashboard.active_schemes'), 
      value: '18', 
      sub: '4 local subsidies active', 
      icon: Award, 
      color: 'from-amber-600 to-orange-600',
      shadow: 'shadow-amber-500/10'
    },
    { 
      label: t('dashboard.pending_grievances'), 
      value: '126', 
      sub: `${GRIEVANCES.filter(g => g.status !== 'Resolved').length} active mock cases`, 
      icon: AlertTriangle, 
      color: 'from-rose-600 to-red-600',
      shadow: 'shadow-rose-500/10'
    },
    { 
      label: t('dashboard.ongoing_projects'), 
      value: '24', 
      sub: `${PROJECTS.filter(p => p.status === 'Ongoing').length} monitoring feed`, 
      icon: Hammer, 
      color: 'from-cyan-600 to-sky-600',
      shadow: 'shadow-cyan-500/10'
    },
    { 
      label: t('dashboard.project_budget'), 
      value: '₹2.4 Cr', 
      sub: 'Spent: ₹1.82 Cr (76%)', 
      icon: Coins, 
      color: 'from-purple-600 to-fuchsia-600',
      shadow: 'shadow-purple-500/10'
    },
  ];

  // AI Governance Insights (Clicking view details updates filters & navigates)
  const insights = [
    {
      text: t('dashboard.insight_1'),
      action: () => {
        setCurrentTab('schemes');
      }
    },
    {
      text: t('dashboard.insight_2'),
      action: () => {
        setCurrentTab('grievances');
      }
    },
    {
      text: t('dashboard.insight_3'),
      action: () => {
        setCurrentTab('projects');
      }
    },
    {
      text: t('dashboard.insight_4'),
      action: () => {
        setCurrentTab('projects');
      }
    }
  ];

  // Quick stats for mini graphs
  const projectProgressData = PROJECTS.map(p => ({
    name: i18n.language === 'en' ? p.name.substring(0, 15) + '...' : p.nameMr.substring(0, 15) + '...',
    progress: p.progress,
    budget: p.budget / 1000, // in k
    utilized: p.utilized / 1000 // in k
  }));

  const grievanceCategories = [
    { name: i18n.language === 'en' ? 'Water' : 'पानी पुरवठा', value: 2, color: '#3b82f6' },
    { name: i18n.language === 'en' ? 'Roads' : 'रस्ते', value: 1, color: '#f59e0b' },
    { name: i18n.language === 'en' ? 'Electricity' : 'विद्युत', value: 1, color: '#eab308' },
    { name: i18n.language === 'en' ? 'Sanitation' : 'स्वच्छता', value: 1, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-govblue-950 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-4 border border-indigo-500/20">
            <Sparkles size={12} className="animate-spin" />
            <span>AI-Powered Panchayat Administration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-sans m-0 mb-2">
            {t('app_title')}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {i18n.language === 'en' 
              ? 'Smarter Panchayats. Better Decisions. Unified support dashboard mapping Citizen Records, Schemes eligibility, Grievances routing, Sabha transcripts, and GIS maps.'
              : 'स्मार्ट पंचायत, अधिक चांगले निर्णय. नागरिक अभिलेख, योजनांची पात्रता, तक्रार निवारण, ग्रामसभेचे वृत्तांत आणि जीआयएस नकाशे एकत्रित करणारा सक्षम प्रशासन कक्ष.'}
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`glass-card rounded-xl p-5 hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden group shadow-lg ${card.shadow}`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">{card.label}</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white block">{card.value}</span>
                  <span className="text-[11px] text-slate-500 block">{card.sub}</span>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Governance Insights Section */}
      <div className="glass-card rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/25">
              <Bot size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white m-0 tracking-wide">{t('dashboard.ai_insights')}</h2>
              <p className="text-xs text-slate-500">Real-time alerts, delays, budget checks, and anomalies detected by GraphRAG model.</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('ai_assistant')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline transition-colors"
          >
            <span>Ask AI Assistant</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-start justify-between gap-4 group hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Insight Alert</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {insight.text}
                </p>
              </div>
              <button 
                onClick={insight.action}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 whitespace-nowrap flex items-center mt-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>{t('dashboard.view_details')}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Grid for two side-by-side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Budgets Chart */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 lg:col-span-2">
          <h2 className="text-base font-bold text-white mb-4 tracking-wide">Ongoing Projects Budget Analysis</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="k" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar name="Total Budget (₹K)" dataKey="budget" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar name="Utilized Fund (₹K)" dataKey="utilized" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grievances Pie Chart */}
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 tracking-wide">Grievances Category Load</h2>
          <div className="h-56 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={grievanceCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {grievanceCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-xl font-extrabold text-white">5</span>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Mock</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
            {grievanceCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name} ({cat.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
