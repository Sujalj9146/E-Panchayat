import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  AlertTriangle, 
  Award,
  DollarSign,
  Info
} from 'lucide-react';
import { CITIZENS, GRIEVANCES, PROJECTS, SCHEMES } from '../data/mockData';

export const Analytics: React.FC = () => {
  const { t, i18n } = useTranslation();

  // 1. Citizen age groups demographics
  const ageDemographics = useMemo(() => {
    let young = 0; // <30
    let middle = 0; // 30-59
    let senior = 0; // 60+
    CITIZENS.forEach(c => {
      if (c.age < 30) young++;
      else if (c.age < 60) middle++;
      else senior++;
    });
    return [
      { name: i18n.language === 'en' ? 'Youth (<30)' : 'युवक (<३०)', value: young, color: '#38bdf8' },
      { name: i18n.language === 'en' ? 'Adults (30-59)' : 'प्रौढ (३०-५९)', value: middle, color: '#4f46e5' },
      { name: i18n.language === 'en' ? 'Seniors (60+)' : 'ज्येष्ठ (६०+)', value: senior, color: '#a855f7' }
    ];
  }, [i18n.language]);

  // 2. Grievance Categories distribution
  const grievancesByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    GRIEVANCES.forEach(g => {
      const cat = i18n.language === 'en' ? g.category : g.categoryMr;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [i18n.language]);

  // 3. Project Budgets spent vs remaining
  const projectsBudgetDetails = useMemo(() => {
    return PROJECTS.map(p => ({
      name: i18n.language === 'en' ? p.name.substring(0, 14) + '..' : p.nameMr.substring(0, 14) + '..',
      budget: p.budget / 100000,
      utilized: p.utilized / 100000
    }));
  }, [i18n.language]);

  // 4. Scheme potentials
  const schemeEnrollmentPotentials = useMemo(() => {
    return SCHEMES.map(s => {
      const potentials = CITIZENS.filter(c => {
        if (s.id === 'scheme_sr_citizen') return c.age >= s.minAge && c.income <= s.maxIncome;
        if (s.id === 'scheme_pm_awas') return c.income <= s.maxIncome;
        if (s.id === 'scheme_krishi_sinchan') {
          return (c.occupation.toLowerCase().includes('farmer') || c.occupationMr.includes('शेतकरी')) && c.income <= s.maxIncome;
        }
        if (s.id === 'scheme_beti_bachao') {
          return c.gender === 'Female' && (c.age <= 25 || c.occupation.toLowerCase().includes('student')) && c.income <= s.maxIncome;
        }
        return false;
      }).length;

      return {
        name: i18n.language === 'en' ? s.name.substring(0, 15) + '..' : s.nameMr.substring(0, 15) + '..',
        potentials
      };
    });
  }, [i18n.language]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('nav.analytics')}</h1>
        <p className="text-xs text-slate-500 mt-1">Granular demographic graphs, scheme coverages, grievance categories, and infrastructure finance analytics.</p>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Financials */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Project Budget vs Expenditure (₹ Lakhs)</h2>
            </div>
            <span title="Maps infrastructure projects database directly: converting Rupee values to Lakhs for clean financial tracking.">
              <Info size={14} className="text-slate-500 hover:text-slate-300 cursor-help" />
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsBudgetDetails} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar name="Total Budget" dataKey="budget" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                <Bar name="Utilized Fund" dataKey="utilized" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheme Potential Beneficiaries */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Potential Scheme Eligibility Counts</h2>
            </div>
            <span title="Evaluates target eligibility parameters (age constraints, occupation, and family income limits) against the citizens database.">
              <Info size={14} className="text-slate-500 hover:text-slate-300 cursor-help" />
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schemeEnrollmentPotentials} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Bar name="Potential Beneficiaries" dataKey="potentials" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Pie */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Village Age Demographics (Sample size)</h2>
            </div>
            <span title="Slices the village registry by age brackets: Youth (<30), Adults (30-59), and Seniors (60+).">
              <Info size={14} className="text-slate-500 hover:text-slate-300 cursor-help" />
            </span>
          </div>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageDemographics}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ageDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-white">{CITIZENS.length}</span>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sample DB</p>
            </div>
          </div>
        </div>

        {/* Grievance categories Area chart */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Grievances Category Load breakdown</h2>
            </div>
            <span title="Aggregates logged citizen issues by their specific category groups to map cell workloads.">
              <Info size={14} className="text-slate-500 hover:text-slate-300 cursor-help" />
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grievancesByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Bar name="Grievance Count" dataKey="value" fill="#ec4899" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
