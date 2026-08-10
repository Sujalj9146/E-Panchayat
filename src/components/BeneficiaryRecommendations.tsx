import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { CITIZENS, SCHEMES } from '../data/mockData';
import type { Citizen } from '../data/mockData';


export const BeneficiaryRecommendations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('scheme_sr_citizen');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

  const activeScheme = useMemo(() => {
    return SCHEMES.find(s => s.id === selectedSchemeId) || SCHEMES[0];
  }, [selectedSchemeId]);

  // Programmatic eligibility engine that evaluates real parameters
  const recommendedBeneficiaries = useMemo(() => {
    return CITIZENS.filter(c => {
      // 1. Filter by Ward
      if (selectedWard !== 'all' && c.ward.toString() !== selectedWard) {
        return false;
      }

      // 2. Programmatic Eligibility Logic matching each scheme's requirements
      let isEligible = false;
      if (selectedSchemeId === 'scheme_sr_citizen') {
        isEligible = c.age >= activeScheme.minAge && c.income <= activeScheme.maxIncome;
      } else if (selectedSchemeId === 'scheme_pm_awas') {
        isEligible = c.income <= activeScheme.maxIncome;
      } else if (selectedSchemeId === 'scheme_krishi_sinchan') {
        const isFarmer = c.occupation.toLowerCase().includes('farmer') || c.occupationMr.includes('शेतकरी');
        isEligible = isFarmer && c.income <= activeScheme.maxIncome;
      } else if (selectedSchemeId === 'scheme_beti_bachao') {
        const isFemale = c.gender === 'Female';
        const isStudentOrYoung = c.age <= 25 || c.occupation.toLowerCase().includes('student') || c.occupationMr.includes('विद्यार्थी');
        isEligible = isFemale && isStudentOrYoung && c.income <= activeScheme.maxIncome;
      }

      if (!isEligible) return false;

      // 3. Dynamic Priority Assessment
      // Lower income = Higher priority
      const priority = getPriority(c.income);
      if (selectedPriority !== 'all' && priority !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [selectedSchemeId, selectedWard, selectedPriority, activeScheme]);

  function getPriority(income: number): 'High' | 'Medium' | 'Low' {
    if (income <= 40000) return 'High';
    if (income <= 90000) return 'Medium';
    return 'Low';
  }

  // Checklists based on dynamic citizen attributes
  const checkResults = useMemo(() => {
    if (!selectedCitizen) return null;
    const c = selectedCitizen;
    const s = activeScheme;

    const agePassed = c.age >= s.minAge;
    const incomePassed = c.income <= s.maxIncome;
    let otherPassed = true;
    let otherLabel = t('beneficiary.rules.conditions');

    if (s.id === 'scheme_krishi_sinchan') {
      otherPassed = c.occupation.toLowerCase().includes('farmer') || c.occupationMr.includes('शेतकरी');
      otherLabel = i18n.language === 'en' ? 'Registered Farmer Status' : 'नोंदणीकृत शेतकरी पात्रता';
    } else if (s.id === 'scheme_beti_bachao') {
      otherPassed = c.gender === 'Female';
      otherLabel = i18n.language === 'en' ? 'Female Gender Eligibility' : 'महिला उमेदवार पात्रता';
    }

    return {
      agePassed,
      incomePassed,
      otherPassed,
      otherLabel,
      residencePassed: true // all mapped in local ward
    };
  }, [selectedCitizen, activeScheme, t, i18n.language]);

  const handleRowClick = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('beneficiary.title')}</h1>
        <p className="text-xs text-slate-500 mt-1">Cross-referencing citizen database against scheme policies using automated rules engine.</p>
      </div>

      {/* Filters Area */}
      <div className="glass-card rounded-xl border border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheme Select */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold">{t('beneficiary.select_scheme')}</label>
          <select
            value={selectedSchemeId}
            onChange={(e) => {
              setSelectedSchemeId(e.target.value);
              setSelectedCitizen(null);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {SCHEMES.map(s => (
              <option key={s.id} value={s.id}>
                {i18n.language === 'en' ? s.name : s.nameMr}
              </option>
            ))}
          </select>
        </div>

        {/* Ward Select */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold">{t('beneficiary.select_ward')}</label>
          <select
            value={selectedWard}
            onChange={(e) => {
              setSelectedWard(e.target.value);
              setSelectedCitizen(null);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{t('beneficiary.all')}</option>
            <option value="1">Ward 1</option>
            <option value="2">Ward 2</option>
            <option value="3">Ward 3</option>
            <option value="4">Ward 4</option>
          </select>
        </div>

        {/* Priority Select */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold">{t('beneficiary.select_priority')}</label>
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setSelectedCitizen(null);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{t('beneficiary.all')}</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Layout (Table & Details Pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table Panel */}
        <div className="glass-card rounded-xl border border-slate-800 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {recommendedBeneficiaries.length} Potential Beneficiaries Found
            </span>
            <div className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">
              <Sparkles size={10} />
              <span>AI Verified Recommendation</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {recommendedBeneficiaries.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No matching citizens meet the eligibility criteria for this filter combination.
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold select-none">
                    <th className="p-4">{t('beneficiary.citizen')}</th>
                    <th className="p-4 text-center">{t('beneficiary.age')}</th>
                    <th className="p-4">{t('beneficiary.income')}</th>
                    <th className="p-4 text-center">{t('beneficiary.ward')}</th>
                    <th className="p-4">{t('beneficiary.priority')}</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recommendedBeneficiaries.map((c) => {
                    const priority = getPriority(c.income);
                    const isSelected = selectedCitizen?.id === c.id;

                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => handleRowClick(c)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <td className="p-4 font-bold text-white">
                          {i18n.language === 'en' ? c.name : c.nameMr}
                        </td>
                        <td className="p-4 text-center text-slate-300">{c.age}</td>
                        <td className="p-4 text-slate-300">₹{c.income.toLocaleString()}</td>
                        <td className="p-4 text-center text-slate-300">{c.ward}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            priority === 'High' 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20' 
                              : priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                                : 'bg-slate-500/20 text-slate-300 border border-slate-500/20'
                          }`}>
                            {priority === 'High' ? 'High' : priority === 'Medium' ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-indigo-400 hover:text-indigo-300">
                          <ChevronRight size={16} className="inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Explain Details Panel */}
        <div className="glass-card rounded-xl border border-slate-800 p-5 space-y-5">
          <h2 className="text-sm font-bold text-white tracking-wide border-b border-slate-800 pb-3 uppercase text-slate-400">
            {t('beneficiary.why_recommended')}
          </h2>

          {selectedCitizen && checkResults ? (
            <div className="space-y-5">
              {/* Profile card summary */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {i18n.language === 'en' ? selectedCitizen.name : selectedCitizen.nameMr}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Ward {selectedCitizen.ward} • {i18n.language === 'en' ? selectedCitizen.occupation : selectedCitizen.occupationMr}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-indigo-400 font-extrabold">₹{selectedCitizen.income.toLocaleString()}/yr</span>
                </div>
              </div>

              {/* Requirement Checkboxes */}
              <div className="space-y-3">
                <h4 className="text-xs text-slate-400 font-semibold">Eligibility Verification Checklist</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className={checkResults.agePassed ? "text-emerald-500" : "text-slate-600"} />
                    <span className={checkResults.agePassed ? "" : "line-through text-slate-600"}>{t('beneficiary.rules.age')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className={checkResults.incomePassed ? "text-emerald-500" : "text-slate-600"} />
                    <span className={checkResults.incomePassed ? "" : "line-through text-slate-600"}>{t('beneficiary.rules.income')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className={checkResults.residencePassed ? "text-emerald-500" : "text-slate-600"} />
                    <span>{t('beneficiary.rules.residence')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className={checkResults.otherPassed ? "text-emerald-500" : "text-slate-600"} />
                    <span className={checkResults.otherPassed ? "" : "line-through text-slate-600"}>{checkResults.otherLabel}</span>
                  </div>
                </div>
              </div>

              {/* AI Explanation Text */}
              <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>{t('beneficiary.ai_explanation')}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {t('beneficiary.reason')}
                  <br />
                  <span className="block mt-2 italic text-slate-400">
                    {i18n.language === 'en'
                      ? `Candidate qualifies with ₹${(activeScheme.maxIncome - selectedCitizen.income).toLocaleString()} buffer below the max income cap.`
                      : `उमेदवार कमाल उत्पन्न मर्यादेच्या ₹${(activeScheme.maxIncome - selectedCitizen.income).toLocaleString()} खाली सुरक्षित मर्यादेत पात्र ठरतो.`}
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-900/30 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Disclaimer:</strong> This system provides potential recommendation guidelines. Physical verification of credentials and identity documents is required for official scheme enrollment approvals.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs leading-relaxed flex flex-col items-center justify-center space-y-2">
              <HelpCircle size={32} className="text-slate-600" />
              <span>Select a citizen from the recommendations list to view the qualification breakdown and AI verification checklist.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
