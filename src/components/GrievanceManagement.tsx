import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Brain,
  Sparkles,
  Filter,
  X
} from 'lucide-react';
import { GRIEVANCES, MAP_CENTER } from '../data/mockData';
import type { Grievance } from '../data/mockData';


export const GrievanceManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [grievanceList, setGrievanceList] = useState<Grievance[]>(GRIEVANCES);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'High' | 'Resolved'>('All');

  const handleStatusChange = (id: string, newStatus: Grievance['status']) => {
    let statusMr = 'प्रलंबित';
    if (newStatus === 'In Progress') statusMr = 'सुरू असलेले';
    if (newStatus === 'Resolved') statusMr = 'निवारण झाले';

    // Update React State
    const updated = grievanceList.map(g => {
      if (g.id === id) {
        return { ...g, status: newStatus, statusMr };
      }
      return g;
    });
    setGrievanceList(updated);

    // Sync back to cache database
    const dbIndex = GRIEVANCES.findIndex(g => g.id === id);
    if (dbIndex !== -1) {
      GRIEVANCES[dbIndex].status = newStatus;
      GRIEVANCES[dbIndex].statusMr = statusMr;
    }
  };
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ward, setWard] = useState(1);

  // Dynamic AI prediction previews based on user input
  const aiPredictions = useMemo(() => {
    if (!description.trim() && !title.trim()) return null;
    const text = (title + ' ' + description).toLowerCase();

    let predictedCategory: Grievance['category'] = 'Other';
    let predictedCategoryMr = 'इतर';
    let predictedPriority: Grievance['priority'] = 'Medium';
    let predictedPriorityMr = 'मध्यम';
    let deptName = 'General Administration Cell';
    let deptNameMr = 'सामान्य प्रशासन कक्ष';

    // Rule heuristics for AI predictions
    if (text.includes('water') || text.includes('tap') || text.includes('leak') || text.includes('पाणी') || text.includes('नळ')) {
      predictedCategory = 'Water';
      predictedCategoryMr = 'पाणी पुरवठा';
      deptName = 'Water Supply and Sanitation Department';
      deptNameMr = 'पाणी पुरवठा आणि स्वच्छता विभाग';
    } else if (text.includes('road') || text.includes('pothole') || text.includes('street') || text.includes('रस्ता') || text.includes('खड्डे')) {
      predictedCategory = 'Roads';
      predictedCategoryMr = 'रस्ते / दळणवळण';
      deptName = 'Public Works Department (Rural Roads)';
      deptNameMr = 'सार्वजनिक बांधकाम विभाग (ग्रामीण रस्ते)';
    } else if (text.includes('light') || text.includes('wire') || text.includes('power') || text.includes('electricity') || text.includes('वीज') || text.includes('दिवा')) {
      predictedCategory = 'Electricity';
      predictedCategoryMr = 'विद्युत पुरवठा';
      deptName = 'MSEB Rural Division (Panchayat Wing)';
      deptNameMr = 'एमएसईबी ग्रामीण विभाग (पंचायत शाखा)';
    } else if (text.includes('clean') || text.includes('waste') || text.includes('drain') || text.includes('sewage') || text.includes('कचरा') || text.includes('गटार')) {
      predictedCategory = 'Sanitation';
      predictedCategoryMr = 'स्वच्छता आणि कचरा व्यवस्थापन';
      deptName = 'Panchayat Health & Sanitation Cell';
      deptNameMr = 'पंचायत आरोग्य व स्वच्छता कक्ष';
    } else if (text.includes('health') || text.includes('medicine') || text.includes('doctor') || text.includes('आरोग्य') || text.includes('औषध')) {
      predictedCategory = 'Health';
      predictedCategoryMr = 'आरोग्य सुविधा';
      deptName = 'District Health Administration Office';
      deptNameMr = 'जिल्हा आरोग्य प्रशासन कार्यालय';
    }

    if (text.includes('danger') || text.includes('accident') || text.includes('critical') || text.includes('अति-तात्काळ') || text.includes('अपघात')) {
      predictedPriority = 'Critical';
      predictedPriorityMr = 'अति-तात्काळ';
    } else if (text.includes('high') || text.includes('urgent') || text.includes('leak') || text.includes('लवकर') || text.includes('त्वरित')) {
      predictedPriority = 'High';
      predictedPriorityMr = 'उच्च';
    } else if (text.includes('low') || text.includes('कमी')) {
      predictedPriority = 'Low';
      predictedPriorityMr = 'कमी';
    }

    return {
      category: predictedCategory,
      categoryMr: predictedCategoryMr,
      priority: predictedPriority,
      priorityMr: predictedPriorityMr,
      deptName,
      deptNameMr
    };
  }, [title, description]);

  // Compute Grievance stats dynamically from current state
  const stats = useMemo(() => {
    return {
      total: grievanceList.length,
      pending: grievanceList.filter(g => g.status === 'Pending').length,
      resolved: grievanceList.filter(g => g.status === 'Resolved').length,
      high: grievanceList.filter(g => g.priority === 'High' || g.priority === 'Critical').length
    };
  }, [grievanceList]);

  // Filter grievance records
  const filteredGrievances = useMemo(() => {
    return grievanceList.filter(g => {
      // 1. Status/Priority main filters
      if (activeFilter === 'Pending' && g.status === 'Resolved') return false;
      if (activeFilter === 'Resolved' && g.status !== 'Resolved') return false;
      if (activeFilter === 'High' && g.priority !== 'High' && g.priority !== 'Critical') return false;

      // 2. Category Filter
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;

      return true;
    });
  }, [grievanceList, activeFilter, categoryFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Use predictions or default values
    const finalPredict = aiPredictions || {
      category: 'Other' as const,
      categoryMr: 'इतर',
      priority: 'Medium' as const,
      priorityMr: 'मध्यम',
      deptName: 'General Administration Cell',
      deptNameMr: 'सामान्य प्रशासन कक्ष'
    };

    const newGrievance: Grievance = {
      id: `grv_${Date.now().toString().substring(8)}`,
      title,
      titleMr: title, // Simplified copy for mock
      category: finalPredict.category,
      categoryMr: finalPredict.categoryMr,
      ward,
      priority: finalPredict.priority,
      priorityMr: finalPredict.priorityMr,
      status: 'Pending',
      statusMr: 'प्रलंबित',
      submittedDate: new Date().toISOString().split('T')[0],
      description,
      descriptionMr: description,
      deptName: finalPredict.deptName,
      deptNameMr: finalPredict.deptNameMr,
      // Random coordinates offset from Loni Kalbhor center
      coordinates: [
        MAP_CENTER[0] + (Math.random() - 0.5) * 0.008,
        MAP_CENTER[1] + (Math.random() - 0.5) * 0.008
      ]
    };

    // Save to list
    setGrievanceList([newGrievance, ...grievanceList]);

    // Save also to memory/DB mock so other views like Map and Dashboard can see it
    GRIEVANCES.unshift(newGrievance);

    // Reset Form
    setTitle('');
    setDescription('');
    setWard(1);
    setShowModal(false);
  };

  const categories = ['Water', 'Roads', 'Electricity', 'Sanitation', 'Health', 'Other'];

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('grievances_page.title')}</h1>
          <p className="text-xs text-slate-500 mt-1">AI-assisted categorizer, routing logic, and status logs.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
        >
          <Plus size={16} />
          <span>{t('grievances_page.submit_new')}</span>
        </button>
      </div>

      {/* Grid Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <button 
          onClick={() => setActiveFilter('All')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'All' 
              ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/5' 
              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t('grievances_page.total')}</span>
          <span className="text-2xl font-extrabold text-white block mt-1">{stats.total}</span>
        </button>

        {/* Pending */}
        <button 
          onClick={() => setActiveFilter('Pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'Pending' 
              ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-500/5' 
              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t('grievances_page.pending')}</span>
          <span className="text-2xl font-extrabold text-amber-400 block mt-1">{stats.pending}</span>
        </button>

        {/* High Priority */}
        <button 
          onClick={() => setActiveFilter('High')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'High' 
              ? 'bg-slate-900 border-rose-500 shadow-md shadow-rose-500/5' 
              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t('grievances_page.high')}</span>
          <span className="text-2xl font-extrabold text-rose-500 block mt-1">{stats.high}</span>
        </button>

        {/* Resolved */}
        <button 
          onClick={() => setActiveFilter('Resolved')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'Resolved' 
              ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/5' 
              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t('grievances_page.resolved')}</span>
          <span className="text-2xl font-extrabold text-emerald-400 block mt-1">{stats.resolved}</span>
        </button>
      </div>

      {/* Secondary Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/30 border border-slate-800/80 p-2 rounded-lg">
        <span className="text-xs text-slate-400 font-semibold px-2 flex items-center gap-1.5">
          <Filter size={12} />
          <span>Category:</span>
        </span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            categoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          All
        </button>
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              categoryFilter === cat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grievance Cards List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGrievances.length === 0 ? (
          <div className="col-span-2 text-center py-10 glass-card rounded-xl text-slate-500 text-sm">
            No grievances match the selected status and category filters.
          </div>
        ) : (
          filteredGrievances.map((g) => {
            const isResolved = g.status === 'Resolved';
            const isCritical = g.priority === 'Critical';
            const isHigh = g.priority === 'High';

            return (
              <div 
                key={g.id}
                className="glass-card rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Title Header */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-bold text-white tracking-wide leading-snug">
                      {i18n.language === 'en' ? g.title : g.titleMr}
                    </h3>
                    <select
                      value={g.status}
                      onChange={(e) => handleStatusChange(g.id, e.target.value as any)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 cursor-pointer focus:outline-none border ${
                        isResolved 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' 
                          : g.status === 'In Progress'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/20'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <option value="Pending" className="bg-slate-950 text-slate-400">Pending</option>
                      <option value="In Progress" className="bg-slate-950 text-amber-400">In Progress</option>
                      <option value="Resolved" className="bg-slate-950 text-emerald-400">Resolved</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>ID: {g.id}</span>
                    <span>•</span>
                    <span>Ward {g.ward}</span>
                    <span>•</span>
                    <span>Submitted: {g.submittedDate}</span>
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                  {i18n.language === 'en' ? g.description : g.descriptionMr}
                </p>

                {/* Routing & Category tag footer */}
                <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {i18n.language === 'en' ? g.category : g.categoryMr}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-600/30'
                        : isHigh
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}>
                      {i18n.language === 'en' ? g.priority : g.priorityMr}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 italic">
                    Dept: {i18n.language === 'en' ? g.deptName : g.deptNameMr}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Grievance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wide m-0 uppercase text-slate-400">
                {t('grievances_page.submit_new')}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">{t('grievances_page.grievance_title')}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken Water Pipe near ZP School"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ward Select */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">{t('grievances_page.ward')}</label>
                <select
                  value={ward}
                  onChange={(e) => setWard(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Ward 1</option>
                  <option value={2}>Ward 2</option>
                  <option value={3}>Ward 3</option>
                  <option value={4}>Ward 4</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">{t('grievances_page.description')}</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the complaint details. The AI Engine will automatically parse this text to determine categories, urgency, coordinates, and route it to the appropriate department."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* AI Auto-categorization Box */}
              {aiPredictions && (
                <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    <Brain size={14} className="animate-pulse" />
                    <span>{t('grievances_page.ai_tagging')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Category Classification</span>
                      <strong className="text-slate-200">{aiPredictions.category}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Priority Urgency</span>
                      <strong className="text-rose-400">{aiPredictions.priority}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">{t('grievances_page.route_dept')}</span>
                      <strong className="text-indigo-300">{aiPredictions.deptName}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-850 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  {t('grievances_page.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-indigo-600/15"
                >
                  <Sparkles size={12} />
                  <span>{t('grievances_page.submit')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
