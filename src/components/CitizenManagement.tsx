import { savePersistentData } from '../lib/persistence';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  User, 
  MapPin, 
  Briefcase, 
  Award, 
  GitMerge, 
  ArrowRight, 
  X,
  Check
} from 'lucide-react';
import { CITIZENS, SCHEMES, CITIZEN_DOCUMENTS } from '../data/mockData';


export const CitizenManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [occupationFilter, setOccupationFilter] = useState('all');
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'verification'>('directory');
  const [docList, setDocList] = useState(CITIZEN_DOCUMENTS);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const previewCitizenProfile = useMemo(() => {
    if (!previewDoc) return null;
    return CITIZENS.find(c => c.name === previewDoc.citizenName) || CITIZENS[0];
  }, [previewDoc]);

  const handleVerifyDoc = (id: string) => {
    const docIndex = CITIZEN_DOCUMENTS.findIndex(d => d.id === id);
    if (docIndex !== -1) {
      CITIZEN_DOCUMENTS[docIndex].status = 'Verified';
      CITIZEN_DOCUMENTS[docIndex].statusMr = 'पडताळणी पूर्ण';
      setDocList([...CITIZEN_DOCUMENTS]);
      savePersistentData('panchayat_citizen_documents', CITIZEN_DOCUMENTS);
    }
  };

  const handleRejectDoc = (id: string) => {
    const docIndex = CITIZEN_DOCUMENTS.findIndex(d => d.id === id);
    if (docIndex !== -1) {
      CITIZEN_DOCUMENTS[docIndex].status = 'Rejected';
      CITIZEN_DOCUMENTS[docIndex].statusMr = 'अस्वीकृत';
      setDocList([...CITIZEN_DOCUMENTS]);
      savePersistentData('panchayat_citizen_documents', CITIZEN_DOCUMENTS);
    }
  };

  // Active citizen full profile
  const selectedCitizen = useMemo(() => {
    return CITIZENS.find(c => c.id === selectedCitizenId) || null;
  }, [selectedCitizenId]);

  // List of occupations in DB for dropdown filter
  const occupations = useMemo(() => {
    const jobs = new Set<string>();
    CITIZENS.forEach(c => jobs.add(i18n.language === 'en' ? c.occupation : c.occupationMr));
    return Array.from(jobs);
  }, [i18n.language]);

  // Comprehensive citizen filter engine
  const filteredCitizens = useMemo(() => {
    return CITIZENS.filter(c => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchQuery = 
        c.name.toLowerCase().includes(query) ||
        c.nameMr.includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.familyName.toLowerCase().includes(query);
      
      if (!matchQuery) return false;

      // 2. Ward Filter
      if (wardFilter !== 'all' && c.ward.toString() !== wardFilter) return false;

      // 3. Age Filter
      if (ageFilter === 'young' && c.age >= 30) return false;
      if (ageFilter === 'middle' && (c.age < 30 || c.age >= 60)) return false;
      if (ageFilter === 'senior' && c.age < 60) return false;

      // 4. Occupation Filter
      if (occupationFilter !== 'all') {
        const job = i18n.language === 'en' ? c.occupation : c.occupationMr;
        if (job !== occupationFilter) return false;
      }

      return true;
    });
  }, [search, wardFilter, ageFilter, occupationFilter, i18n.language]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('citizens.title')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {i18n.language === 'en' 
            ? 'Search official databases, visualize family relations, and audit uploaded citizen records.' 
            : 'अधिकृत डेटाबेस शोधा, कौटुंबिक संबंध पहा आणि अपलोड केलेल्या कागदपत्रांचे पुनरावलोकन करा.'}
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex border-b border-slate-800 gap-6 mb-2 select-none">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none ${
            activeSubTab === 'directory' 
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-black' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          👥 {i18n.language === 'en' ? 'Citizen Directory' : 'नागरिक मार्गदर्शिका'}
        </button>
        <button
          onClick={() => setActiveSubTab('verification')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none relative flex items-center gap-1.5 ${
            activeSubTab === 'verification' 
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-black' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span>📂 {i18n.language === 'en' ? 'Document Verification Queue' : 'दस्तऐवज पडताळणी रांग'}</span>
          {docList.some(d => d.status === 'Pending Verification') && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>
      </div>

      {activeSubTab === 'directory' ? (
        <>
      {/* Search & Filters */}
      <div className="glass-card rounded-xl border border-slate-800 p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('citizens_page.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Ward */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
            <MapPin size={14} className="text-indigo-400" />
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Ward: All</option>
              <option value="1">Ward 1</option>
              <option value="2">Ward 2</option>
              <option value="3">Ward 3</option>
              <option value="4">Ward 4</option>
            </select>
          </div>

          {/* Age range */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
            <User size={14} className="text-indigo-400" />
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Age: All</option>
              <option value="young">Young (&lt; 30)</option>
              <option value="middle">Middle Age (30 - 59)</option>
              <option value="senior">Senior Citizens (60+)</option>
            </select>
          </div>

          {/* Occupation */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
            <Briefcase size={14} className="text-indigo-400" />
            <select
              value={occupationFilter}
              onChange={(e) => setOccupationFilter(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Occupation: All</option>
              {occupations.map((job, idx) => (
                <option key={idx} value={job}>{job}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table vs Profile side drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table list */}
        <div className={`glass-card rounded-xl border border-slate-800 overflow-hidden ${
          selectedCitizen ? 'lg:col-span-2' : 'lg:col-span-3'
        } transition-all duration-300`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                  <th className="p-4">Citizen ID</th>
                  <th className="p-4">{t('beneficiary.citizen')}</th>
                  <th className="p-4 text-center">{t('beneficiary.age')}</th>
                  <th className="p-4">{t('citizens_page.gender')}</th>
                  <th className="p-4">{t('beneficiary.ward')}</th>
                  <th className="p-4">{t('citizens_page.occupation')}</th>
                  <th className="p-4 text-right">Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCitizens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500 text-sm">
                      No citizen records found matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredCitizens.map((c) => {
                    const isSelected = selectedCitizen?.id === c.id;
                    return (
                      <tr 
                        key={c.id}
                        onClick={() => setSelectedCitizenId(c.id)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <td className="p-4 font-mono text-xs text-indigo-400">{c.id}</td>
                        <td className="p-4 font-bold text-white">
                          {i18n.language === 'en' ? c.name : c.nameMr}
                        </td>
                        <td className="p-4 text-center text-slate-300">{c.age}</td>
                        <td className="p-4 text-slate-300">
                          {i18n.language === 'en' ? c.gender : c.genderMr}
                        </td>
                        <td className="p-4 text-center text-slate-300">{c.ward}</td>
                        <td className="p-4 text-slate-300">
                          {i18n.language === 'en' ? c.occupation : c.occupationMr}
                        </td>
                        <td className="p-4 text-right text-slate-300 font-medium">
                          ₹{c.income.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Profile Drawer */}
        {selectedCitizen && (
          <div className="glass-card rounded-xl border border-slate-850 p-5 space-y-6 relative">
            <button 
              onClick={() => setSelectedCitizenId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Profile Heading */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 font-bold">
                {selectedCitizen.name[0]}
              </div>
              <div>
                <h2 className="text-base font-bold text-white m-0">
                  {i18n.language === 'en' ? selectedCitizen.name : selectedCitizen.nameMr}
                </h2>
                <span className="text-[10px] font-mono text-indigo-400">{selectedCitizen.id}</span>
              </div>
            </div>

            {/* Profile Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block">Age / वय</span>
                <span className="text-slate-200 font-semibold block">{selectedCitizen.age} yrs</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Gender / लिंग</span>
                <span className="text-slate-200 font-semibold block">
                  {i18n.language === 'en' ? selectedCitizen.gender : selectedCitizen.genderMr}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Ward / वॉर्ड</span>
                <span className="text-slate-200 font-semibold block">Ward {selectedCitizen.ward}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Annual Income / उत्पन्न</span>
                <span className="text-emerald-400 font-bold block">₹{selectedCitizen.income.toLocaleString()}</span>
              </div>
              <div className="col-span-2 space-y-1 border-t border-slate-850 pt-2">
                <span className="text-slate-500 block">Occupation / व्यवसाय</span>
                <span className="text-slate-200 font-semibold block">
                  {i18n.language === 'en' ? selectedCitizen.occupation : selectedCitizen.occupationMr}
                </span>
              </div>
            </div>

            {/* Family link mapping */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <GitMerge size={14} className="text-indigo-400" />
                <span>{t('citizens_page.family_tree')}</span>
              </div>
              <span className="text-[10px] text-slate-500 block italic">Clan ID: {selectedCitizen.familyName} ({selectedCitizen.familyId})</span>
              
              {selectedCitizen.familyMembers.length === 0 ? (
                <div className="text-xs text-slate-500">No other family members mapped.</div>
              ) : (
                <div className="space-y-2">
                  {selectedCitizen.familyMembers.map((member, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCitizenId(member.id)}
                      className="w-full flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-850 hover:bg-slate-800/40 text-left transition-colors"
                    >
                      <div className="text-xs font-semibold text-slate-200">
                        {member.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                        <span>{i18n.language === 'en' ? member.relation : member.relationMr}</span>
                        <ArrowRight size={10} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Eligible Schemes Mapping */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <Award size={14} className="text-purple-400 animate-bounce" />
                <span>{t('citizens_page.potential_schemes')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCitizen.eligibleSchemes.map((schemeId, idx) => {
                  const schemeObj = SCHEMES.find(s => s.id === schemeId);
                  if (!schemeObj) return null;
                  return (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-bold uppercase tracking-wide block"
                    >
                      {i18n.language === 'en' ? schemeObj.name : schemeObj.nameMr}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      ) : (
        /* Document Verification Queue View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-govnavy">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {docList.filter(d => d.status === 'Pending Verification').length} {i18n.language === 'en' ? 'Pending Documents for Audit' : 'पडताळणी प्रलंबित दस्तऐवज'}
            </span>
          </div>

          <div className="overflow-x-auto">
            {docList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                {i18n.language === 'en' ? 'No documents uploaded in verification queue yet.' : 'पडताळणी रांगेत अद्याप कोणतेही दस्तऐवज उपलब्ध नाहीत.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold select-none">
                    <th className="p-4">{i18n.language === 'en' ? 'Citizen Name' : 'नागरिकाचे नाव'}</th>
                    <th className="p-4">{i18n.language === 'en' ? 'Document Type' : 'दस्तऐवज प्रकार'}</th>
                    <th className="p-4">{i18n.language === 'en' ? 'Attached File' : 'संलग्न फाईल'}</th>
                    <th className="p-4">{i18n.language === 'en' ? 'Submitted Date' : 'सादर दिनांक'}</th>
                    <th className="p-4">{i18n.language === 'en' ? 'Status' : 'स्थिती'}</th>
                    <th className="p-4 text-right">{i18n.language === 'en' ? 'Audit Actions' : 'कृती'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docList.map((doc) => {
                    const isPending = doc.status === 'Pending Verification';
                    const isVerified = doc.status === 'Verified';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{doc.citizenName}</td>
                        <td className="p-4 text-slate-600 font-semibold">{i18n.language === 'en' ? doc.docType : doc.docTypeMr}</td>
                        <td className="p-4">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="font-mono text-[11px] text-govnavy font-bold hover:underline cursor-pointer text-left focus:outline-none"
                          >
                            {doc.fileName}
                          </button>
                        </td>
                        <td className="p-4 text-slate-500">{doc.submittedDate}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : doc.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                          }`}>
                            {i18n.language === 'en' ? doc.status : doc.statusMr}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {(isPending || doc.status === 'Rejected') && (
                              <button
                                onClick={() => handleVerifyDoc(doc.id)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-250 transition-colors"
                                title={i18n.language === "en" ? "Verify & Save to Database" : "पडताळणी करा"}
                              >
                                <Check size={14} />
                              </button>
                            )}
                            {(isPending || isVerified) && (
                              <button
                                onClick={() => handleRejectDoc(doc.id)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-250 transition-colors"
                                title={i18n.language === "en" ? "Reject Document" : "दस्तऐवज नाकारा"}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && previewCitizenProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-govsaffron flex flex-col justify-between text-slate-800">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-govblue-900 block uppercase">
                  {i18n.language === 'en' ? 'Document Auditor' : 'दस्तऐवज पडताळणी / ऑडिट'}
                </strong>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                  {i18n.language === 'en' ? 'Audit' : 'तपासणी'}: {previewDoc.fileName}
                </span>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded hover:bg-slate-250 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body: Styled document rendering */}
            <div className="p-5 overflow-y-auto max-h-[380px] bg-slate-100/50 flex items-center justify-center">
              {previewDoc.docType === 'Income Certificate' ? (
                /* Income Certificate Official Document Graphic */
                <div className="bg-white border-2 border-amber-800 p-5 rounded w-full max-w-[320px] aspect-[1/1.4] flex flex-col justify-between text-center select-none shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none text-7xl font-extrabold text-amber-900 select-none">
                    PUNE
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">{i18n.language === 'en' ? 'Department of Revenue • Government of Maharashtra' : 'महसूल विभाग • महाराष्ट्र शासन'}</span>
                    <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest border-b border-amber-800 pb-1 m-0">{i18n.language === 'en' ? 'INCOME CERTIFICATE' : 'उत्पन्नाचा दाखला'}</h4>
                  </div>
                  <div className="text-left text-[8px] font-bold text-slate-700 space-y-2 py-4">
                    <p className="leading-normal">
                      {i18n.language === 'en' ? (
                        <>This is to certify that <strong className="text-slate-900">{previewDoc.citizenName}</strong>, resident of Ward {previewCitizenProfile.ward}, Loni Kalbhor, Pune, Maharashtra, has an annual family income of:</>
                      ) : (
                        <>प्रमाणित करण्यात येते की, <strong className="text-slate-900">{previewDoc.citizenName}</strong>, रा. वॉर्ड {previewCitizenProfile.ward}, लोणी काळभोर, हवेली, पुणे, महाराष्ट्र, यांचे एकूण कौटुंबिक वार्षिक उत्पन्न खालीलप्रमाणे आहे:</>
                      )}
                    </p>
                    <div className="text-center py-2.5 bg-amber-50 border border-dashed border-amber-800/40 rounded">
                      <strong className="text-sm font-black text-emerald-750">₹{previewCitizenProfile.income.toLocaleString()}/-</strong>
                      <span className="block text-[7px] text-slate-400 mt-0.5">
                        {previewCitizenProfile.income === 45000 
                          ? (i18n.language === 'en' ? 'Rupees Forty Five Thousand Only' : 'अक्षरी रुपये पंचेचाळीस हजार फक्त') 
                          : (i18n.language === 'en' ? 'Rupees Sixty Thousand Only' : 'अक्षरी रुपये साठ हजार फक्त')}
                      </span>
                    </div>
                    <p className="leading-normal">
                      {i18n.language === 'en' 
                        ? 'This certificate is issued on the basis of local talathi report for the Assessment Year 2025-26.' 
                        : 'सदर प्रमाणपत्र स्थानिक तलाठी अहवालाच्या आधारे मूल्यांकन वर्ष २०२५-२६ साठी जारी करण्यात आले आहे.'}
                    </p>
                  </div>
                  <div className="flex items-end justify-between text-[7px] font-bold text-slate-500">
                    <div className="text-left">
                      <span>{i18n.language === 'en' ? 'Place: Haveli, Pune' : 'ठिकाण: हवेली, पुणे'}</span>
                      <span className="block mt-0.5">{i18n.language === 'en' ? 'Date' : 'दिनांक'}: {previewDoc.submittedDate}</span>
                    </div>
                    <div className="text-center font-mono">
                      <span className="border-t border-slate-300 block pt-0.5 px-2">
                        {i18n.language === 'en' ? 'Tahsildar Desk' : 'तहसीलदार कार्यालय'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : previewDoc.docType === 'Aadhaar Card' || previewDoc.fileName.toLowerCase().includes('aadhaar') ? (
                /* Aadhaar Card Graphic */
                <div className="bg-white border-2 border-red-500 p-4 rounded-lg w-full max-w-[320px] aspect-[1.58/1] flex flex-col justify-between select-none shadow-sm relative overflow-hidden border-t-govnavy">
                  <div className="flex justify-between items-center border-b border-red-200 pb-1.5">
                    <span className="text-[8px] font-extrabold text-red-600">{i18n.language === 'en' ? 'Government of India' : 'भारत सरकार / Govt of India'}</span>
                    <span className="text-[9px]">🇮🇳</span>
                  </div>
                  <div className="flex gap-3 py-2 flex-1">
                    {/* Avatar silhouette */}
                    <div className="w-12 h-14 bg-slate-200 rounded flex items-end justify-center overflow-hidden border border-slate-350">
                      <User size={30} className="text-slate-455 translate-y-1" />
                    </div>
                    <div className="text-left text-[8px] font-bold text-slate-750 space-y-1">
                      <strong className="text-[9px] text-slate-900 block">{previewDoc.citizenName}</strong>
                      <span>DOB: 12/05/{67 === previewCitizenProfile.age ? '1959' : '1996'}</span>
                      <span className="block">Gender: {previewCitizenProfile.gender === 'Female' ? 'Female / महिला' : 'Male / पुरुष'}</span>
                    </div>
                  </div>
                  <div className="text-center border-t border-red-200 pt-1.5">
                    <strong className="text-xs font-black font-mono tracking-wider text-slate-800">4839 1234 {previewCitizenProfile.id === 'cit_101' ? '7629' : '1082'}</strong>
                  </div>
                </div>
              ) : (
                /* Land Extract 7/12 Graphic */
                <div className="bg-white border-2 border-emerald-800 p-5 rounded w-full max-w-[320px] aspect-[1/1.4] flex flex-col justify-between text-center select-none shadow-sm relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">{i18n.language === 'en' ? 'Land Records Department • Government of Maharashtra' : 'भूमी अभिलेख विभाग • महाराष्ट्र शासन'}</span>
                    <h4 className="text-[9px] font-black text-emerald-950 uppercase tracking-widest border-b border-emerald-800 pb-1 m-0">गाव नमुना ७ (अधिकार अभिलेख पत्रक) / FORM VII-XII</h4>
                  </div>
                  <div className="text-left text-[7px] font-bold text-slate-755 space-y-2 py-3">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-b border-slate-200 pb-1 text-slate-700">
                      <span>{i18n.language === 'en' ? 'District: Pune' : 'जिल्हा: पुणे'}</span>
                      <span>{i18n.language === 'en' ? 'Taluka: Haveli' : 'तालुका: हवेली'}</span>
                      <span>{i18n.language === 'en' ? 'Village: Loni Kalbhor' : 'गाव: लोणी काळभोर'}</span>
                      <span>{i18n.language === 'en' ? 'Survey No: 184/A' : 'गट क्र: १८४/अ'}</span>
                    </div>
                    <p className="leading-normal">
                      <strong>{i18n.language === 'en' ? 'Owner Name' : 'खातेदाराचे नाव'}:</strong> {previewDoc.citizenName}
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700">
                      <span>{i18n.language === 'en' ? 'Total Area: 1.25 Hectares' : 'एकूण क्षेत्र: १.२५ हेक्टर'}</span>
                      <span>{i18n.language === 'en' ? 'Land Class: Jirayat' : 'भूमी वर्ग: जिरायत (कोरडवाहू)'}</span>
                      <span>{i18n.language === 'en' ? 'Tax: ₹14.50' : 'आकारणी: ₹१४.५०'}</span>
                      <span>{i18n.language === 'en' ? 'Status: Clear' : 'इतर हक्क: निरंक (बोजा नाही)'}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between text-[7px] font-bold text-slate-500 mt-2">
                    <div className="text-left">
                      <span>{i18n.language === 'en' ? 'Verifier ID: Haveli-LRC-876' : 'पडताळणी अधिकारी: हवेली-LRC-८७६'}</span>
                      <span className="block mt-0.5">{i18n.language === 'en' ? 'Date' : 'दिनांक'}: {previewDoc.submittedDate}</span>
                    </div>
                    <div className="text-center font-mono">
                      <span className="border-t border-slate-300 block pt-0.5 px-2">
                        {i18n.language === 'en' ? 'Land Inspector Desk' : 'भूमी निरीक्षक कार्यालय'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer inside Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              {(previewDoc.status === 'Pending Verification' || previewDoc.status === 'Verified') && (
                <button
                  onClick={() => {
                    handleRejectDoc(previewDoc.id);
                    setPreviewDoc(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-650 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  {i18n.language === 'en' ? 'Reject Document' : 'दस्तऐवज नाकारा'}
                </button>
              )}
              {(previewDoc.status === 'Pending Verification' || previewDoc.status === 'Rejected') && (
                <button
                  onClick={() => {
                    handleVerifyDoc(previewDoc.id);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-1.5 bg-govnavy hover:bg-govblue-700 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors shadow"
                >
                  <Check size={14} />
                  <span>{i18n.language === 'en' ? 'Verify & Save to DB' : 'पडताळणी पूर्ण करा'}</span>
                </button>
              )}
              {previewDoc.status !== 'Pending Verification' && (
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-slate-250 hover:bg-slate-350 text-slate-700 rounded text-xs font-bold transition-colors"
                >
                  {i18n.language === 'en' ? 'Close' : 'बंद करा'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
