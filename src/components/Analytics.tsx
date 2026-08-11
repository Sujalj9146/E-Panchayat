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
  DollarSign
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
      // Mapped count
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

      {/* Logic & Analytics Rules Explainer Card */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-govsaffron" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {i18n.language === 'en' ? '📊 AI Governance Analytics Engine - Rules & Calculations Logic' : '📊 शासकीय विश्लेषण इंजिन - नियम आणि गणना तर्कशास्त्र'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 space-y-1">
            <strong className="text-slate-300 block">1. Demographics Formula</strong>
            <p className="text-slate-500 leading-relaxed">
              Groups the entire citizen register dynamically: <strong>Youth</strong> (&lt;30 yrs), <strong>Adults</strong> (30-59 yrs), and <strong>Seniors</strong> (60+ yrs) to track senior scheme potentials.
            </p>
          </div>
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 space-y-1">
            <strong className="text-slate-300 block">2. Scheme Potentials Check</strong>
            <p className="text-slate-500 leading-relaxed">
              Calculates eligibility by scanning the database: age restrictions (e.g. 60+ for pension), gender (Female for Beti Bachao), and max income thresholds.
            </p>
          </div>
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 space-y-1">
            <strong className="text-slate-300 block">3. Financial Utilization</strong>
            <p className="text-slate-500 leading-relaxed">
              Monitors capital projects by summing <code>p.budget</code> vs. <code>p.utilized</code> (rendered in Lakhs ₹) to identify over-expenditures and balance.
            </p>
          </div>
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 space-y-1">
            <strong className="text-slate-300 block">4. Grievance Departmental Routing</strong>
            <p className="text-slate-500 leading-relaxed">
              Aggregates all filed citizen grievance issues by category, routing load metrics to designated sanitation or water works cells.
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Financials */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Project Budget vs Expenditure (₹ Lakhs)</h2>
            </div>
            <div className="h-60">
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
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>Calculation Logic:</strong> Maps infrastructure works database (<code>PROJECTS</code>) directly. Formula: <code>budget / 100,000</code> and <code>utilized / 100,000</code> to convert raw Rupees to standard Lakh units. Helps audits monitor fund conservation.
          </div>
        </div>

        {/* Scheme Potential Beneficiaries */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Potential Scheme Eligibility Counts</h2>
            </div>
            <div className="h-60">
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
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>Calculation Logic:</strong> Evaluates potential candidates by running demographic constraints filters on <code>CITIZENS</code> registry (e.g. Senior Pension: <code>age &gt;= 60 && income &lt;= 100,000</code>). Highlights enrollment capacity.
          </div>
        </div>

        {/* Demographics Pie */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Village Age Demographics (Sample size)</h2>
            </div>
            <div className="h-60 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageDemographics}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>Calculation Logic:</strong> Splits the local citizens registry (<code>CITIZENS</code>) by age groups. Groups: <strong>Youth</strong> (&lt;30), <strong>Adults</strong> (30-59), and <strong>Seniors</strong> (60+). Useful for age-sensitive social schemes.
          </div>
        </div>

        {/* Grievance categories Area chart */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Grievances Category Load breakdown</h2>
            </div>
            <div className="h-60">
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
          <div className="p-3 bg-slate-950/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>Calculation Logic:</strong> Scans the grievance repository (<code>GRIEVANCES</code>) and counts instances dynamically grouped by their classification categories (e.g. Sanitation, Water Works, Infrastructure, Health).
          </div>
        </div>

      </div>
    </div>
  );
};
