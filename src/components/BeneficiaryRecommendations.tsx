import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  HelpCircle,
  Sparkles,
  AlertTriangle,
  FileText,
  XCircle
} from 'lucide-react';
import { CITIZENS, SCHEMES, GOV_SCHEMES_FEED, CITIZEN_DOCUMENTS } from '../data/mockData';
import type { Citizen } from '../data/mockData';
import { Check, X as CloseIcon } from 'lucide-react';

// Required documents configuration for each scheme
const REQUIRED_DOCS: { [schemeId: string]: { name: string; nameMr: string }[] } = {
  'scheme_sr_citizen': [
    { name: 'Aadhaar Card', nameMr: 'आधार कार्ड' },
    { name: 'Income Certificate', nameMr: 'उत्पन्नाचा दाखला' }
  ],
  'scheme_pm_awas': [
    { name: 'Income Certificate', nameMr: 'उत्पन्नाचा दाखला' },
    { name: 'Land ownership 7/12 Extract', nameMr: '७/१२ उतारा' }
  ],
  'scheme_krishi_sinchan': [
    { name: 'Land ownership 7/12 Extract', nameMr: '७/१२ उतारा' },
    { name: 'Aadhaar Card', nameMr: 'आधार कार्ड' }
  ],
  'scheme_beti_bachao': [
    { name: 'Aadhaar Card', nameMr: 'आधार कार्ड' },
    { name: 'Income Certificate', nameMr: 'उत्पन्नाचा दाखला' }
  ]
};

export const BeneficiaryRecommendations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('scheme_sr_citizen');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [schemeFeed, setSchemeFeed] = useState(GOV_SCHEMES_FEED);

  const handleApproveScheme = (id: string) => {
    const schemeIndex = GOV_SCHEMES_FEED.findIndex(s => s.id === id);
    if (schemeIndex !== -1) {
      const s = GOV_SCHEMES_FEED[schemeIndex];
      GOV_SCHEMES_FEED[schemeIndex].status = 'Approved';
      
      // Push to active scheme list
      const exists = SCHEMES.find(active => active.id === s.id);
      if (!exists) {
        SCHEMES.push({
          id: s.id,
          name: s.name,
          nameMr: s.nameMr,
          description: s.description,
          descriptionMr: s.descriptionMr,
          minAge: s.minAge,
          maxIncome: s.maxIncome,
          genderRestriction: s.genderRestriction,
          benefit: s.benefit,
          benefitMr: s.benefitMr,
          formUrl: s.formUrl
        });
      }
      setSchemeFeed([...GOV_SCHEMES_FEED]);
    }
  };

  const handleRejectScheme = (id: string) => {
    const schemeIndex = GOV_SCHEMES_FEED.findIndex(s => s.id === id);
    if (schemeIndex !== -1) {
      GOV_SCHEMES_FEED[schemeIndex].status = 'Rejected';
      setSchemeFeed([...GOV_SCHEMES_FEED]);
    }
  };

  const activeScheme = useMemo(() => {
    return SCHEMES.find(s => s.id === selectedSchemeId) || SCHEMES[0];
  }, [selectedSchemeId]);

  // Compute eligibility statuses for all citizens matching selected scheme and ward
  const citizenEligibilityList = useMemo(() => {
    const reqDocs = REQUIRED_DOCS[selectedSchemeId] || [];

    return CITIZENS.map(c => {
      // 1. Check criteria constraints
      let criteriaPassed = false;
      if (selectedSchemeId === 'scheme_sr_citizen') {
        criteriaPassed = c.age >= activeScheme.minAge && c.income <= activeScheme.maxIncome;
      } else if (selectedSchemeId === 'scheme_pm_awas') {
        criteriaPassed = c.income <= activeScheme.maxIncome;
      } else if (selectedSchemeId === 'scheme_krishi_sinchan') {
        const isFarmer = c.occupation.toLowerCase().includes('farmer') || c.occupationMr.includes('शेतकरी');
        criteriaPassed = isFarmer && c.income <= activeScheme.maxIncome;
      } else if (selectedSchemeId === 'scheme_beti_bachao' || selectedSchemeId === 'scheme_lado_devona') {
        const isFemale = c.gender === 'Female';
        const isStudentOrYoung = c.age <= 25 || c.occupation.toLowerCase().includes('student') || c.occupationMr.includes('विद्यार्थी');
        criteriaPassed = isFemale && isStudentOrYoung && c.income <= activeScheme.maxIncome;
      } else {
        criteriaPassed = c.income <= activeScheme.maxIncome;
      }

      // 2. Check uploaded documents status
      const missingDocs: { name: string; nameMr: string }[] = [];
      const unverifiedDocs: { name: string; nameMr: string; fileStatus: string }[] = [];

      reqDocs.forEach(req => {
        // Find citizen file matches
        const docMatch = CITIZEN_DOCUMENTS.find(
          d => d.citizenName.toLowerCase() === c.name.toLowerCase() && 
          (d.docType.toLowerCase().includes(req.name.toLowerCase().substring(0, 8)) ||
           d.docTypeMr.includes(req.nameMr.substring(0, 4)))
        );

        if (!docMatch) {
          missingDocs.push(req);
        } else if (docMatch.status !== 'Verified') {
          unverifiedDocs.push({
            name: req.name,
            nameMr: req.nameMr,
            fileStatus: docMatch.status
          });
        }
      });

      // 3. Define final status label
      let status: 'Eligible' | 'Missing Documents' | 'Ineligible' = 'Ineligible';
      if (criteriaPassed) {
        if (missingDocs.length === 0 && unverifiedDocs.length === 0) {
          status = 'Eligible';
        } else {
          status = 'Missing Documents';
        }
      }

      return {
        citizen: c,
        criteriaPassed,
        missingDocs,
        unverifiedDocs,
        status
      };
    }).filter(item => {
      // Filter by Ward
      if (selectedWard !== 'all' && item.citizen.ward.toString() !== selectedWard) {
        return false;
      }
      // Filter by Eligibility Status
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }
      return true;
    });
  }, [selectedSchemeId, selectedWard, selectedStatusFilter, activeScheme, i18n.language]);

  // Checklists for the right sidebar detail card
  const activeSelectedEligItem = useMemo(() => {
    if (!selectedCitizen) return null;
    return citizenEligibilityList.find(item => item.citizen.id === selectedCitizen.id) || null;
  }, [selectedCitizen, citizenEligibilityList]);

  const handleRowClick = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide m-0">
          {i18n.language === 'en' ? 'Scheme Eligibility & Beneficiary Auditor' : 'योजना पात्रता आणि लाभार्थी पडताळणी'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {i18n.language === 'en' 
            ? 'Cross-reference demographic metrics and locker document verifications against scheme rules.' 
            : 'लोकसंख्याशास्त्रीय निकष आणि डिजिटल लॉकरमधील पडताळणी केलेल्या कागदपत्रांची पडताळणी करा.'}
        </p>
      </div>

      {/* AI government scheme feed */}
      {schemeFeed.some(s => s.status === 'Pending') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 border-t-4 border-govsaffron space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-govsaffron animate-pulse" />
            <h3 className="text-xs font-bold text-govblue-900 uppercase tracking-wider">
              {i18n.language === 'en' ? '🔔 AI Government Schemes Crawl Feed (Awaiting Approval)' : '🔔 नवीन शासकीय योजना फीड (मंजुरीची प्रतीक्षा)'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemeFeed.filter(s => s.status === 'Pending').map((s) => (
              <div key={s.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between space-y-3 text-left">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <strong className="text-xs font-bold text-govnavy">{i18n.language === 'en' ? s.name : s.nameMr}</strong>
                    <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-govsaffron text-[9px] font-bold uppercase tracking-wider">New</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{i18n.language === 'en' ? s.description : s.descriptionMr}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-semibold pt-1">
                    <span>Source: {s.sourceGov}</span>
                    <span>•</span>
                    <span>Benefit: {i18n.language === 'en' ? s.benefit : s.benefitMr}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end border-t border-slate-200/60 pt-2.5">
                  <button
                    onClick={() => handleRejectScheme(s.id)}
                    className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1 transition-colors"
                  >
                    <CloseIcon size={12} />
                    <span>Dismiss</span>
                  </button>
                  <button
                    onClick={() => handleApproveScheme(s.id)}
                    className="px-3 py-1 bg-govnavy hover:bg-govblue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Check size={12} />
                    <span>Approve & Publish to Village</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Area */}
      <div className="glass-card rounded-xl border border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheme Select */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold">
            {i18n.language === 'en' ? 'Select Scheme Policy' : 'योजना निवडा'}
          </label>
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

        {/* Eligibility Status Filter */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold">
            {i18n.language === 'en' ? 'Audit Eligibility Filter' : 'पात्रता फिल्टर'}
          </label>
          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setSelectedCitizen(null);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{i18n.language === 'en' ? 'All Citizens / सर्व नागरिक' : 'सर्व नागरिक'}</option>
            <option value="Eligible">{i18n.language === 'en' ? 'Fully Eligible / सर्व निकष पूर्ण' : 'सर्व निकष पूर्ण'}</option>
            <option value="Missing Documents">{i18n.language === 'en' ? 'Missing/Unverified Documents / कागदपत्रे प्रलंबित' : 'कागदपत्रे प्रलंबित'}</option>
            <option value="Ineligible">{i18n.language === 'en' ? 'Criteria Ineligible / अपात्र' : 'अपात्र'}</option>
          </select>
        </div>
      </div>

      {/* Main Layout (Table & Details Pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table Panel */}
        <div className="glass-card rounded-xl border border-slate-800 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {i18n.language === 'en' ? `${citizenEligibilityList.length} Records Monitored` : `${citizenEligibilityList.length} नागरिक नोंदी`}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">
              <Sparkles size={10} />
              <span>{i18n.language === 'en' ? 'AI Rules Engine Verification' : 'AI स्वयंचलित पडताळणी'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {citizenEligibilityList.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No matching records found for this filter combination.
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold select-none">
                    <th className="p-4">{t('beneficiary.citizen')}</th>
                    <th className="p-4 text-center">{t('beneficiary.age')}</th>
                    <th className="p-4">{t('beneficiary.income')}</th>
                    <th className="p-4 text-center">{t('beneficiary.ward')}</th>
                    <th className="p-4">{i18n.language === 'en' ? 'Verification Status' : 'पात्रता स्थिती'}</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {citizenEligibilityList.map((item) => {
                    const c = item.citizen;
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max ${
                            item.status === 'Eligible' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                              : item.status === 'Missing Documents'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                          }`}>
                            {item.status === 'Eligible' && <CheckCircle2 size={10} />}
                            {item.status === 'Missing Documents' && <AlertTriangle size={10} />}
                            {item.status === 'Ineligible' && <XCircle size={10} />}
                            <span>
                              {item.status === 'Eligible' && (i18n.language === 'en' ? 'Eligible' : 'पात्र')}
                              {item.status === 'Missing Documents' && (i18n.language === 'en' ? 'Missing Papers' : 'कागदपत्रे अपूर्ण')}
                              {item.status === 'Ineligible' && (i18n.language === 'en' ? 'Ineligible' : 'अपात्र')}
                            </span>
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
            {i18n.language === 'en' ? 'Eligibility & Locker Audit' : 'पात्रता आणि दस्तऐवज तपासणी'}
          </h2>

          {selectedCitizen && activeSelectedEligItem ? (
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

              {/* Document Audit Box */}
              <div className="space-y-3">
                <h4 className="text-xs text-slate-400 font-semibold">
                  {i18n.language === 'en' ? 'Locker Document Checks' : 'आवश्यक कागदपत्रे पडताळणी'}
                </h4>
                <div className="space-y-2.5">
                  {(REQUIRED_DOCS[selectedSchemeId] || []).map((req, rIdx) => {
                    const isMissing = activeSelectedEligItem.missingDocs.some(d => d.name === req.name);
                    const isUnverified = activeSelectedEligItem.unverifiedDocs.find(d => d.name === req.name);
                    
                    let statusLabel = i18n.language === 'en' ? 'Verified' : 'पडताळणी पूर्ण';
                    let statusColorClass = 'text-emerald-400';
                    let icon = <CheckCircle2 size={15} className="text-emerald-500" />;

                    if (isMissing) {
                      statusLabel = i18n.language === 'en' ? 'Missing File' : 'कागदपत्रे सापडले नाहीत';
                      statusColorClass = 'text-rose-400';
                      icon = <XCircle size={15} className="text-rose-500" />;
                    } else if (isUnverified) {
                      statusLabel = i18n.language === 'en' ? `${isUnverified.fileStatus}` : 'मंजुरी प्रलंबित';
                      statusColorClass = 'text-amber-400';
                      icon = <AlertTriangle size={15} className="text-amber-500" />;
                    }

                    return (
                      <div key={rIdx} className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" />
                          <span className="text-slate-200 font-medium">{i18n.language === 'en' ? req.name : req.nameMr}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {icon}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColorClass}`}>{statusLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Requirement Checkboxes */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs text-slate-400 font-semibold">
                  {i18n.language === 'en' ? 'Policy Parameter Checks' : 'नियम आणि अटी पडताळणी'}
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className={selectedCitizen.age >= activeScheme.minAge ? "text-emerald-500" : "text-rose-500"} />
                    <span className={selectedCitizen.age >= activeScheme.minAge ? "" : "line-through text-slate-600"}>
                      {i18n.language === 'en' ? `Age limit (Requires ${activeScheme.minAge}+)` : `वय निकष (वय ${activeScheme.minAge}+ आवश्यक)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 size={16} className={selectedCitizen.income <= activeScheme.maxIncome ? "text-emerald-500" : "text-rose-500"} />
                    <span className={selectedCitizen.income <= activeScheme.maxIncome ? "" : "line-through text-slate-600"}>
                      {i18n.language === 'en' ? `Income Limit (Max ₹${activeScheme.maxIncome.toLocaleString()})` : `उत्पन्न मर्यादा (कमाल ₹${activeScheme.maxIncome.toLocaleString()})`}
                    </span>
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
                  {activeSelectedEligItem.status === 'Eligible' && (
                    i18n.language === 'en'
                      ? "All demographic parameters and required verification documents are present and validated in the secure digital locker. Recommended for direct enrollment."
                      : "सर्व लोकसंख्याशास्त्रीय निकष आणि आवश्यक कागदपत्रे डिजिटल लॉकरमध्ये पडताळणी केली आहेत. थेट नोंदणीसाठी शिफारस केली जात आहे."
                  )}
                  {activeSelectedEligItem.status === 'Missing Documents' && (
                    i18n.language === 'en'
                      ? "This citizen meets the age and income requirements, but cannot be enrolled yet due to missing or unverified document uploads. Please contact the citizen to submit their papers."
                      : "हा नागरिक वय आणि उत्पन्न निकष पूर्ण करतो, परंतु काही कागदपत्रे प्रलंबित किंवा प्रविष्ठ न केल्यामुळे अर्ज अपूर्ण आहे. कृपया कागदपत्रे सादर करण्यास कळवा."
                  )}
                  {activeSelectedEligItem.status === 'Ineligible' && (
                    i18n.language === 'en'
                      ? "This candidate is ineligible due to exceeding the maximum family income or failing to meet the age requirement for this policy."
                      : "हा नागरिक कौटुंबिक उत्पन्न मर्यादा किंवा वयाच्या अटी पूर्ण न केल्यामुळे या योजनेस अपात्र आहे."
                  )}
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
