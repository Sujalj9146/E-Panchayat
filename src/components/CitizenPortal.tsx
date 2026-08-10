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
  Sparkles
} from 'lucide-react';
import { SCHEMES, GRIEVANCES, MAP_CENTER } from '../data/mockData';
import type { Grievance } from '../data/mockData';

interface CitizenPortalProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ 
  currentTab, 
  setCurrentTab 
}) => {
  const { i18n } = useTranslation();
  
  // Grievances filed by the citizen in this session
  const [myGrievances, setMyGrievances] = useState<Grievance[]>(GRIEVANCES.slice(0, 2));
  const [activeGrievanceId, setActiveGrievanceId] = useState<string | null>(GRIEVANCES[0].id);

  // Scheme eligibility inputs
  const [ageInput, setAgeInput] = useState<string>('30');
  const [incomeInput, setIncomeInput] = useState<string>('60000');
  const [genderInput, setGenderInput] = useState<'Male' | 'Female'>('Female');
  const [farmerInput, setFarmerInput] = useState<boolean>(true);
  const [eligibleSchemesList, setEligibleSchemesList] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([
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

  // Scheme calculator evaluator
  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    const age = Number(ageInput) || 0;
    const income = Number(incomeInput) || 0;

    const matches = SCHEMES.filter(s => {
      // Age Check
      if (s.id === 'scheme_sr_citizen' && age < s.minAge) return false;
      
      // Income Check
      if (income > s.maxIncome) return false;

      // Gender Check
      if (s.genderRestriction && s.genderRestriction !== genderInput) return false;

      // Occupation Check
      if (s.id === 'scheme_krishi_sinchan' && !farmerInput) return false;

      return true;
    });

    setEligibleSchemesList(matches);
    setChecked(true);
  };

  // Submit grievance as citizen
  const handleCitizenSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grvTitle.trim() || !grvDesc.trim()) return;

    // Direct classification
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
    setActiveGrievanceId(newGrv.id);
    
    // Reset Form
    setGrvTitle('');
    setGrvDesc('');
    setGrvWard(1);
  };

  // AI chat responder for citizen
  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      let aiText = "";
      const query = userText.toLowerCase();
      const isEnglish = i18n.language === 'en';

      if (query.includes('birth') || query.includes('death') || query.includes('certificate') || query.includes('प्रमाणपत्र')) {
        aiText = isEnglish 
          ? "To get Birth, Death, or Income Certificates, please visit the Gram Panchayat Digital Center (Ward 2) with your Aadhaar Card and Ration Card. You can also apply online via the MahaOnline portal."
          : "जन्म, मृत्यू किंवा उत्पन्नाचा दाखला मिळवण्यासाठी कृपया तुमचे आधार कार्ड आणि रेशन कार्ड घेऊन ग्रामपंचायत डिजिटल सेवा केंद्रात (वॉर्ड २) संपर्क साधा. आपण महाऑनलाईन पोर्टलद्वारे ऑनलाईन अर्जही करू शकता.";
      } else if (query.includes('pension') || query.includes('senior') || query.includes('पेन्शन') || query.includes('योजना')) {
        aiText = isEnglish
          ? "For the Senior Citizen Pension Scheme, citizens must be 60+ years of age with annual family income below ₹1,00,000. You will need Age proof, Income certificate, and Residence proof."
          : "ज्येष्ठ नागरिक पेन्शन योजनेसाठी वय ६० वर्षांपेक्षा जास्त आणि वार्षिक कौटुंबिक उत्पन्न ₹१,००,००० पेक्षा कमी असणे आवश्यक आहे. यासाठी वयाचा पुरावा, उत्पन्नाचा दाखला आणि रहिवासी दाखला लागेल.";
      } else if (query.includes('meeting') || query.includes('sabha') || query.includes('सभा') || query.includes('बैठक')) {
        aiText = isEnglish
          ? "The next Gram Sabha session is scheduled for August 20, 2026, at 11:00 AM in the Khed Shivapur Community Hall. All citizens are requested to attend and raise local queries."
          : "पुढील ग्रामसभा बैठक २० ऑगस्ट २०२६ रोजी सकाळी ११:०० वाजता खेड शिवापूर कम्युनिटी हॉलमध्ये आयोजित केली आहे. सर्व नागरिकांना उपस्थित राहून आपल्या समस्या मांडण्याची विनंती आहे.";
      } else {
        aiText = isEnglish
          ? "Thank you for asking. For this service, please submit a written application to the Gram Sevak officer at the Panchayat building on weekdays between 10:00 AM and 5:00 PM."
          : "विचारल्याबद्दल धन्यवाद. या सेवेसाठी, कृपया कार्यालयीन दिवशी सकाळी १० ते संध्याकाळी ५ दरम्यान ग्रामपंचायत कार्यालयात ग्रामसेवकांकडे लेखी अर्ज सादर करावा.";
      }

      setChatLog(prev => [...prev, { sender: 'ai', text: aiText }]);
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
          <h1 className="text-xl font-bold text-govblue-900 m-0">Khed Shivapur Citizen Facilitation Portal</h1>
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
              <span>Village Public Information Board</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-3">
                <Calendar className="text-govsaffron flex-shrink-0" size={16} />
                <div>
                  <strong className="text-slate-800 block">Upcoming Gram Sabha Meeting</strong>
                  <span className="text-slate-500 block mt-0.5">Date: 20 Aug 2026 • Time: 11:00 AM • Venue: ZP School Ground</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-3">
                <MapPin className="text-govnavy flex-shrink-0" size={16} />
                <div>
                  <strong className="text-slate-800 block">Digital Certificate Camp</strong>
                  <span className="text-slate-500 block mt-0.5">Apply for income and caste proofs directly this week at Ward 2 Kiosk.</span>
                </div>
              </div>
            </div>

            {/* Official Directory */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-700">Official Panchayat Contacts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-150 flex items-center gap-2">
                  <Phone size={12} className="text-govgreen" />
                  <div>
                    <span className="text-slate-800 font-semibold block">Gram Sevak (Village Officer)</span>
                    <span className="text-[10px] text-slate-500 font-mono">+91 98450 12345</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-150 flex items-center gap-2">
                  <Phone size={12} className="text-govgreen" />
                  <div>
                    <span className="text-slate-800 font-semibold block">Sarpanch (Village Head)</span>
                    <span className="text-[10px] text-slate-500 font-mono">+91 98450 54321</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core actions entry card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Available Actions</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use our digital services to verify your scheme qualification, file complaints about local infrastructure leaks/potholes, or ask our chatbot general questions about panchayat operations.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 pt-4">
              <button 
                onClick={() => setCurrentTab('schemes')}
                className="p-3 bg-govblue-50 border border-govblue-200 hover:bg-govblue-100 text-govnavy rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <Award size={18} className="mx-auto text-govnavy" />
                <span className="block text-[10px]">Welfare Schemes</span>
              </button>
              <button 
                onClick={() => setCurrentTab('grievances')}
                className="p-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <Plus size={18} className="mx-auto text-rose-600" />
                <span className="block text-[10px]">File Grievance</span>
              </button>
              <button 
                onClick={() => setCurrentTab('ai_assistant')}
                className="p-3 bg-orange-50 border border-orange-200 hover:bg-orange-100 text-govsaffron rounded-lg text-center font-bold text-xs space-y-1.5 transition-colors"
              >
                <Bot size={18} className="mx-auto text-govsaffron" />
                <span className="block text-[10px]">AI Helpdesk</span>
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
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Scheme Eligibility Calculator</h2>
            
            <form onSubmit={handleCheckEligibility} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">Enter Age / वय</label>
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">Annual Income (₹) / उत्पन्न</label>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">Gender / लिंग</label>
                <select
                  value={genderInput}
                  onChange={(e) => setGenderInput(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                >
                  <option value="Male">Male / पुरुष</option>
                  <option value="Female">Female / महिला</option>
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
                <label htmlFor="farmer_check" className="text-slate-650 cursor-pointer">I am a Registered Farmer / मी शेतकरी आहे</label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold transition-all shadow"
              >
                Check Qualifying Schemes
              </button>
            </form>
          </div>

          {/* Results List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Matching Welfare Subsidies</h2>
            
            {!checked ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Fill out the eligibility profile on the left and submit to view your matching government benefits.
              </div>
            ) : eligibleSchemesList.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs font-medium">
                No schemes matches found for this profile.
              </div>
            ) : (
              <div className="space-y-3">
                {eligibleSchemesList.map((scheme, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <strong className="text-sm font-bold text-govblue-900 block">
                        {i18n.language === 'en' ? scheme.name : scheme.nameMr}
                      </strong>
                      <p className="text-xs text-slate-500 leading-normal">
                        {i18n.language === 'en' ? scheme.description : scheme.descriptionMr}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-govgreen font-bold uppercase tracking-wider block">Estimated Benefit</span>
                      <strong className="text-sm font-black text-govgreen block mt-0.5">
                        {i18n.language === 'en' ? scheme.benefit : scheme.benefitMr}
                      </strong>
                    </div>
                  </div>
                ))}
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
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Submit New Complaint</h2>
            
            <form onSubmit={handleCitizenSubmitGrievance} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 block">Complaint Subject / शीर्षक</label>
                <input
                  type="text"
                  required
                  value={grvTitle}
                  onChange={(e) => setGrvTitle(e.target.value)}
                  placeholder="e.g. Water pipeline leak near Maruti temple"
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">Ward Location / वॉर्ड</label>
                <select
                  value={grvWard}
                  onChange={(e) => setGrvWard(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                >
                  <option value={1}>Ward 1</option>
                  <option value={2}>Ward 2</option>
                  <option value={3}>Ward 3</option>
                  <option value={4}>Ward 4</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 block">Detail Description / तक्रारीचे वर्णन</label>
                <textarea
                  required
                  rows={4}
                  value={grvDesc}
                  onChange={(e) => setGrvDesc(e.target.value)}
                  placeholder="Provide complete details about the damage, leak, or issue. The AI model will auto-route it to the corresponding cell."
                  className="w-full px-3 py-2 border border-slate-200 rounded"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold transition-all shadow flex items-center justify-center gap-1"
              >
                <Sparkles size={12} className="text-govsaffron animate-pulse" />
                <span>Submit Complaint (AI Auto-Categorize)</span>
              </button>
            </form>
          </div>

          {/* Grievances List & Tracker */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Track Submitted Grievances</h2>
            
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
                        <span>Date: {g.submittedDate}</span>
                        <span className="font-bold uppercase tracking-wider text-govsaffron">{g.status}</span>
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
                        Category: {activeGrievance.category} • Ward {activeGrievance.ward}
                      </span>
                    </div>

                    {/* Timeline stepper */}
                    <div className="space-y-4 text-xs font-semibold relative pl-4 border-l border-slate-200 ml-2">
                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-govgreen border-2 border-white"></div>
                        <span className="text-slate-800 block font-bold">Complaint Logged / तक्रार नोंदवली</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Date: {activeGrievance.submittedDate}</span>
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
                    Select a complaint from the list to view its tracking timeline and routed department.
                  </div>
                )}
              </div>
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
                <strong className="text-xs font-bold text-govblue-900 block">Village Citizen Helpdesk AI</strong>
                <span className="text-[9px] text-slate-400 font-semibold block">Ask about Certificates, Land records, or Subsidies</span>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {chatLog.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  chat.sender === 'user'
                    ? 'bg-govnavy text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed font-sans">{chat.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-lg rounded-tl-none p-3 flex items-center gap-2">
                  <Bot size={14} className="text-govsaffron animate-spin" />
                  <span className="text-xs text-slate-400">Typing helpdesk guidance...</span>
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
              placeholder="Ask about birth certificates, old age pensions, or next meeting date..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-4 py-2 bg-govnavy hover:bg-govblue-700 text-white rounded font-bold text-xs flex items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              <span>Send</span>
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
