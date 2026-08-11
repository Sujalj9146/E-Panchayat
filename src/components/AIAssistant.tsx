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

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newMessages: Message[] = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Simulate GraphRAG search response after short timeout
    setTimeout(() => {
      let aiResponseText = "";
      let aiSources: { type: string; title: string }[] = [];

      const query = textToSend.toLowerCase();
      const isEnglish = i18n.language === 'en';

      if (query.includes('grievance') || query.includes('तक्रार') || query.includes('ward') || query.includes('वॉर्ड')) {
        // Grievances search
        const active = GRIEVANCES.filter(g => g.status !== 'Resolved');
        const ward3 = GRIEVANCES.filter(g => g.ward === 3);
        
        if (isEnglish) {
          aiResponseText = `Based on the latest database indexing, there are currently ${active.length} pending/in-progress grievances in the village. 
          \n**Ward 3 has the highest load with ${ward3.length} unresolved cases** (specifically: "${GRIEVANCES[0].title}" and "${GRIEVANCES[2].title}"). 
          \n**AI Departmental Routing:** The Sanitation cell and Water Works department are primary bottlenecks due to Market Square drainage clogging.`;
        } else {
          aiResponseText = `ताज्या अहवालानुसार, गावात सध्या एकूण ${active.length} तक्रारी प्रलंबित किंवा प्रगतीपथावर आहेत.
          \n**वॉर्ड ३ मध्ये सर्वाधिक लोड असून तेथे ${ward3.length} प्रलंबित प्रकरणे आहेत** (उदा: "${GRIEVANCES[0].titleMr}" आणि "${GRIEVANCES[2].titleMr}").
          \n**AI शिफारस:** स्वच्छता कक्ष आणि पाणी पुरवठा विभागाला या तक्रारी वर्ग करण्यात आल्या आहेत.`;
        }

        aiSources = GRIEVANCES.map(g => ({ type: 'Grievance Record', title: isEnglish ? g.title : g.titleMr }));

      } else if (query.includes('senior') || query.includes('pension') || query.includes('पेन्शन') || query.includes('वृद्ध') || query.includes('ज्येष्ठ')) {
        // Senior citizen filter
        const eligible = CITIZENS.filter(c => c.age >= 60 && c.income <= 100000);
        
        if (isEnglish) {
          aiResponseText = `According to the demographics dataset, we found ${eligible.length} citizens eligible for the Senior Citizen Pension scheme who are not yet fully enrolled. 
          \nSpecifically in **Ward 3**, citizen **Savita Patil** (61 yrs, household income: ₹0) is recommended. 
          \nIn **Ward 4**, we recommend **Ramesh Shinde** (72 yrs, income: ₹38,000) and **Lata Shinde** (65 yrs, income: ₹12,000). All documents are verified under family tree ID fam_shinde.`;
        } else {
          aiResponseText = `नागरिक डेटा विश्लेषणानुसार, आपल्याला ज्येष्ठ नागरिक पेन्शन योजनेसाठी ${eligible.length} पात्र नागरिक मिळाले आहेत ज्यांची अद्याप नोंदणी झालेली नाही.
          \nविशेषतः **वॉर्ड ३** मधील रहिवासी **सविता पाटील** (वय ६१, उत्पन्न: ₹०) यांना शिफारस करण्यात येत आहे.
          \n**वॉर्ड ४** मधील **रमेश शिंदे** (वय ७२, उत्पन्न: ₹३८,०००) आणि **लता शिंदे** (वय ६५, उत्पन्न: ₹१२,०००) पात्र आहेत.`;
        }

        aiSources = eligible.map(c => ({ type: 'Citizen Profile', title: isEnglish ? c.name : c.nameMr }));

      } else if (query.includes('delay') || query.includes('project') || query.includes('प्रकल्प') || query.includes('काम')) {
        // Delayed projects
        const delayed = PROJECTS.filter(p => p.status === 'Delayed');
        
        if (isEnglish) {
          aiResponseText = `Analyzing Panchayat infrastructure trackers: 
          \n**${delayed.length} project is classified as Delayed:** 
          \n- **${PROJECTS[0].name}** (Ward 3)
            - Progress: ${PROJECTS[0].progress}%
            - Budget: ₹${(PROJECTS[0].budget/100000).toFixed(1)} Lakh (₹${(PROJECTS[0].utilized/100000).toFixed(1)} Lakh utilized)
            - Reason: Supply chain issues for aggregate cement tiles reported in June Gram Sabha notes.`;
        } else {
          aiResponseText = `प्रकल्प देखरेख अहवालानुसार:
          \n**${delayed.length} विकास प्रकल्प विलंबित वर्गात आहे:**
          \n- **${PROJECTS[0].nameMr}** (वॉर्ड ३)
            - प्रगती: ${PROJECTS[0].progress}%
            - बजेट: ₹${(PROJECTS[0].budget/100000).toFixed(1)} लाख (₹${(PROJECTS[0].utilized/100000).toFixed(1)} लाख खर्च)
            - विलंब कारण: सिमेंट ब्लॉक्सच्या पुरवठ्यात अडथळा आल्याचे जूनच्या ग्रामसभा अहवालात नमूद आहे.`;
        }

        aiSources = PROJECTS.map(p => ({ type: 'Project Tracker', title: isEnglish ? p.name : p.nameMr }));

      } else if (query.includes('budget') || query.includes('पैसा') || query.includes('निधी') || query.includes('finance')) {
        // Budget query
        const totalBudget = PROJECTS.reduce((sum, p) => sum + p.budget, 0);
        const totalUtilized = PROJECTS.reduce((sum, p) => sum + p.utilized, 0);
        const remaining = totalBudget - totalUtilized;

        if (isEnglish) {
          aiResponseText = `**Unified Panchayat Development Budget Summary:**
          \n- **Total Monitored Budget:** ₹${(totalBudget/100000).toFixed(2)} Lakh
          \n- **Utilized Fund:** ₹${(totalUtilized/100000).toFixed(2)} Lakh
          \n- **Unutilized Balance:** ₹${(remaining/100000).toFixed(2)} Lakh remaining.
          \n**Alert:** The Digital Center Setup is 100% complete with ₹5,000 savings returned to general pool.`;
        } else {
          aiResponseText = `**एकूण पंचायत विकास निधी सारांश:**
          \n- **एकूण प्रकल्प बजेट:** ₹${(totalBudget/100000).toFixed(2)} लाख
          \n- **वापरलेला निधी:** ₹${(totalUtilized/100000).toFixed(2)} लाख
          \n- **शिल्लक निधी:** ₹${(remaining/100000).toFixed(2)} लाख शिल्लक आहे.
          \n**माहिती:** डिजिटल सेवा केंद्र प्रकल्प १००% पूर्ण झाला असून ₹५,००० ची बचत झाली आहे.`;
        }

        aiSources = PROJECTS.map(p => ({ type: 'Budget File', title: isEnglish ? p.name : p.nameMr }));

      } else if (query.includes('sabha') || query.includes('meeting') || query.includes('सभा') || query.includes('बैठक')) {
        // Gram Sabha summary
        if (isEnglish) {
          aiResponseText = `Summarizing Gram Sabha Meeting dated **${MOCK_SABHA_MEETING.date}**:
          \n- **Major Agenda:** Monsoon drain preparedness, drinking water leakages, and school safety.
          \n- **Key Decision:** Approved ₹10,000 for weekly market drain cleaning.
          \n- **Action Items:** Junior engineer to submit road repairs estimate.`;
        } else {
          aiResponseText = `दिनांक **${MOCK_SABHA_MEETING.date}** रोजी झालेल्या ग्रामसभेचा आढावा:
          \n- **मुख्य अजेंडा:** पावसाळी गटार नियोजन, पिण्याच्या पाण्याची गळती दुरुस्त करणे आणि शाळा सुरक्षा भिंत.
          \n- **महत्त्वाचा निर्णय:** आठवडे बाजाराच्या स्वच्छतेसाठी ₹१०,००० चा आपत्कालीन निधी मंजूर.
          \n- **कृती आराखडा:** कनिष्ठ अभियंत्यांनी रस्त्याच्या दुरुस्तीचे अंदाजपत्रक सादर करावे.`;
        }

        aiSources = [{ type: 'Sabha Minutes', title: isEnglish ? MOCK_SABHA_MEETING.title : MOCK_SABHA_MEETING.titleMr }];

      } else {
        // Default response
        if (isEnglish) {
          aiResponseText = `I ran a GraphRAG query over the local knowledge graph but could not find a specific match for "${textToSend}". 
          \nHere is a general summary: Khed Shivapur currently has 10 active citizens in the registry, 4 ongoing/completed infrastructure projects, and 5 logged grievances. Please try asking about 'water complaints', 'delayed projects', or 'senior pension eligibility'.`;
        } else {
          aiResponseText = `मी तुमच्या "${textToSend}" या प्रश्नाशी जुळणारे तपशील मिळवू शकलो नाही. 
          \nगावाचा संक्षिप्त गोषवारा: खेड शिवापूर पंचायतीमध्ये सध्या १० नागरिक, ४ विकास प्रकल्प आणि ५ नोंदणीकृत तक्रारी आहेत. कृपया 'पाण्याची गळती', 'विलंब झालेले प्रकल्प', किंवा 'पेन्शन योजना पात्रता' याविषयी विचारा.`;
        }

        aiSources = [
          { type: 'Citizen DB', title: 'Citizen Registry' },
          { type: 'Project Feed', title: 'Infrastructure Database' }
        ];
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        sources: aiSources
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
                {msg.text}
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

              {/* Message GraphRAG Network Visualizer */}
              {msg.graphData && msg.graphData.nodes.length > 0 && (() => {
                const nodes = msg.graphData.nodes;
                const links = msg.graphData.links;
                const isEnglish = i18n.language === 'en';

                // Positional mapping
                const otherNodes = nodes.filter((n: any) => n.type !== 'query');
                const queryNode = nodes.find((n: any) => n.type === 'query');

                const coords: { [key: string]: { x: number; y: number } } = {};
                if (queryNode) {
                  coords[queryNode.id] = { x: 150, y: 100 };
                }
                otherNodes.forEach((node: any, nIdx: number) => {
                  const angle = (nIdx * 2 * Math.PI) / Math.max(1, otherNodes.length);
                  coords[node.id] = {
                    x: 150 + 80 * Math.cos(angle),
                    y: 100 + 65 * Math.sin(angle)
                  };
                });

                return (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                      <Sparkles size={12} className="text-purple-400 animate-pulse" />
                      <span>{isEnglish ? 'Knowledge Graph Path (GraphRAG)' : 'माहिती आलेख पथ (GraphRAG)'}</span>
                    </div>

                    <svg viewBox="0 0 300 200" className="w-full max-w-[340px] mx-auto border border-slate-800 bg-slate-950 rounded-xl p-2 select-none shadow-md">
                      <defs>
                        <marker id="arrow-assistant" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 10 5 L 0 8 z" fill="#c084fc" />
                        </marker>
                      </defs>

                      {/* Render links */}
                      {links.map((link: any, lIdx: number) => {
                        const from = coords[link.source] || { x: 150, y: 100 };
                        const to = coords[link.target] || { x: 150, y: 100 };
                        return (
                          <g key={lIdx}>
                            <line
                              x1={from.x}
                              y1={from.y}
                              x2={to.x}
                              y2={to.y}
                              stroke="#c084fc"
                              strokeWidth="1.2"
                              strokeDasharray="4 2"
                              markerEnd="url(#arrow-assistant)"
                              className="opacity-70"
                            />
                            <text
                              x={(from.x + to.x) / 2}
                              y={(from.y + to.y) / 2 - 3}
                              fill="#f59e0b"
                              fontSize="6.5"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {isEnglish ? link.label : link.labelMr}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render nodes */}
                      {nodes.map((node: any) => {
                        const pt = coords[node.id] || { x: 150, y: 100 };
                        const isQuery = node.type === 'query';
                        const isEntity = node.type === 'entity';
                        const isSource = node.type === 'source';

                        let fill = "#1e293b";
                        let stroke = "#475569";
                        let textFill = "#f8fafc";
                        if (isQuery) {
                          fill = "#4f46e5";
                          stroke = "#a5b4fc";
                        } else if (isEntity) {
                          fill = "#065f46";
                          stroke = "#34d399";
                        } else if (isSource) {
                          fill = "#701a75";
                          stroke = "#f472b6";
                        }

                        return (
                          <g key={node.id}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isQuery ? 14 : 12}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth="1.5"
                            />
                            <text
                              x={pt.x}
                              y={pt.y + 2.5}
                              textAnchor="middle"
                              fontSize="6"
                              fontWeight="black"
                              fill={textFill}
                            >
                              {isQuery ? "QUERY" : (isEnglish ? node.type.toUpperCase().substring(0,4) : (node.type === 'entity' ? 'घटक' : 'स्रोत'))}
                            </text>
                            <text
                              x={pt.x}
                              y={pt.y + (isQuery ? 22 : 18)}
                              textAnchor="middle"
                              fontSize="7"
                              fontWeight="bold"
                              fill="#e2e8f0"
                            >
                              {isEnglish ? node.label : node.labelMr}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
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
