import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, 
  Percent,
  Plus,
  X
} from 'lucide-react';
import { PROJECTS, MAP_CENTER } from '../data/mockData';
import type { Project } from '../data/mockData';

export const DevelopmentProjects: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [projectsList, setProjectsList] = useState<Project[]>(PROJECTS);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ongoing' | 'Completed' | 'Delayed'>('All');
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [budget, setBudget] = useState(500000);
  const [ward, setWard] = useState(1);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Filtering projects
  const filteredProjects = useMemo(() => {
    return projectsList.filter(p => {
      if (statusFilter === 'All') return true;
      return p.status === statusFilter;
    });
  }, [projectsList, statusFilter]);

  const handleRegisterProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    const newProject: Project = {
      id: `proj_${Date.now().toString().substring(8)}`,
      name,
      nameMr: name, // Simplified copy for mock
      progress: 0,
      budget,
      utilized: 0,
      status: 'Ongoing',
      statusMr: 'सुरू असलेले',
      ward,
      location,
      locationMr: location,
      description,
      descriptionMr: description,
      coordinates: [
        MAP_CENTER[0] + (Math.random() - 0.5) * 0.008,
        MAP_CENTER[1] + (Math.random() - 0.5) * 0.008
      ]
    };

    setProjectsList([...projectsList, newProject]);
    PROJECTS.push(newProject); // Sync with mock DB cache
    
    // Reset Form
    setName('');
    setBudget(500000);
    setWard(1);
    setLocation('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('projects_page.title')}</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time status tracking, budget allocations, and timelines of civil works.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
        >
          <Plus size={16} />
          <span>{t('projects_page.add_project')}</span>
        </button>
      </div>

      {/* Status Filters Toggle */}
      <div className="flex items-center gap-1.5 bg-slate-900/30 border border-slate-800/80 p-2 rounded-lg max-w-max">
        {['All', 'Ongoing', 'Completed', 'Delayed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
              statusFilter === status 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-2 text-center py-10 glass-card rounded-xl text-slate-500 text-sm">
            No projects found matching the selected status filter.
          </div>
        ) : (
          filteredProjects.map((p) => {
            const isCompleted = p.status === 'Completed';
            const isDelayed = p.status === 'Delayed';
            const budgetLakh = (p.budget / 100000).toFixed(2);
            const utilizedLakh = (p.utilized / 100000).toFixed(2);
            const remainingLakh = ((p.budget - p.utilized) / 100000).toFixed(2);


            return (
              <div 
                key={p.id}
                className="glass-card rounded-xl p-5 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-5"
              >
                {/* Header info */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-bold text-white tracking-wide leading-snug">
                      {i18n.language === 'en' ? p.name : p.nameMr}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                        : isDelayed
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20 animate-pulse'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                    }`}>
                      {i18n.language === 'en' ? p.status : p.statusMr}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-600" />
                      <span>{i18n.language === 'en' ? p.location : p.locationMr}</span>
                    </span>
                    <span>•</span>
                    <span>Ward {p.ward}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {i18n.language === 'en' ? p.description : p.descriptionMr}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Percent size={12} className="text-indigo-400" />
                      <span>{t('projects_page.progress')}</span>
                    </span>
                    <strong className="text-white">{p.progress}%</strong>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-emerald-500' 
                          : isDelayed
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                {/* Budgets trackers */}
                <div className="pt-4 border-t border-slate-850 grid grid-cols-3 gap-3 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">{t('projects_page.budget')}</span>
                    <strong className="text-xs text-slate-200 block">₹{budgetLakh} Lakh</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">{t('projects_page.utilized')}</span>
                    <strong className="text-xs text-indigo-400 block">₹{utilizedLakh} Lakh</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Remaining</span>
                    <strong className="text-xs text-slate-400 block">₹{remainingLakh} Lakh</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Register Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wide m-0 uppercase text-slate-400">
                {t('projects_page.add_project')}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegisterProject} className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Village Primary School Library"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Budget */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Budget Allocation (₹)</label>
                <input
                  type="number"
                  required
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ward */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Ward Location</label>
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

              {/* Location details */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Location / Address</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near ZP School Compound, Ward 2"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Project Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the civil works, construction targets, and timeline goals."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

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
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/15"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
