import { savePersistentData } from '../lib/persistence';
import { callGeminiAPI } from '../lib/gemini';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Plus, 
  Bot, 
  Send, 
  Sparkles,
  FolderOpen,
  Check,
  X,
  ExternalLink,
  FileText
} from 'lucide-react';
import { SCHEMES, GRIEVANCES, MAP_CENTER, CITIZEN_DOCUMENTS, CITIZENS } from '../data/mockData';
import type { Grievance } from '../data/mockData';


interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  sources?: { type: string; title: string }[];
  graphData?: {
    nodes: { id: string; label: string; labelMr: string; type: string }[];
    links: { source: string; target: string; label: string; labelMr: string }[];
  };
}

interface CitizenPortalProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  citizenId: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const renderFormattedText = (text: string) => {
  return text.split('\n').map((line, lIdx) => {
    const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
    const cleanLine = isBullet ? line.trim().replace(/^[-*]\s+/, '') : line;

    const parts = cleanLine.split('**');
    const lineContent = parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return <strong key={pIdx} className="font-extrabold text-govblue-900">{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lIdx} className="ml-4 list-disc my-1 text-slate-700">
          {lineContent}
        </li>
      );
    }

    return (
      <p key={lIdx} className="my-1 text-slate-700 min-h-[1em]">
        {lineContent}
      </p>
    );
  });
};

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ 
  currentTab, 
  setCurrentTab,
  citizenId
}) => {
  const { i18n } = useTranslation();


  const activeCitizen = useMemo(() => {
    const matched = CITIZENS.find(c => c.id === citizenId);
    if (matched) return matched;
    const matchByName = CITIZENS.find(c => c.id.toLowerCase() === citizenId.toLowerCase() || c.name.toLowerCase() === citizenId.toLowerCase());
    return matchByName || CITIZENS[0];
  }, [citizenId, CITIZENS]);
  
  // Grievances filed by the citizen in this session
  const [myGrievances, setMyGrievances] = useState<Grievance[]>(GRIEVANCES.slice(0, 2));
  const [activeGrievanceId, setActiveGrievanceId] = useState<string | null>(GRIEVANCES[0].id);

  // Scheme eligibility inputs
  const [ageInput, setAgeInput] = useState<string>(activeCitizen.age.toString());
  const [incomeInput, setIncomeInput] = useState<string>(activeCitizen.income.toString());
  const [genderInput, setGenderInput] = useState<'Male' | 'Female'>(activeCitizen.gender === 'Female' ? 'Female' : 'Male');
  const [farmerInput, setFarmerInput] = useState<boolean>(activeCitizen.occupation.toLowerCase().includes('farmer') || activeCitizen.occupationMr.includes('शेतकरी'));
  const [eligibleSchemesList, setEligibleSchemesList] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);

  // Document locker variables
  const [citizenDocs, setCitizenDocs] = useState(CITIZEN_DOCUMENTS);
  const [docTypeInput, setDocTypeInput] = useState('Income Certificate');
  const [fileNameInput, setFileNameInput] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const filteredDocs = useMemo(() => {
    return citizenDocs.filter(doc => doc.citizenName.toLowerCase() === activeCitizen.name.toLowerCase());
  }, [citizenDocs, activeCitizen]);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: i18n.language === 'en' 
        ? "Hello! I am your Village Citizen Helper AI. You can ask me how to get certificates, how to apply for schemes, or how to submit complaints. Ask me anything!"
        : "नमस्कार! मी आपला ग्राम नागरिक सहाय्यक एआय आहे. आपण माझ्याकडे प्रमाणपत्रे मिळवणे, योजनेसाठी अर्ज करणे किंवा तक्रार नोंदवणे याविषयी विचारू शकता. विचारा!"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const activeGrievance = useMemo(() => {
    return myGrievances.find(g => g.id === activeGrievanceId) || null;
  }, [myGrievances, activeGrievanceId]);

  // Form Fields for new grievance
  const [grvTitle, setGrvTitle] = useState('');
  const [grvDesc, setGrvDesc] = useState('');
  const [grvWard, setGrvWard] = useState(1);

  // Document upload handler
  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNameInput) return;

    const newDoc = {
      id: `doc_${Date.now().toString().substring(8)}`,
      citizenName: activeCitizen.name, // active logged-in citizen name
      docType: docTypeInput,
      docTypeMr: docTypeInput === 'Income Certificate' ? 'उत्पन्नाचा दाखला' : docTypeInput === 'Aadhaar Card' ? 'आधार कार्ड' : '७/१२ उतारा',
      fileName: fileNameInput,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Pending Verification' as any,
      statusMr: 'पडताळणी प्रलंबित'
    };
    
    // Add to the front of shared data array
    CITIZEN_DOCUMENTS.unshift(newDoc);
    setCitizenDocs([...CITIZEN_DOCUMENTS]);
    savePersistentData('panchayat_citizen_documents', CITIZEN_DOCUMENTS);
    setFileNameInput('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  // Scheme calculator evaluator returning ALL schemes with explanations
  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    const age = Number(ageInput) || 0;
    const income = Number(incomeInput) || 0;

    const matches = SCHEMES.map(s => {
      const reasons: string[] = [];
      const reasonsMr: string[] = [];

      // Age Check
      if (s.id === 'scheme_sr_citizen' && age < s.minAge) {
        reasons.push(`Age is ${age}, but must be at least ${s.minAge} years.`);
        reasonsMr.push(`वय ${age} आहे, पण किमान ${s.minAge} वर्षे असणे आवश्यक आहे.`);
      }

      // Income Check
      if (income > s.maxIncome) {
        reasons.push(`Annual income of ₹${income.toLocaleString()} exceeds the limit of ₹${s.maxIncome.toLocaleString()}.`);
        reasonsMr.push(`वार्षिक उत्पन्न ₹${income.toLocaleString()} हे मर्यादा ₹${s.maxIncome.toLocaleString()} पेक्षा जास्त आहे.`);
      }

      // Gender Check
      if (s.genderRestriction && s.genderRestriction !== genderInput) {
        reasons.push(`Restricted to ${s.genderRestriction} applicants.`);
        reasonsMr.push(`केवळ ${s.genderRestriction === 'Female' ? 'महिला' : 'पुरुष'} अर्जदारांसाठी मर्यादित.`);
      }

      // Farmer Check
      if (s.id === 'scheme_krishi_sinchan' && !farmerInput) {
        reasons.push('Must be a registered farmer.');
        reasonsMr.push('नोंदणीकृत शेतकरी असणे आवश्यक आहे.');
      }

      const isEligible = reasons.length === 0;

      // Simulated form directions
      let formHelp = s.formUrl 
        ? `Apply online via official portal`
        : 'Submit documents at Panchayat Digital Center (Ward 2)';
      let formHelpMr = s.formUrl
        ? `अधिकृत पोर्टलवर ऑनलाईन अर्ज करा`
        : 'ग्रामपंचायत डिजिटल सेवा केंद्र (वॉर्ड २) येथे कागदपत्रे सादर करा';

      if (s.id === 'scheme_krishi_sinchan') {
        formHelp = 'Apply online via MahaDBT Farmer Portal or visit Ward 4 Agriculture Cell';
        formHelpMr = 'महाडीबीटी शेतकरी पोर्टलवर ऑनलाईन अर्ज करा किंवा वॉर्ड ४ मधील कृषी विभाग';
      } else if (s.id === 'scheme_pm_awas') {
        formHelp = 'Submit physical application form to Gram Sevak Desk (Room 3)';
        formHelpMr = 'ग्रामसेवक कक्ष (खोली ३) कडे प्रत्यक्ष अर्ज सादर करा';
      }

      return {
        ...s,
        isEligible,
        reasons,
        reasonsMr,
        formHelp,
        formHelpMr
      };
    });

    setEligibleSchemesList(matches);
    setChecked(true);
  };

  // Submit grievance as citizen
  const handleCitizenSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grvTitle.trim() || !grvDesc.trim()) return;

    const text = (grvTitle + ' ' + grvDesc).toLowerCase();
    let cat: Grievance['category'] = 'Other';
    let catMr = 'इतर';
    let dept = 'General Administration Cell';
    let deptMr = 'सामान्य प्रशासन कक्ष';

    if (text.includes('water') || text.includes('paani') || text.includes('पाणी')) {
      cat = 'Water';
      catMr = 'पाणी पुरवठा';
      dept = 'Water Supply and Sanitation Department';
      deptMr = 'पाणी पुरवठा आणि स्वच्छता विभाग';
    } else if (text.includes('road') || text.includes('khadde') || text.includes('रस्ता')) {
      cat = 'Roads';
      catMr = 'रस्ते / दळणवळण';
      dept = 'Public Works Department (Rural Roads)';
      deptMr = 'सार्वजनिक बांधकाम विभाग (ग्रामीण रस्ते)';
    }

    const newGrv: Grievance = {
      id: `grv_cit_${Date.now().toString().substring(8)}`,
      title: grvTitle,
      titleMr: grvTitle,
      category: cat,
      categoryMr: catMr,
      ward: grvWard,
      priority: 'Medium',
      priorityMr: 'मध्यम',
      status: 'Pending',
      statusMr: 'प्रलंबित',
      submittedDate: new Date().toISOString().split('T')[0],
      description: grvDesc,
      descriptionMr: grvDesc,
      deptName: dept,
      deptNameMr: deptMr,
      coordinates: [
        MAP_CENTER[0] + (Math.random() - 0.5) * 0.008,
        MAP_CENTER[1] + (Math.random() - 0.5) * 0.008
      ]
    };

    setMyGrievances([newGrv, ...myGrievances]);
    GRIEVANCES.unshift(newGrv); // Sync with shared database
    savePersistentData('panchayat_grievances', GRIEVANCES);
    setActiveGrievanceId(newGrv.id);
    
    setGrvTitle('');
    setGrvDesc('');
    setGrvWard(1);
  };

  // AI chat responder for citizen
  
const getGraphRAGResponse = (queryText: string, isEnglish: boolean, activeCitizenName: string, activeDocsList: any[]) => {
  const query = queryText.toLowerCase();
  let aiText = "";
  let aiSources: { type: string; title: string }[] = [];
  let graphNodes: { id: string; label: string; labelMr: string; type: string }[] = [];
  let graphLinks: { source: string; target: string; label: string; labelMr: string }[] = [];

  if (query.includes('locker') || query.includes('document') || query.includes('certificate') || query.includes('दाखला') || query.includes('लॉकर') || query.includes('प्रमाणपत्र') || query.includes('७/१२') || query.includes('7/12') || query.includes('aadhaar') || query.includes('आधार') || query.includes('income') || query.includes('उत्पन्न')) {
    // Locker / Certificates status scan
    const matchedDocs = activeDocsList.filter(d => d.citizenName.toLowerCase() === activeCitizenName.toLowerCase());
    
    if (matchedDocs.length > 0) {
      const docSummaries = matchedDocs.map(d => `${isEnglish ? d.docType : d.docTypeMr} ('${d.fileName}': ${isEnglish ? d.status : d.statusMr})`).join(", ");
      aiText = isEnglish 
        ? `GraphRAG scan complete. I retrieved ${matchedDocs.length} files stored under your profile: ${docSummaries}. You can upload new certificates in the locker tab on the left for immediate officer audit.`
        : `GraphRAG स्कॅन पूर्ण. मला आपल्या नावाखाली जतन केलेल्या ${matchedDocs.length} फाईल्स मिळाल्या: ${docSummaries}. आपण डाव्या बाजूला लॉकर टॅबमध्ये नवीन दस्तऐवज अपलोड करू शकता.`;
      
      aiSources = matchedDocs.map(d => ({ type: 'Digital Locker', title: d.fileName }));
    } else {
      aiText = isEnglish
        ? "I scanned your digital locker vault but did not find any active documents uploaded yet. Please use the file selector on the locker screen to submit your Aadhaar, Income Certificate, or Land 7/12 Extract for officer verification."
        : "मला आपल्या लॉकर खात्यामध्ये कोणतेही दस्तऐवज आढळले नाहीत. कृपया आपले आधार कार्ड, उत्पन्नाचा दाखला किंवा ७/१२ उतारा अपलोड करा जेणेकरून अधिकारी त्याची पडताळणी करतील.";
      
      aiSources = [{ type: 'Database Vault', title: 'Empty Locker' }];
    }

    graphNodes = [
      { id: 'q', label: 'Locker Inquiry', labelMr: 'लॉकर चौकशी', type: 'query' },
      { id: 'c', label: activeCitizenName, labelMr: activeCitizenName, type: 'entity' },
      { id: 'l', label: 'Secure Locker', labelMr: 'सुरक्षित लॉकर', type: 'concept' },
      { id: 'd', label: matchedDocs.length > 0 ? matchedDocs[0].fileName : 'No File Found', labelMr: matchedDocs.length > 0 ? matchedDocs[0].fileName : 'फाईल आढळली नाही', type: 'source' }
    ];
    graphLinks = [
      { source: 'q', target: 'c', label: 'Queries session user', labelMr: 'सत्र नागरिक शोध' },
      { source: 'c', target: 'l', label: 'Accesses folder', labelMr: 'लॉकर ऍक्सेस' },
      { source: 'l', target: 'd', label: 'Stores file', labelMr: 'दस्तऐवज जतन' }
    ];

  } else if (query.includes('pension') || query.includes('senior') || query.includes('पेन्शन') || query.includes('वृद्ध') || query.includes('ज्येष्ठ') || query.includes('योजना') || query.includes('scheme')) {
    // Senior citizen scheme / generic scheme search
    aiText = isEnglish
      ? "For the Senior Citizen Pension Scheme, candidates must be 60+ years old with annual household income below ₹1,00,000. Verified Aadhaar and Income certificates are mandatory. For online eligible schemes (like Agricultural Pump Subsidy), click the link provided in the Welfare Schemes feed."
      : "ज्येष्ठ नागरिक पेन्शन योजनेसाठी वय ६०+ आणि वार्षिक उत्पन्न ₹१,००,००० पेक्षा कमी असणे आवश्यक आहे. या योजनेसाठी आधार आणि उत्पन्नाचा दाखला देणे बंधनकारक आहे.";
    
    aiSources = [
      { type: 'Scheme Rules', title: 'Senior Citizen Pension Guidelines' },
      { type: 'Central Welfare', title: 'Solar Pump Scheme Specs' }
    ];

    graphNodes = [
      { id: 'q', label: 'Scheme Eligibility', labelMr: 'योजना पात्रता', type: 'query' },
      { id: 's', label: 'Senior Pension', labelMr: 'ज्येष्ठ नागरिक पेन्शन', type: 'entity' },
      { id: 'r', label: 'Income < 1 Lakh', labelMr: 'उत्पन्न < १ लाख', type: 'concept' },
      { id: 'l', label: 'Aadhaar Locker Node', labelMr: 'आधार लॉकर घटक', type: 'source' }
    ];
    graphLinks = [
      { source: 'q', target: 's', label: 'Filters welfare', labelMr: 'योजना फिल्टर' },
      { source: 's', target: 'r', label: 'Applies restriction', labelMr: 'मर्यादा लागू' },
      { source: 'r', target: 'l', label: 'Verified by', labelMr: 'द्वारे पडताळणी' }
    ];

  } else if (query.includes('meeting') || query.includes('sabha') || query.includes('सभा') || query.includes('बैठक')) {
    aiText = isEnglish
      ? "The next Gram Sabha session is scheduled for August 20, 2026, at 11:00 AM in the ZP School Ground. Key agenda items include rain drain preparedness, drinking water pipeline repairs, and caste proof camp setups."
      : "पुढील ग्रामसभा बैठक २० ऑगस्ट २०२६ रोजी सकाळी ११:०० वाजता जि. प. शाळा मैदानावर आयोजित केली आहे. बैठकीमध्ये गटार नियोजन, पिण्याच्या पाण्याची गळती दुरुस्त करणे यावर चर्चा होईल.";
    
    aiSources = [{ type: 'Sabha Schedule', title: 'Sabha Notification Circular 2026-08' }];

    graphNodes = [
      { id: 'q', label: 'Meeting Date', labelMr: 'बैठक वेळ', type: 'query' },
      { id: 'b', label: 'Gram Sabha Body', labelMr: 'ग्रामसभा समिती', type: 'entity' },
      { id: 'e', label: 'ZP School Ground', labelMr: 'शाळा मैदान', type: 'concept' },
      { id: 'd', label: 'Circular 2026-08', labelMr: 'घोषणापत्रक २०२६-०८', type: 'source' }
    ];
    graphLinks = [
      { source: 'q', target: 'b', label: 'Inquires scheduling', labelMr: 'नियोजन शोध' },
      { source: 'b', target: 'd', label: 'Publishes circular', labelMr: 'परिपत्रक प्रसिद्ध' },
      { source: 'd', target: 'e', label: 'Specifies venue', labelMr: 'ठिकाण दर्शवते' }
    ];

  } else if (query.includes('grievance') || query.includes('complaint') || query.includes('water') || query.includes('drainage') || query.includes('leak') || query.includes('तक्रार') || query.includes('गळती') || query.includes('गटार')) {
    aiText = isEnglish
      ? "Sanitation and Water pipeline issues in Ward 3 near Maruti Temple are under investigation. Emergency drain cleanups are approved. If you have a local infrastructure issue, submit a new grievance in the Track Grievances tab."
      : "वॉर्ड ३ मधील मारुती मंदिराजवळ पाणी पुरवठा आणि स्वच्छता कामाची तपासणी सुरू आहे. आपण तक्रार निवारण कक्षामध्ये जाऊन नवीन तक्रार दाखल करू शकता.";
    
    aiSources = [{ type: 'Grievance DB', title: 'Ward 3 Sanitation Issues' }];

    graphNodes = [
      { id: 'q', label: 'Grievance Search', labelMr: 'तक्रार शोध', type: 'query' },
      { id: 'w', label: 'Ward 3 Location', labelMr: 'वॉर्ड ३ ठिकाण', type: 'entity' },
      { id: 'd', label: 'Water Pipeline Clog', labelMr: 'पाईपलाईन बिघाड', type: 'concept' },
      { id: 's', label: 'Sanitation Cell', labelMr: 'स्वच्छता विभाग', type: 'source' }
    ];
    graphLinks = [
      { source: 'q', target: 'w', label: 'Filters by region', labelMr: 'क्षेत्रानुसार फिल्टर' },
      { source: 'w', target: 'd', label: 'Contains leak', labelMr: 'गळतीचे ठिकाण' },
      { source: 'd', target: 's', label: 'Assigned Cell', labelMr: 'नियुक्त विभाग' }
    ];

  } else if (query.includes('suggest') || query.includes('do') || query.includes('plan') || query.includes('improve') || query.includes('सुधारणा') || query.includes('नियोजन')) {
    aiText = isEnglish
      ? "**AI Citizen Suggestions for Loni Kalbhor:**\n\n1. **Submit Locker Files**: Upload your Aadhaar, Income, and 7/12 land papers to let the Gram Sevak approve them for welfare schemes.\n2. **Public Sabhas**: Attend the August 20 Gram Sabha at ZP School Ground to vote on monsoon drain clearances.\n3. **Track Grievances**: File a complaint if you observe pipeline leakages near Maruti Temple."
      : "**लोणी काळभोर नागरिकांसाठी AI शिफारसी:**\n\n१. **दस्तऐवज सबमिट करा**: तुमचे आधार, उत्पन्न आणि ७/१२ उतारा येथे लॉकरमध्ये अपलोड करा जेणेकरून ग्रामसेवक त्याला मान्यता देतील.\n२. **ग्रामसभा**: २० ऑगस्ट रोजी जि. प. शाळा मैदानावर होणाऱ्या बैठकीला उपस्थित रहा.\n३. **तक्रार नोंदणी**: मारुती मंदिराजवळ पाणी गळती आढळल्यास तक्रार दाखल करा.";
    
    aiSources = [
      { type: 'Gram Panchayat Rules', title: 'Citizen Active Participation Guidelines' }
    ];
    graphNodes = [
      { id: 'q', label: 'AI Assistance', labelMr: 'AI मदत', type: 'query' },
      { id: 'l', label: 'Locker Papers', labelMr: 'लॉकर दस्तऐवज', type: 'entity' },
      { id: 's', label: 'Gram Sabha Event', labelMr: 'ग्रामसभा बैठक', type: 'concept' }
    ];
    graphLinks = [
      { source: 'q', target: 'l', label: 'Guides uploads', labelMr: 'अपलोड मार्गदर्शन' },
      { source: 'q', target: 's', label: 'Schedules visit', labelMr: 'भेट नियोजन' }
    ];
  } else {
    aiText = isEnglish
      ? "I ran a semantic scan over the Panchayat knowledge graph but could not find a direct match. Try asking about 'my locker files', 'next meeting date', 'senior citizen pensions', or 'water complaints'."
      : "मी आपल्या प्रश्नाशी संबंधित विशिष्ट घटक शोधू शकलो नाही. कृपया 'माझे लॉकर दस्तऐवज', 'ग्रामसभा बैठक', 'ज्येष्ठ नागरिक योजना', किंवा 'पाण्याची तक्रार' याविषयी विचारून पहा.";
    
    aiSources = [{ type: 'Index DB', title: 'Knowledge Graph Registry' }];

    graphNodes = [
      { id: 'q', label: 'Panchayat AI', labelMr: 'पंचायत AI', type: 'query' },
      { id: 'k', label: 'Knowledge Graph', labelMr: 'ज्ञान आलेख', type: 'entity' },
      { id: 'v', label: 'Vector Store', labelMr: 'वेक्टर डेटाबेस', type: 'concept' }
    ];
    graphLinks = [
      { source: 'q', target: 'k', label: 'Scans entities', labelMr: 'घटक स्कॅन' },
      { source: 'k', target: 'v', label: 'References storage', labelMr: 'संदर्भ डेटाबेस' }
    ];
  }

  return { text: aiText, sources: aiSources, graphData: { nodes: graphNodes, links: graphLinks } };
};

  


  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    const isEnglish = i18n.language === 'en';
    
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const gResult = await callGeminiAPI(userText, GEMINI_API_KEY, isEnglish, false);
        if (gResult) {
          setChatLog(prev => [...prev, {
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
          setChatLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Gemini Cloud call failed, self-healing back to offline GraphRAG engine:", err);
      }
    }

    setTimeout(() => {
      const outcome = getGraphRAGResponse(userText, isEnglish, activeCitizen.name, citizenDocs);
      setChatLog(prev => [...prev, { 
        sender: 'ai', 
        text: outcome.text,
        sources: outcome.sources,
        graphData: outcome.graphData
      }]);
      setChatLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Citizen Banner */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm p-5 border-t-4 border-govgreen">
        <div className="max-w-3xl space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-govgreen/10 text-govgreen text-[10px] font-bold uppercase tracking-wider border border-govgreen/15 select-none">
            <span>Citizen Public Services Access</span>
          </div>
          <h1 className="text-xl font-bold text-govblue-900 m-0">Loni Kalbhor Citizen Facilitation Portal</h1>
          <p className="text-slate-500 text-xs leading-relaxed">
            Welcome to the public-facing citizen kiosk. From this panel, you can check your eligibility for welfare subsidies, file and track public complaints, view contact logs, and chat with our local AI helpdesk.
          </p>
        </div>
      </div>

      {/* Main Grid Render */}
      {currentTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Notice board & contacts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Building size={14} className="text-govnavy" />
              <span>{i18n.language === 'en' ? 'Village Public Information Board' : 'ग्राम सार्वजनिक माहिती फलक'}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-3">
                <Calendar className="text-govsaffron flex-shrink-0" size={16} />
                <div>
                  <strong className="text-slate-800 block">{i18n.language === 'en' ? 'Upcoming Gram Sabha Meeting' : 'आगामी ग्रामसभा बैठक'}</strong>
                  <span className="text-slate-500 block mt-0.5">{i18n.language === 'en' ? 'Date: 20 Aug 2026 • Time: 11:00 AM • Venue: ZP School Ground' : 'तारीख: २० ऑगस्ट २०२६ • वेळ: सकाळी ११:०० • ठिकाण: जि. प. शाळा मैदान'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-3">
                <MapPin className="text-govnavy flex-shrink-0" size={16} />
                <div>
                  <strong className="text-slate-800 block">{i18n.language === 'en' ? 'Digital Certificate Camp' : 'डिजिटल प्रमाणपत्र शिबिर'}</strong>
                  <span className="text-slate-500 block mt-0.5">{i18n.language === 'en' ? 'Apply for income and caste proofs directly this week at Ward 2 Kiosk.' : 'या आठवड्यात वॉर्ड २ मधील केंद्रावर थेट उत्पन्न आणि जातीच्या दाखल्यांसाठी अर्ज करा.'}</span>
                </div>
              </div>
            </div>

            {/* Official Directory */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-700">{i18n.language === 'en' ? 'Official Panchayat Contacts' : 'अधिकृत पंचायत संपर्क यादी'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-150 flex items-center gap-2">
                  <Phone size={12} className="text-govgreen" />
                  <div>
                    <span className="text-slate-800 font-semibold block">{i18n.language === 'en' ? 'Gram Sevak (Village Officer)' : 'ग्रामसेवक (ग्राम अधिकारी)'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">+91 98450 12345</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-150 flex items-center gap-2">
                  <Phone size={12} className="text-govgreen" />
                  <div>
                    <span className="text-slate-800 font-semibold block">{i18n.language === 'en' ? 'Sarpanch (Village Head)' : 'सरपंच (गाव प्रमुख)'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">+91 98450 54321</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core actions entry card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">{i18n.language === 'en' ? 'Available Actions' : 'उपलब्ध सेवा/कृती'}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {i18n.language === 'en' 
                  ? 'Use our digital services to verify your scheme qualification, file complaints about local infrastructure leaks/potholes, or ask our chatbot general questions about panchayat operations.'
                  : 'तुमची योजना पात्रता तपासण्यासाठी, स्थानिक पायाभूत सुविधांच्या गळती/खड्ड्यांबद्दल तक्रारी नोंदवण्यासाठी किंवा आमच्या चॅटबॉटला पंचायतीच्या कामकाजाबद्दल सामान्य प्रश्न विचारण्यासाठी आमच्या डिजिटल सेवांचा वापर करा.'}
              </p>
            </div>
            
            <div className="grid grid-cols-4 gap-2 pt-4">
              <button 
                onClick={() => setCurrentTab('schemes')}
                className="p-2.5 bg-govblue-50 border border-govblue-200 hover:bg-govblue-100 text-govnavy rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <Award size={16} className="mx-auto text-govnavy" />
                <span className="block text-[9px]">{i18n.language === 'en' ? 'Welfare Schemes' : 'कल्याणकारी योजना'}</span>
              </button>
              <button 
                onClick={() => setCurrentTab('grievances')}
                className="p-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <Plus size={16} className="mx-auto text-rose-600" />
                <span className="block text-[9px]">{i18n.language === 'en' ? 'File Grievance' : 'तक्रार नोंदवा'}</span>
              </button>
              <button 
                onClick={() => setCurrentTab('documents')}
                className="p-2.5 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 text-govgreen rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <FolderOpen size={16} className="mx-auto text-govgreen" />
                <span className="block text-[9px]">{i18n.language === 'en' ? 'Digital Locker' : 'डिजिटल लॉकर'}</span>
              </button>
              <button 
                onClick={() => setCurrentTab('ai_assistant')}
                className="p-2.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-govsaffron rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <Bot size={16} className="mx-auto text-govsaffron" />
                <span className="block text-[9px]">{i18n.language === 'en' ? 'AI Helpdesk' : 'एआय मदतनीस'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* schemes check checker view */}
      {currentTab === 'schemes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Eligibility Input Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">{i18n.language === 'en' ? 'Scheme Eligibility Calculator' : 'योजना पात्रता कॅल्क्युलेटर'}</h2>
            
            <form onSubmit={handleCheckEligibility} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Enter Age / वय' : 'वय प्रविष्ट करा / वय'}</label>
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Annual Income (₹) / उत्पन्न' : 'वार्षिक उत्पन्न (₹) / उत्पन्न'}</label>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Gender / लिंग' : 'लिंग / लिंग'}</label>
                <select
                  value={genderInput}
                  onChange={(e) => setGenderInput(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                >
                  <option value="Male">{i18n.language === 'en' ? 'Male / पुरुष' : 'पुरुष'}</option>
                  <option value="Female">{i18n.language === 'en' ? 'Female / महिला' : 'महिला'}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <input
                  type="checkbox"
                  id="farmer_check"
                  checked={farmerInput}
                  onChange={(e) => setFarmerInput(e.target.checked)}
                  className="rounded text-govnavy"
                />
                <label htmlFor="farmer_check" className="text-slate-650 cursor-pointer">
                  {i18n.language === 'en' ? 'I am a Registered Farmer / मी शेतकरी आहे' : 'मी नोंदणीकृत शेतकरी आहे'}
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-govnavy hover:bg-govblue-700 text-white font-bold transition-all shadow"
              >
                {i18n.language === 'en' ? 'Check Qualifying Schemes' : 'पात्र योजना तपासा'}
              </button>
            </form>
          </div>

          {/* Results List with Detailed Disqualifications & Application Form info */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              {i18n.language === 'en' ? 'Matching Welfare Subsidies & Apply Locations' : 'पात्र कल्याणकारी योजना आणि अर्ज करण्याचे ठिकाण'}
            </h2>
            
            {!checked ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                {i18n.language === 'en' 
                  ? 'Fill out the eligibility profile on the left and submit to view your matching government benefits.'
                  : 'पात्र योजना पाहण्यासाठी डाव्या बाजूला माहिती प्रविष्ट करा आणि तपासा.'}
              </div>
            ) : eligibleSchemesList.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs font-medium">
                {i18n.language === 'en' ? 'No schemes matches found for this profile.' : 'या पात्रता तपशीलासाठी कोणतीही योजना आढळली नाही.'}
              </div>
            ) : (
              <div className="space-y-4">
                {eligibleSchemesList.map((scheme, idx) => {
                  const isEligible = scheme.isEligible;
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-lg border flex flex-col justify-between gap-3 ${
                        isEligible 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : 'bg-rose-50/20 border-rose-150'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isEligible ? (
                              <Check className="text-emerald-600 flex-shrink-0" size={16} />
                            ) : (
                              <X className="text-rose-600 flex-shrink-0" size={16} />
                            )}
                            <strong className={`text-sm font-bold block ${isEligible ? 'text-govblue-900' : 'text-slate-700'}`}>
                              {i18n.language === 'en' ? scheme.name : scheme.nameMr}
                            </strong>
                          </div>
                          <p className="text-xs text-slate-500 leading-normal">
                            {i18n.language === 'en' ? scheme.description : scheme.descriptionMr}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            {i18n.language === 'en' ? 'Estimated Benefit' : 'अंदाजित लाभ'}
                          </span>
                          <strong className="text-xs font-black text-govgreen block mt-0.5">
                            {i18n.language === 'en' ? scheme.benefit : scheme.benefitMr}
                          </strong>
                        </div>
                      </div>

                      {/* Criteria Explanation & Fill-Form Direction */}
                      <div className="border-t border-slate-200/50 pt-2.5 text-xs">
                        {isEligible ? (
                          <div className="space-y-1.5">
                            <span className="text-emerald-700 font-bold block">✓ You qualify for this scheme!</span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded">
                              <div className="flex items-center gap-1.5">
                                <ExternalLink size={12} className="text-govgreen flex-shrink-0" />
                                <span>
                                  <strong>Where to apply:</strong> {i18n.language === 'en' ? scheme.formHelp : scheme.formHelpMr}
                                </span>
                              </div>
                              {scheme.formUrl && (
                                <a
                                  href={scheme.formUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-govnavy hover:bg-govblue-700 text-white rounded text-[10px] font-black hover:text-white transition-all shadow flex items-center gap-1 shrink-0 no-underline cursor-pointer select-none"
                                >
                                  <span>Apply Online / अर्ज करा</span>
                                  <ExternalLink size={9} />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-rose-700 font-bold block">✗ Disqualification Reasons:</span>
                            <div className="bg-rose-50 border border-rose-100 p-2 rounded text-slate-650 space-y-1 font-semibold text-[11px]">
                              {i18n.language === 'en' 
                                ? scheme.reasons.map((r: string, rIdx: number) => <div key={rIdx}>• {r}</div>)
                                : scheme.reasonsMr.map((r: string, rIdx: number) => <div key={rIdx}>• {r}</div>)}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* file/track grievance view */}
      {currentTab === 'grievances' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File Grievance Form */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              {i18n.language === 'en' ? 'Submit New Complaint' : 'नवीन तक्रार नोंदणी'}
            </h2>
            
            <form onSubmit={handleCitizenSubmitGrievance} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Complaint Subject / शीर्षक' : 'तक्रारीचे शीर्षक / विषय'}</label>
                <input
                  type="text"
                  required
                  value={grvTitle}
                  onChange={(e) => setGrvTitle(e.target.value)}
                  placeholder={i18n.language === 'en' ? 'e.g. Water pipeline leak near Maruti temple' : 'उदा. मारुती मंदिराजवळ पाण्याची पाईपलाईन गळती'}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Ward Location / वॉर्ड' : 'तक्रार वॉर्ड निवडा'}</label>
                <select
                  value={grvWard}
                  onChange={(e) => setGrvWard(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                >
                  <option value={1}>{i18n.language === 'en' ? 'Ward 1' : 'वॉर्ड १'}</option>
                  <option value={2}>{i18n.language === 'en' ? 'Ward 2' : 'वॉर्ड २'}</option>
                  <option value={3}>{i18n.language === 'en' ? 'Ward 3' : 'वॉर्ड ३'}</option>
                  <option value={4}>{i18n.language === 'en' ? 'Ward 4' : 'वॉर्ड ४'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Detail Description / तक्रारीचे वर्णन' : 'तपशीलवार वर्णन / तक्रारीचा मजकूर'}</label>
                <textarea
                  required
                  rows={4}
                  value={grvDesc}
                  onChange={(e) => setGrvDesc(e.target.value)}
                  placeholder={i18n.language === 'en' ? 'Provide complete details about the damage, leak, or issue. The AI model will auto-route it to the corresponding cell.' : 'नुकसान, गळती किंवा समस्येबद्दल संपूर्ण माहिती द्या. आमचे AI मॉडेल संबंधित विभागाकडे वर्ग करेल.'}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold transition-all shadow flex items-center justify-center gap-1"
              >
                <Sparkles size={12} className="text-govsaffron animate-pulse" />
                <span>{i18n.language === 'en' ? 'Submit Complaint (AI Auto-Categorize)' : 'तक्रार नोंदवा (AI स्वयंचलित वर्गीकरण)'}</span>
              </button>
            </form>
          </div>

          {/* Grievances List & Tracker */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              {i18n.language === 'en' ? 'Track Submitted Grievances' : 'तुमच्या तक्रारीचा मागोवा घ्या'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* List */}
              <div className="md:col-span-5 space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {myGrievances.map((g) => {
                  const isSelected = activeGrievanceId === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setActiveGrievanceId(g.id)}
                      className={`w-full p-3 rounded text-left border transition-all space-y-1 ${
                        isSelected 
                          ? 'bg-govblue-50 border-govblue-300' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <strong className="text-xs font-bold text-slate-800 block truncate">
                        {i18n.language === 'en' ? g.title : g.titleMr}
                      </strong>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span>{i18n.language === 'en' ? 'Date' : 'तारीख'}: {g.submittedDate}</span>
                        <span className="font-bold uppercase tracking-wider text-govsaffron">
                          {i18n.language === 'en' ? g.status : g.statusMr}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status Timeline Tracker */}
              <div className="md:col-span-7 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
                {activeGrievance ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <strong className="text-xs text-govblue-900 block">ID: {activeGrievance.id}</strong>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        {i18n.language === 'en' ? 'Category' : 'वर्ग'}: {activeGrievance.category} • {i18n.language === 'en' ? 'Ward' : 'वॉर्ड'} {activeGrievance.ward}
                      </span>
                    </div>

                    {/* Timeline stepper */}
                    <div className="space-y-4 text-xs font-semibold relative pl-4 border-l border-slate-200 ml-2">
                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-govgreen border-2 border-white"></div>
                        <span className="text-slate-800 block font-bold">Complaint Logged / तक्रार नोंदवली</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{i18n.language === 'en' ? 'Date' : 'तारीख'}: {activeGrievance.submittedDate}</span>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-govgreen border-2 border-white"></div>
                        <span className="text-slate-800 block font-bold">Routed to Department / विभागात पाठवले</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5 italic">{activeGrievance.deptName}</span>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          activeGrievance.status === 'In Progress' || activeGrievance.status === 'Resolved' ? 'bg-govgreen' : 'bg-slate-300'
                        }`}></div>
                        <span className={`block font-bold ${
                          activeGrievance.status === 'In Progress' || activeGrievance.status === 'Resolved' ? 'text-slate-800' : 'text-slate-400'
                        }`}>Under Investigation / तपास सुरू</span>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          activeGrievance.status === 'Resolved' ? 'bg-govgreen' : 'bg-slate-300'
                        }`}></div>
                        <span className={`block font-bold ${
                          activeGrievance.status === 'Resolved' ? 'text-slate-800' : 'text-slate-400'
                        }`}>Resolved / निराकरण झाले</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {i18n.language === 'en' 
                      ? 'Select a complaint from the list to view its tracking timeline and routed department.'
                      : 'तक्रारीचा मागोवा आणि नियुक्त विभाग पाहण्यासाठी यादीतून तक्रार निवडा.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Document Locker view (NEW) */}
      {currentTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload Document Form */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              {i18n.language === 'en' ? 'Upload Document for Verification' : 'पडताळणीसाठी दस्तऐवज अपलोड करा'}
            </h2>
            
            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Check size={14} />
                <span>{i18n.language === 'en' ? 'Uploaded! Awaiting officer audit.' : 'यशस्वीरीत्या अपलोड झाले! अधिकाऱ्यांच्या पडताळणीची प्रतीक्षा आहे.'}</span>
              </div>
            )}

            <form onSubmit={handleDocUpload} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Select Document Type / दस्तऐवजाचा प्रकार' : 'दस्तऐवजाचा प्रकार निवडा'}</label>
                <select
                  value={docTypeInput}
                  onChange={(e) => setDocTypeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-700 bg-white"
                >
                  <option value="Income Certificate">{i18n.language === 'en' ? 'Income Certificate / उत्पन्नाचा दाखला' : 'उत्पन्नाचा दाखला'}</option>
                  <option value="Aadhaar Card">{i18n.language === 'en' ? 'Aadhaar Card / आधार कार्ड' : 'आधार कार्ड'}</option>
                  <option value="Land ownership 7/12 Extract">{i18n.language === 'en' ? 'Land ownership 7/12 Extract / ७/१२ उतारा' : '७/१२ उतारा'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">{i18n.language === 'en' ? 'Select Document File / फाईल निवडा' : 'फाईल निवडा'}</label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFileNameInput(file.name);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-700 bg-white cursor-pointer focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold transition-all shadow flex items-center justify-center gap-1.5"
              >
                <FolderOpen size={14} />
                <span>{i18n.language === 'en' ? 'Upload to Panchayat Database' : 'पंचायतीच्या डेटाबेसमध्ये अपलोड करा'}</span>
              </button>
            </form>
          </div>

          {/* Uploaded Documents List */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              {i18n.language === 'en' ? 'Digital Locker & Verification Status' : 'डिजिटल लॉकर आणि पडताळणी स्थिती'}
            </h2>
            
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const isVerified = doc.status === 'Verified';
                const isPending = doc.status === 'Pending Verification';

                return (
                  <div 
                    key={doc.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center border ${
                        isVerified 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-150' 
                          : isPending
                            ? 'bg-amber-50 text-amber-600 border-amber-150'
                            : 'bg-rose-50 text-rose-600 border-rose-150'
                      }`}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-800 block">
                          {i18n.language === 'en' ? doc.docType : doc.docTypeMr}
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          File: {doc.fileName} • {i18n.language === 'en' ? 'Date' : 'तारीख'}: {doc.submittedDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                        isVerified 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : isPending 
                            ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {isVerified 
                          ? (i18n.language === 'en' ? 'Verified & Stored' : 'पडताळणी पूर्ण') 
                          : isPending 
                            ? (i18n.language === 'en' ? 'Pending Audit' : 'पडताळणी प्रलंबित') 
                            : (i18n.language === 'en' ? 'Rejected' : 'अस्वीकृत')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* chatbot view */}
      {currentTab === 'ai_assistant' && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-govsaffron">
                <Bot size={18} />
              </div>
              <div>
                <strong className="text-xs font-bold text-govblue-900 block">
                  {i18n.language === 'en' ? 'Village Citizen Helpdesk AI' : 'ग्राम नागरिक मदत कक्ष AI'}
                </strong>
                <span className="text-[9px] text-slate-400 font-semibold block">
                  {i18n.language === 'en' ? 'Ask about Certificates, Land records, or Subsidies' : 'दाखले, जमीन अभिलेख किंवा शासकीय योजनांविषयी विचारा'}
                </span>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {chatLog.map((chat, idx) => {
              const isEnglish = i18n.language === 'en';

              return (
                <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl p-4 ${
                    chat.sender === 'user'
                      ? 'bg-govnavy text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                  }`}>
                    <div className="leading-relaxed font-sans text-xs sm:text-sm m-0 space-y-1">{renderFormattedText(chat.text)}</div>

                    {/* Sources Badges */}
                    {chat.sources && chat.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          {isEnglish ? 'Sources Retrieved:' : 'प्राप्त संदर्भ स्रोत:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {chat.sources.map((src, sIdx) => (
                            <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] text-slate-500 font-semibold block">
                              {src.type}: {src.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              );
            })}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-lg rounded-tl-none p-3 flex items-center gap-2">
                  <Bot size={14} className="text-govsaffron animate-spin" />
                  <span className="text-xs text-slate-400">
                    {i18n.language === 'en' ? 'Typing helpdesk guidance...' : 'मार्गदर्शन टाईप करत आहे...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer form */}
          <form 
            onSubmit={handleChatSend}
            className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={i18n.language === 'en' ? "Ask about birth certificates, old age pensions, or next meeting date..." : "जन्म दाखला, पेन्शन योजना किंवा पुढील सभेच्या तारखेबद्दल विचारा..."}
              className="flex-1 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-4 py-2 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold text-xs flex items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              <span>{i18n.language === 'en' ? 'Send' : 'पाठवा'}</span>
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
