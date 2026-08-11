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

  // Summary Metrics with official colors
  const metrics = [
    { 
      label: t('dashboard.total_citizens'), 
      value: '12,450', 
      sub: `Active: ${CITIZENS.length} DB records`, 
      icon: Users, 
      borderClass: 'border-t-4 border-govblue-600',
      iconColor: 'bg-govblue-50 text-govblue-700 border border-govblue-200'
    },
    { 
      label: t('dashboard.families'), 
      value: '3,210', 
      sub: 'Mapped: 4 main clans', 
      icon: Home, 
      borderClass: 'border-t-4 border-govgreen',
      iconColor: 'bg-emerald-50 text-govgreen border border-emerald-200'
    },
    { 
      label: t('dashboard.active_schemes'), 
      value: '18', 
      sub: '4 local subsidies active', 
      icon: Award, 
      borderClass: 'border-t-4 border-govsaffron',
      iconColor: 'bg-orange-50 text-govsaffron border border-orange-200'
    },
    { 
      label: t('dashboard.pending_grievances'), 
      value: '126', 
      sub: `${GRIEVANCES.filter(g => g.status !== 'Resolved').length} active mock cases`, 
      icon: AlertTriangle, 
      borderClass: 'border-t-4 border-rose-600',
      iconColor: 'bg-rose-50 text-rose-600 border border-rose-200'
    },
    { 
      label: t('dashboard.ongoing_projects'), 
      value: '24', 
      sub: `${PROJECTS.filter(p => p.status === 'Ongoing').length} monitoring feed`, 
      icon: Hammer, 
      borderClass: 'border-t-4 border-sky-600',
      iconColor: 'bg-sky-50 text-sky-600 border border-sky-200'
    },
    { 
      label: t('dashboard.project_budget'), 
      value: '₹2.4 Cr', 
      sub: 'Spent: ₹1.82 Cr (76%)', 
      icon: Coins, 
      borderClass: 'border-t-4 border-purple-600',
      iconColor: 'bg-purple-50 text-purple-600 border border-purple-200'
    },
  ];

  // AI Governance Insights
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
    { name: i18n.language === 'en' ? 'Water' : 'पानी पुरवठा', value: 2, color: '#0284c7' },
    { name: i18n.language === 'en' ? 'Roads' : 'रस्ते', value: 1, color: '#f59e0b' },
    { name: i18n.language === 'en' ? 'Electricity' : 'विद्युत', value: 1, color: '#eab308' },
    { name: i18n.language === 'en' ? 'Sanitation' : 'स्वच्छता', value: 1, color: '#138808' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner with official tricolor accent */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="absolute top-0 left-0 right-0 h-1.5 gov-tricolor-strip" />
        
        <div className="max-w-3xl space-y-2 mt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-govnavy/10 text-govnavy text-[10px] font-bold uppercase tracking-wider border border-govnavy/15 select-none">
            <Sparkles size={11} className="text-govsaffron animate-pulse" />
            <span>Panchayat Decision Support Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-govblue-900 tracking-tight leading-tight m-0 font-sans">
            {t('app_title')}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            {i18n.language === 'en' 
              ? 'Official decision support system for Loni Kalbhor Gram Panchayat. This portal integrates Citizen registries, Scheme recommendation filters, Grievance analytics, and Sabha documents to help representatives make data-backed decisions.'
              : 'लोणी काळभोर ग्रामपंचायत अधिकृत निर्णय समर्थन प्रणाली. हे पोर्टल नागरिक नोंदणी, योजना शिफारस, तक्रार निवारण आणि ग्रामसभा दस्तऐवज एकत्रित करून पदाधिकाऱ्यांना अचूक निर्णय घेण्यास सहाय्य करते.'}
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
              className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${card.borderClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">{card.label}</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-govblue-900 block">{card.value}</span>
                  <span className="text-[10px] text-slate-400 font-semibold block">{card.sub}</span>
                </div>
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${card.iconColor}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Governance Insights Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-4 border-govsaffron">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-200">
              <Bot size={18} className="text-govsaffron" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-govblue-900 m-0 tracking-wide uppercase">{t('dashboard.ai_insights')}</h2>
              <p className="text-[10px] text-slate-500 font-medium">Automatic alerts and operational anomalies extracted by the LLM database model.</p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentTab('ai_assistant')}
            className="text-xs font-bold text-govnavy hover:text-govblue-500 flex items-center gap-1 transition-colors select-none"
          >
            <span>Ask AI Assistant</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 group hover:bg-slate-100/50 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-govsaffron" />
                  <span className="text-[9px] text-govsaffron uppercase tracking-wider font-extrabold">System Alert</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {insight.text}
                </p>
              </div>
              <button 
                onClick={insight.action}
                className="text-[10px] font-bold text-govnavy hover:text-govblue-600 whitespace-nowrap flex items-center mt-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>{t('dashboard.view_details')}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Grid for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Budgets Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Ongoing Projects Budget Analysis</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} unit="k" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar name="Total Budget (₹K)" dataKey="budget" fill="#000080" radius={[3, 3, 0, 0]} />
                <Bar name="Utilized Fund (₹K)" dataKey="utilized" fill="#138808" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grievances Pie Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Grievance Category Load</h2>
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
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center select-none">
              <span className="text-xl font-extrabold text-govblue-900">5</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Mock</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
            {grievanceCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
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
