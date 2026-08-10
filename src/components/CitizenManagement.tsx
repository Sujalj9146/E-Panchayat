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
  X
} from 'lucide-react';
import { CITIZENS, SCHEMES, CITIZEN_DOCUMENTS } from '../data/mockData';
import { Check, X as RejectIcon, FileCheck } from 'lucide-react';


export const CitizenManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [occupationFilter, setOccupationFilter] = useState('all');
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'verification'>('directory');
  const [docList, setDocList] = useState(CITIZEN_DOCUMENTS);

  const handleVerifyDoc = (id: string) => {
    const docIndex = CITIZEN_DOCUMENTS.findIndex(d => d.id === id);
    if (docIndex !== -1) {
      CITIZEN_DOCUMENTS[docIndex].status = 'Verified';
      CITIZEN_DOCUMENTS[docIndex].statusMr = 'पडताळणी पूर्ण';
      setDocList([...CITIZEN_DOCUMENTS]);
    }
  };

  const handleRejectDoc = (id: string) => {
    const docIndex = CITIZEN_DOCUMENTS.findIndex(d => d.id === id);
    if (docIndex !== -1) {
      CITIZEN_DOCUMENTS[docIndex].status = 'Rejected';
      CITIZEN_DOCUMENTS[docIndex].statusMr = 'अस्वीकृत';
      setDocList([...CITIZEN_DOCUMENTS]);
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
        <p className="text-xs text-slate-500 mt-1">Search official databases, visualize family relations, and audit uploaded citizen records.</p>
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
          👥 Citizen Directory
        </button>
        <button
          onClick={() => setActiveSubTab('verification')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all focus:outline-none relative flex items-center gap-1.5 ${
            activeSubTab === 'verification' 
              ? 'border-b-2 border-indigo-500 text-indigo-400 font-black' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span>📂 Document Verification Queue</span>
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
              {docList.filter(d => d.status === 'Pending Verification').length} Pending Documents for Audit
            </span>
          </div>

          <div className="overflow-x-auto">
            {docList.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                No documents uploaded in verification queue yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold select-none">
                    <th className="p-4">Citizen Name</th>
                    <th className="p-4">Document Type</th>
                    <th className="p-4">Attached File</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Audit Actions</th>
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
                        <td className="p-4 font-mono text-[11px] text-govnavy font-bold">{doc.fileName}</td>
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
                          {isPending ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleRejectDoc(doc.id)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-250 transition-colors"
                                title="Reject Document"
                              >
                                <RejectIcon size={14} />
                              </button>
                              <button
                                onClick={() => handleVerifyDoc(doc.id)}
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-250 transition-colors"
                                title="Verify & Save to Database"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                              <FileCheck size={12} className="text-emerald-500" />
                              <span>Audit Complete</span>
                            </span>
                          )}
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
    </div>
  );
};
