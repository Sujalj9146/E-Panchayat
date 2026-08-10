import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Upload, 
  Sparkles, 
  CheckCircle, 
  User, 
  Calendar, 
  RefreshCw,
  Plus
} from 'lucide-react';
import { MOCK_SABHA_MEETING } from '../data/mockData';
import type { SabhaMeeting } from '../data/mockData';


export const GramSabhaAI: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [meeting, setMeeting] = useState<SabhaMeeting | null>(MOCK_SABHA_MEETING);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Form states to add new action items to the active meeting
  const [newAction, setNewAction] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Handle mock file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setMeeting(null); // Clear active meeting to show processing state

    // Simulate GraphRAG model pipeline
    setTimeout(() => {
      setUploading(false);
      setMeeting({
        id: `sabha_${Date.now().toString().substring(8)}`,
        date: new Date().toISOString().split('T')[0],
        title: `Gram Sabha Extra Session (${file.name})`,
        titleMr: `विशेष ग्रामसभा सत्र बैठक (${file.name})`,
        summary: `Successfully parsed "${file.name}" transcript. The meeting discussions centered on cleaning primary water filter tanks, upgrading Ward 4 public clinics, and allocating funds for concrete compound paving at the local ZP School.`,
        summaryMr: `दस्तऐवज "${file.name}" चे यशस्वीरीत्या विश्लेषण केले. या बैठकीत मुख्यत्वे सार्वजनिक जलशुद्धीकरण केंद्रांची स्वच्छता करणे, वॉर्ड ४ मधील दवाखान्याचे श्रेणीवर्धन करणे आणि जिल्हा परिषद शाळेच्या आवारामध्ये पेव्हर ब्लॉक बसवण्यासाठी निधी मंजूर करणे यावर चर्चा झाली.`,
        decisions: [
          'Allocate ₹50,000 for primary school paving and paint repairs.',
          'Instruct Health Committee to inspect Ward 4 Sub-centre medical supplies weekly.',
          'Approve local well desilting schedule before post-monsoon harvest.'
        ],
        decisionsMr: [
          'शाळेच्या रंगकाम आणि आवार दुरुस्तीसाठी ₹५०,००० निधी मंजूर केला.',
          'आरोग्य समितीला वॉर्ड ४ मधील उपकेंद्राच्या औषध साठ्याची दर आठवड्याला तपासणी करण्याचे निर्देश दिले.',
          'पावसाळ्यानंतर काढणीपूर्वी विहिरींच्या गाळ उपसण्याच्या वेळापत्रकास मंजुरी दिली.'
        ],
        actionItems: [
          {
            action: 'Draft School Paving Tender Estimate',
            actionMr: 'शाळा पेव्हर ब्लॉक निविदा अंदाजपत्रक तयार करणे',
            responsible: 'Junior Engineer (Civil works)',
            responsibleMr: 'कनिष्ठ अभियंता (स्थापत्य)',
            deadline: '2026-08-25',
            status: 'Pending',
            statusMr: 'प्रलंबित'
          },
          {
            action: 'Submit Health Supplies Audit Report',
            actionMr: 'आरोग्य पुरवठा तपासणी अहवाल सादर करणे',
            responsible: 'Health Sub-centre Officer',
            responsibleMr: 'आरोग्य उपकेंद्र अधिकारी',
            deadline: '2026-08-18',
            status: 'In Progress',
            statusMr: 'सुरू असलेले'
          }
        ]
      });
    }, 2500);
  };

  // Toggle status of an action item
  const handleStatusChange = (index: number) => {
    if (!meeting) return;
    const updatedActions = [...meeting.actionItems];
    const item = updatedActions[index];
    
    if (item.status === 'Pending') {
      item.status = 'In Progress';
      item.statusMr = 'सुरू असलेले';
    } else if (item.status === 'In Progress') {
      item.status = 'Completed';
      item.statusMr = 'पूर्ण झालेले';
    } else {
      item.status = 'Pending';
      item.statusMr = 'प्रलंबित';
    }

    setMeeting({
      ...meeting,
      actionItems: updatedActions
    });
  };

  // Add action item manually
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !newAction.trim() || !newResponsible.trim()) return;

    const newAct = {
      action: newAction,
      actionMr: newAction,
      responsible: newResponsible,
      responsibleMr: newResponsible,
      deadline: newDeadline || '2026-08-30',
      status: 'Pending' as const,
      statusMr: 'प्रलंबित'
    };

    setMeeting({
      ...meeting,
      actionItems: [...meeting.actionItems, newAct]
    });

    // Reset inputs
    setNewAction('');
    setNewResponsible('');
    setNewDeadline('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('sabha_page.title')}</h1>
        <p className="text-xs text-slate-500 mt-1">Upload meeting minutes or audio transcripts. AI extracts decisions, action items, and syncs updates.</p>
      </div>

      {/* Upload Box */}
      <div className="glass-card rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
          <Upload size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-200">{t('sabha_page.upload_title')}</h2>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t('sabha_page.upload_desc')}</p>
        </div>
        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-indigo-600/10">
          <span>{t('sabha_page.upload_btn')}</span>
          <input 
            type="file" 
            accept=".txt,.pdf,.doc,.docx" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>
        {fileName && (
          <span className="text-[10px] font-mono text-slate-400">Selected file: {fileName}</span>
        )}
      </div>

      {/* Processing State spinner */}
      {uploading && (
        <div className="glass-card rounded-xl border border-slate-800 p-8 flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={24} className="text-purple-400 animate-spin" />
          <span className="text-xs text-purple-400 font-semibold">{t('sabha_page.processing')}</span>
        </div>
      )}

      {/* AI Summary Outputs */}
      {meeting && !uploading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Summary & Decisions Panel */}
          <div className="glass-card rounded-xl border border-slate-800 p-5 space-y-6 lg:col-span-2">
            {/* Header info */}
            <div className="border-b border-slate-850 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {i18n.language === 'en' ? meeting.title : meeting.titleMr}
                </h3>
                <span className="text-[10px] text-slate-500">Meeting Date: {meeting.date}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none max-w-max border border-purple-500/20">
                <Sparkles size={10} />
                <span>Parsed via GraphRAG</span>
              </div>
            </div>

            {/* AI Summary text */}
            <div className="space-y-2">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('sabha_page.summary_title')}</h4>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed font-sans bg-slate-900/50 p-4 rounded-lg border border-slate-800/80">
                {i18n.language === 'en' ? meeting.summary : meeting.summaryMr}
              </p>
            </div>

            {/* Key Decisions list */}
            <div className="space-y-3.5">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('sabha_page.decisions_title')}</h4>
              <div className="space-y-2">
                {(i18n.language === 'en' ? meeting.decisions : meeting.decisionsMr).map((decision, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-300 p-3 rounded-lg bg-slate-900/30 border border-slate-850/60"
                  >
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="leading-normal">{decision}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Items List & Manager */}
          <div className="glass-card rounded-xl border border-slate-800 p-5 space-y-6">
            <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-3">
              {t('sabha_page.actions_title')}
            </h3>

            {/* Action Items Table */}
            <div className="space-y-4">
              {meeting.actionItems.map((item, idx) => {
                const isCompleted = item.status === 'Completed';
                const isInProgress = item.status === 'In Progress';

                return (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-850 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <strong className="text-xs text-white block font-sans">
                        {i18n.language === 'en' ? item.action : item.actionMr}
                      </strong>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          <span>{i18n.language === 'en' ? item.responsible : item.responsibleMr}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{item.deadline}</span>
                        </span>
                      </div>
                    </div>

                    {/* Toggle button */}
                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Status</span>
                      <button
                        onClick={() => handleStatusChange(idx)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                          isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                            : isInProgress
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20 animate-pulse'
                              : 'bg-slate-950 text-slate-400 border border-slate-850'
                        }`}
                      >
                        {i18n.language === 'en' ? item.status : item.statusMr}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Action Item form */}
            <form onSubmit={handleAddAction} className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assign Action Task</h4>
              
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Task description..."
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  required
                  value={newResponsible}
                  onChange={(e) => setNewResponsible(e.target.value)}
                  placeholder="Responsible Person..."
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="px-3 py-1.5 rounded bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus size={12} />
                  <span>Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
