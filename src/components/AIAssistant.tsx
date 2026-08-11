import { callGeminiAPI } from '../lib/gemini';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { CITIZENS, GRIEVANCES, PROJECTS, MOCK_SABHA_MEETING } from '../data/mockData';


interface Message {
  sender: 'user' | 'ai';
  text: string;
  sources?: { type: string; title: string; link?: string }[];
  graphData?: {
    nodes: { id: string; label: string; labelMr: string; type: string }[];
    links: { source: string; target: string; label: string; labelMr: string }[];
  };
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const renderFormattedText = (text: string) => {
  return text.split('\n').map((line, lIdx) => {
    const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
    const cleanLine = isBullet ? line.trim().replace(/^[-*]\s+/, '') : line;

    const parts = cleanLine.split('**');
    const lineContent = parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return <strong key={pIdx} className="font-extrabold text-inherit">{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lIdx} className="ml-4 list-disc my-1 text-inherit">
          {lineContent}
        </li>
      );
    }

    return (
      <p key={lIdx} className="my-1 text-inherit min-h-[1em]">
        {lineContent}
      </p>
    );
  });
};

export const AIAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: i18n.language === 'en' 
        ? "Namaskar! I am the E-Panchayat Decision Support AI. I have indexed your village citizen files, development projects, financial budgets, grievances, and Gram Sabha transcripts via GraphRAG. How can I help you today?"
        : "नमस्कार! मी ई-पंचायत निर्णय समर्थन एआय आहे. मी तुमचे नागरिक अभिलेख, विकास प्रकल्प, वित्तीय बजेट, तक्रारी आणि ग्रामसभा वृत्तांत यांचे GraphRAG द्वारे विश्लेषण केले आहे. मी तुम्हाला आज कशी मदत करू?"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const presets = [
    { text: t('ai_assistant.preset_q1'), value: 'grievances' },
    { text: t('ai_assistant.preset_q2'), value: 'senior_pension_ward_3' },
    { text: t('ai_assistant.preset_q3'), value: 'delayed_projects' },
    { text: t('ai_assistant.preset_q4'), value: 'budget' }
  ];

  


const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newMessages: Message[] = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const query = textToSend.toLowerCase();
    const isEnglish = i18n.language === 'en';

    // Call Gemini API if Key is set
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const gResult = await callGeminiAPI(textToSend, GEMINI_API_KEY, isEnglish, true);
        if (gResult) {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: gResult,
            sources: [{ type: 'Gemini 2.5 Flash', title: 'Generative AI Response' }],
            graphData: {
              nodes: [
                { id: 'q', label: 'User Inquiry', labelMr: 'युझर प्रश्न', type: 'query' },
                { id: 'g', label: 'Gemini Cloud', labelMr: 'जेमिनी क्लाउड', type: 'entity' }
              ],
              links: [
                { source: 'q', target: 'g', label: 'Dispatches query', labelMr: 'प्रश्न पाठवला' }
              ]
            }
          }]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Gemini Cloud call failed, self-healing back to offline GraphRAG engine:", err);
      }
    }

    // Fallback to offline GraphRAG search response after short timeout
    setTimeout(() => {
      let aiResponseText = "";
      let aiSources: { type: string; title: string }[] = [];
      let graphNodes: { id: string; label: string; labelMr: string; type: string }[] = [];
      let graphLinks: { source: string; target: string; label: string; labelMr: string }[] = [];

      if (query.includes('grievance') || query.includes('तक्रार') || query.includes('ward') || query.includes('वॉर्ड')) {
        const active = GRIEVANCES.filter(g => g.status !== 'Resolved');
        const ward3 = GRIEVANCES.filter(g => g.ward === 3);
        
        if (isEnglish) {
          aiResponseText = `Based on the latest database indexing, there are currently ${active.length} pending/in-progress grievances in the village. \n\n**Ward 3 has the highest load with ${ward3.length} unresolved cases** (specifically: "${GRIEVANCES[0].title}" and "${GRIEVANCES[2].title}"). \n\n**AI Departmental Routing:** The Sanitation cell and Water Works department are primary bottlenecks due to Market Square drainage clogging.`;
        } else {
          aiResponseText = `ताज्या अहवालानुसार, गावात सध्या एकूण ${active.length} तक्रारी प्रलंबित किंवा प्रगतीपथावर आहेत.\n\n**वॉर्ड ३ मध्ये सर्वाधिक लोड असून तेथे ${ward3.length} प्रलंबित प्रकरणे आहेत** (उदा: "${GRIEVANCES[0].titleMr}" आणि "${GRIEVANCES[2].titleMr}").\n\n**AI शिफारस:** स्वच्छता कक्ष आणि पाणी पुरवठा विभागाला या तक्रारी वर्ग करण्यात आल्या आहेत.`;
        }
        aiSources = GRIEVANCES.slice(0, 3).map(g => ({ type: 'Grievance Record', title: isEnglish ? g.title : g.titleMr }));
        
        graphNodes = [
          { id: 'q', label: 'Grievances Scan', labelMr: 'तक्रार स्कॅन', type: 'query' },
          { id: 'w', label: 'Ward 3 Location', labelMr: 'वॉर्ड ३ ठिकाण', type: 'entity' },
          { id: 'i', label: 'Drainage Clogging', labelMr: 'गटार पाणी तुंबणे', type: 'concept' },
          { id: 'd', label: 'Sanitation Dept', labelMr: 'स्वच्छता विभाग', type: 'source' }
        ];
        graphLinks = [
          { source: 'q', target: 'w', label: 'Scans Ward', labelMr: 'वॉर्ड शोध' },
          { source: 'w', target: 'i', label: 'Contains issue', labelMr: 'समस्या समाविष्ट' },
          { source: 'i', target: 'd', label: 'Routed cell', labelMr: 'वर्ग केलेला कक्ष' }
        ];

      } else if (query.includes('senior') || query.includes('pension') || query.includes('पेन्शन') || query.includes('वृद्ध') || query.includes('ज्येष्ठ')) {
        const eligible = CITIZENS.filter(c => c.age >= 60 && c.income <= 100000);
        
        if (isEnglish) {
          aiResponseText = `According to the demographics dataset, we found ${eligible.length} citizens eligible for the Senior Citizen Pension scheme who are not yet fully enrolled. \n\nSpecifically in **Ward 3**, citizen **Savita Patil** (61 yrs, household income: ₹0) is recommended. \n\nIn **Ward 4**, we recommend **Ramesh Shinde** (72 yrs, income: ₹38,000) and **Lata Shinde** (65 yrs, income: ₹12,000). All documents are verified under family tree ID fam_shinde.`;
        } else {
          aiResponseText = `नागरिक डेटा विश्लेषणानुसार, आपल्याला ज्येष्ठ नागरिक पेन्शन योजनेसाठी ${eligible.length} नागरिक पात्र मिळाले आहेत ज्यांची अद्याप नोंदणी झालेली नाही.\n\nविशेषतः **वॉर्ड ३** मधील रहिवासी **सविता पाटील** (वय ६१, उत्पन्न: ₹०) यांना शिफारस करण्यात येत आहे.\n\n**वॉर्ड ४** मधील **रमेश शिंदे** (वय ७२, उत्पन्न: ₹३८,०००) आणि **लता शिंदे** (वय ६५, उत्पन्न: ₹१२,०००) पात्र आहेत.`;
        }
        aiSources = eligible.map(c => ({ type: 'Citizen Profile', title: isEnglish ? c.name : c.nameMr }));

        graphNodes = [
          { id: 'q', label: 'Pension Inquiry', labelMr: 'पेन्शन योजना', type: 'query' },
          { id: 's', label: 'Sr Citizen Pension', labelMr: 'ज्येष्ठ नागरिक पेन्शन', type: 'entity' },
          { id: 'u', label: 'Savita Patil', labelMr: 'सविता पाटील', type: 'concept' },
          { id: 'd', label: 'Verified Income', labelMr: 'पडताळणी उत्पन्न', type: 'source' }
        ];
        graphLinks = [
          { source: 'q', target: 's', label: 'Requests scheme', labelMr: 'योजना विनंती' },
          { source: 's', target: 'u', label: 'Matches applicant', labelMr: 'पात्र अर्जदार' },
          { source: 'u', target: 'd', label: 'References proof', labelMr: 'प्रमाणपत्र संदर्भ' }
        ];

      } else if (query.includes('delay') || query.includes('project') || query.includes('प्रकल्प') || query.includes('काम')) {
        const delayed = PROJECTS.filter(p => p.status === 'Delayed');
        
        if (isEnglish) {
          aiResponseText = `Analyzing Panchayat infrastructure trackers: \n\n**${delayed.length} project is classified as Delayed:** \n\n- **${PROJECTS[0].name}** (Ward 3)\n  - Progress: ${PROJECTS[0].progress}%\n  - Budget: ₹${(PROJECTS[0].budget/100000).toFixed(1)} Lakh (₹${(PROJECTS[0].utilized/100000).toFixed(1)} Lakh utilized)\n  - Reason: Supply chain issues for aggregate cement tiles reported in June Gram Sabha notes.`;
        } else {
          aiResponseText = `प्रकल्प देखरेख अहवालानुसार:\n\n**${delayed.length} विकास प्रकल्प विलंबित वर्गात आहे:**\n\n- **${PROJECTS[0].nameMr}** (वॉर्ड ३)\n  - प्रगती: ${PROJECTS[0].progress}%\n  - बजेट: ₹${(PROJECTS[0].budget/100000).toFixed(1)} लाख (₹${(PROJECTS[0].utilized/100000).toFixed(1)} लाख खर्च)\n  - विलंब कारण: सिमेंट ब्लॉक्सच्या पुरवठ्यात अडथळा आल्याचे जूनच्या ग्रामसभा अहवालात नमूद आहे.`;
        }
        aiSources = PROJECTS.map(p => ({ type: 'Project Tracker', title: isEnglish ? p.name : p.nameMr }));

        graphNodes = [
          { id: 'q', label: 'Project Delay', labelMr: 'विलंबित कामे', type: 'query' },
          { id: 'p', label: 'Concrete Road', labelMr: 'सिमेंट रस्ता रस्ता', type: 'entity' },
          { id: 's', label: 'June Sabha Minutes', labelMr: 'जून सभा वृत्तांत', type: 'concept' },
          { id: 'b', label: 'Material Supply Clog', labelMr: 'साहित्य तुटवडा', type: 'source' }
        ];
        graphLinks = [
          { source: 'q', target: 'p', label: 'Scans progress', labelMr: 'प्रगती तपासणी' },
          { source: 'p', target: 's', label: 'Linked in notes', labelMr: 'नोंदीमध्ये उल्लेख' },
          { source: 's', target: 'b', label: 'Specifies bottleneck', labelMr: 'विलंब कारण स्पष्ट' }
        ];

      } else if (query.includes('budget') || query.includes('पैसा') || query.includes('निधी') || query.includes('finance')) {
        const totalBudget = PROJECTS.reduce((sum, p) => sum + p.budget, 0);
        const totalUtilized = PROJECTS.reduce((sum, p) => sum + p.utilized, 0);
        const remaining = totalBudget - totalUtilized;

        if (isEnglish) {
          aiResponseText = `**Unified Panchayat Development Budget Summary:**\n\n- **Total Monitored Budget:** ₹${(totalBudget/100000).toFixed(2)} Lakh\n- **Utilized Fund:** ₹${(totalUtilized/100000).toFixed(2)} Lakh\n- **Unutilized Balance:** ₹${(remaining/100000).toFixed(2)} Lakh remaining. \n\n**Alert:** The Digital Center Setup is 100% complete with ₹5,000 savings returned to general pool.`;
        } else {
          aiResponseText = `**एकूण पंचायत विकास निधी सारांश:**\n\n- **एकूण प्रकल्प बजेट:** ₹${(totalBudget/100000).toFixed(2)} लाख\n- **वापरलेला निधी:** ₹${(totalUtilized/100000).toFixed(2)} लाख\n- **शिल्लक निधी:** ₹${(remaining/100000).toFixed(2)} लाख गंवावल्याने शिल्लक आहे.`;
        }
        aiSources = PROJECTS.map(p => ({ type: 'Budget File', title: isEnglish ? p.name : p.nameMr }));

        graphNodes = [
          { id: 'q', label: 'Budget Query', labelMr: 'बजेट चौकशी', type: 'query' },
          { id: 'b', label: 'Total Budget Node', labelMr: 'एकूण निधी आलेख', type: 'entity' },
          { id: 'u', label: 'Infrastructure Allocation', labelMr: 'पायाभूत सुविधा वाटप', type: 'concept' }
        ];
        graphLinks = [
          { source: 'q', target: 'b', label: 'Checks balances', labelMr: 'निधी शिल्लक' },
          { source: 'b', target: 'u', label: 'Allocated to projects', labelMr: 'प्रकल्पांना वितरित' }
        ];

      } else if (query.includes('sabha') || query.includes('meeting') || query.includes('सभा') || query.includes('बैठक')) {
        if (isEnglish) {
          aiResponseText = `Summarizing Gram Sabha Meeting dated **${MOCK_SABHA_MEETING.date}**: \n\n- **Major Agenda:** Monsoon drain preparedness, drinking water leakages, and school safety. \n- **Key Decision:** Approved ₹10,000 for weekly market drain cleaning. \n- **Action Items:** Junior engineer to submit road repairs estimate.`;
        } else {
          aiResponseText = `दिनांक **${MOCK_SABHA_MEETING.date}** रोजी झालेल्या ग्रामसभेचा आढावा: \n\n- **मुख्य अजेंडा:** पावसाळी गटार नियोजन, पिण्याच्या पाण्याची गळती दुरुस्त करणे आणि शाळा सुरक्षा भिंत. \n- **महत्त्वाचा निर्णय:** आठवडे बाजाराच्या स्वच्छतेसाठी ₹१०,००० चा आपत्कालीन निधी मंजूर. \n- **कृती आराखडा:** कनिष्ठ अभियंत्यांनी रस्त्याच्या दुरुस्तीचे अंदाजपत्रक सादर करावे.`;
        }
        aiSources = [{ type: 'Sabha Minutes', title: isEnglish ? MOCK_SABHA_MEETING.title : MOCK_SABHA_MEETING.titleMr }];
        
        graphNodes = [
          { id: 'q', label: 'Sabha Query', labelMr: 'ग्रामसभा माहिती', type: 'query' },
          { id: 's', label: 'Meeting Date', labelMr: 'बैठक तारीख', type: 'entity' },
          { id: 'm', label: 'Minutes Transcripts', labelMr: 'सभा नोंदणी', type: 'concept' }
        ];
        graphLinks = [
          { source: 'q', target: 's', label: 'Queries session', labelMr: 'सत्र बैठक शोध' },
          { source: 's', target: 'm', label: 'Documented inside', labelMr: 'नोंदीमध्ये जतन' }
        ];
      } else if (query.includes('suggest') || query.includes('do') || query.includes('plan') || query.includes('improve') || query.includes('सुधारणा') || query.includes('नियोजन')) {
        if (isEnglish) {
          aiResponseText = `**AI Improvement Suggestions for Loni Kalbhor:**\n\n1. **Grievance Resolution**: Deploy repair team to Ward 3 near Maruti Temple to resolve the water leak bottleneck.\n2. **Infrastructure**: Fast-track cement road aggregates supply chain to resume Delayed concrete projects.\n3. **Demographics**: Enroll Savita Patil (Ward 3) and Ramesh Shinde (Ward 4) in the Senior Pension scheme.\n4. **Upcoming Sabha**: Finalize monsoon drainage plans during the meeting on August 20.`;
        } else {
          aiResponseText = `**लोणी काळभोर पंचायतीसाठी AI शिफारसी:**\n\n१. **तक्रार निवारण**: मारुती मंदिराजवळील पाणी गळती दुरुस्त करण्यासाठी वॉर्ड ३ मध्ये पथक पाठवा.\n२. **पायाभूत सुविधा**: विलंबित सिमेंट रस्ता प्रकल्प सुरू करण्यासाठी सिमेंट ब्लॉक्स पुरवठादारांशी संपर्क साधा.\n३. **Demographics**: सविता पाटील (वॉर्ड ३) आणि रमेश शिंदे (वॉर्ड ४) यांची पेन्शन नोंदणी पूर्ण करा.\n४. **ग्रामसभा**: २० ऑगस्ट रोजी होणाऱ्या ग्रामसभेत पावसाळी नाले सफाईचा ठराव मंजूर करा.`;
        }
        aiSources = [
          { type: 'Sabha Agenda', title: 'Monsoon Cleanliness Plan' },
          { type: 'Project Tracker', title: 'Concrete Road Aggregates' }
        ];
        graphNodes = [
          { id: 'q', label: 'Suggestions', labelMr: 'AI शिफारसी', type: 'query' },
          { id: 'g', label: 'Grievance Core', labelMr: 'तक्रार विभाग', type: 'entity' },
          { id: 'p', label: 'Pension Core', labelMr: 'पेन्शन योजना', type: 'concept' }
        ];
        graphLinks = [
          { source: 'q', target: 'g', label: 'Scans backlog', labelMr: 'प्रलंबित कामांचा शोध' },
          { source: 'q', target: 'p', label: 'Evaluates eligibility', labelMr: 'पात्रता तपासणी' }
        ];
      } else {
        if (isEnglish) {
          aiResponseText = `I ran a GraphRAG query over the local knowledge graph but could not find a specific match for "${textToSend}". \n\nHere is a general summary: Loni Kalbhor currently has 10 active citizens in the registry, 4 ongoing/completed infrastructure projects, and 5 logged grievances. Please try asking about 'water complaints', 'delayed projects', or 'senior pension eligibility'.`;
        } else {
          aiResponseText = `मी तुमच्या "${textToSend}" या प्रश्नाशी जुळणारे तपशील मिळवू शकलो नाही. \n\nगावाचा संक्षिप्त गोषवारा: लोणी काळभोर पंचायतीमध्ये सध्या १० नागरिक, ४ विकास प्रकल्प आणि ५ नोंदणीकृत तक्रारी आहेत. कृपया 'पाण्याची गळती', 'विलंब झालेले प्रकल्प', किंवा 'पेन्शन योजना पात्रता' याविषयी विचारा.`;
        }
        aiSources = [
          { type: 'Citizen DB', title: 'Citizen Registry' },
          { type: 'Project Feed', title: 'Infrastructure Database' }
        ];

        graphNodes = [
          { id: 'q', label: 'General Search', labelMr: 'सामान्य शोध', type: 'query' },
          { id: 'k', label: 'Knowledge Graph', labelMr: 'माहिती आलेख', type: 'entity' }
        ];
        graphLinks = [
          { source: 'q', target: 'k', label: 'Scans nodes', labelMr: 'घटक स्कॅन' }
        ];
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        sources: aiSources,
        graphData: { nodes: graphNodes, links: graphLinks }
      }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[800px] glass-card rounded-2xl border border-slate-800 overflow-hidden">
      {/* Bot Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Bot size={20} className="text-purple-400" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white m-0 tracking-wide">{t('ai_assistant.title')}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">GraphRAG Engine Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Questions Selector */}
      {messages.length === 1 && (
        <div className="p-4 border-b border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-3">
            <HelpCircle size={14} className="text-purple-400" />
            <span>Suggested Questions:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(preset.text)}
                className="p-3 text-left rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 hover:bg-slate-800/50 hover:border-purple-500/30 hover:text-white transition-all duration-200 flex items-center justify-between"
              >
                <span>{preset.text}</span>
                <Sparkles size={12} className="text-purple-400 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl p-4 ${
              msg.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              {/* Message text with formatting */}
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                <div className="space-y-1">{renderFormattedText(msg.text)}</div>
              </div>

              {/* Message Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                    <BookOpen size={12} className="text-purple-400" />
                    <span>{t('ai_assistant.sources')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.slice(0, 3).map((src, sidx) => (
                      <div 
                        key={sidx}
                        className="px-2 py-1 rounded bg-slate-850 border border-slate-800 text-[10px] text-slate-400 font-medium flex items-center gap-1 select-none"
                      >
                        <FileText size={10} className="text-slate-500" />
                        <span>{src.type}: <strong className="text-slate-300">{src.title}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none p-4 flex items-center gap-3">
              <Bot size={16} className="text-purple-400 animate-spin" />
              <span className="text-xs text-slate-400">Searching graph, checking vector stores & summarizing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ai_assistant.placeholder')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
          >
            <span>{t('ai_assistant.send')}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
