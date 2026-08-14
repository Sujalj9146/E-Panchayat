import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_title": "E-Panchayat",
      "app_subtitle": "Decision Support System",
      "nav": {
        "dashboard": "Dashboard",
        "citizens": "Citizens",
        "all_citizens": "All Citizens",
        "families": "Families",
        "search": "Search Citizens",
        "schemes": "Government Schemes",
        "all_schemes": "All Schemes",
        "eligibility": "Eligibility Guidelines",
        "beneficiary_recommendations": "Beneficiary Recommendations",
        "grievances": "Grievances",
        "all_grievances": "All Grievances",
        "pending": "Pending",
        "high_priority": "High Priority",
        "sabha": "Gram Sabha AI",
        "meetings": "Meetings",
        "summaries": "Summaries",
        "gis_map": "GIS Map",
        "ai_assistant": "Panchayat AI",
        "analytics": "Analytics",
        "reports": "Reports",
        "settings": "Settings"
      },
      "dashboard": {
        "overview": "Village Overview",
        "total_citizens": "Total Citizens",
        "families": "Families",
        "active_schemes": "Active Schemes",
        "pending_grievances": "Pending Grievances",
        "ongoing_projects": "Ongoing Projects",
        "project_budget": "Project Budget",
        "ai_insights": "🤖 AI Governance Insights",
        "view_details": "View Details →",
        "insight_1": "12 citizens may be eligible for the Senior Citizen Welfare Scheme.",
        "insight_2": "Ward 3 has the highest number of unresolved water-related grievances.",
        "insight_3": "3 development projects are currently behind schedule.",
        "insight_4": "₹18.4 lakh remains unutilized across ongoing projects.",
        "charts": "Overview Analytics"
      },
      "ai_assistant": {
        "title": "🤖 Panchayat AI Assistant",
        "subtitle": "Ask anything about your Panchayat...",
        "placeholder": "Ask about grievances, budgets, projects, or scheme eligibility...",
        "send": "Ask AI",
        "preset_q1": "Which wards have the highest grievances?",
        "preset_q2": "Who qualifies for the Senior Citizen Pension in Ward 3?",
        "preset_q3": "Show details of delayed development projects.",
        "preset_q4": "What is the total development budget?",
        "sources": "Context Sources"
      },
      "beneficiary": {
        "title": "Beneficiary Recommendation System",
        "select_scheme": "Select Welfare Scheme",
        "select_ward": "Ward",
        "select_priority": "Minimum Priority",
        "all": "All",
        "citizen": "Citizen",
        "age": "Age",
        "income": "Annual Income",
        "ward": "Ward",
        "eligibility": "Eligibility Status",
        "priority": "Priority",
        "why_recommended": "Why Recommended?",
        "ai_explanation": "AI Explanation",
        "rules": {
          "age": "Age requirement satisfied",
          "income": "Income requirement satisfied",
          "residence": "Resident of eligible area",
          "conditions": "Required conditions satisfied"
        },
        "reason": "This citizen appears to satisfy the defined eligibility criteria for the selected scheme."
      },
      "citizens_page": {
        "title": "Citizen Management",
        "search_placeholder": "Search citizen by name / ID / family / ward...",
        "filters": "Filters",
        "gender": "Gender",
        "occupation": "Occupation",
        "eligible_for": "Eligible Schemes",
        "profile": "Citizen Profile",
        "family_tree": "Family Members",
        "potential_schemes": "Potential Eligible Schemes"
      },
      "grievances_page": {
        "title": "Grievance Management Dashboard",
        "total": "Total",
        "pending": "Pending",
        "resolved": "Resolved",
        "high": "High Priority",
        "submit_new": "Submit New Grievance",
        "grievance_title": "Grievance Title",
        "description": "Description",
        "ward": "Ward",
        "category": "Category",
        "priority": "Priority",
        "status": "Status",
        "submitted": "Submitted On",
        "ai_tagging": "AI Automated Classification",
        "ai_detected": "AI Detected Info",
        "route_dept": "Suggested Department",
        "cancel": "Cancel",
        "submit": "Submit"
      },
      "projects_page": {
        "title": "Development Projects Monitoring",
        "progress": "Progress",
        "budget": "Budget",
        "utilized": "Utilized",
        "status": "Status",
        "ongoing": "Ongoing",
        "completed": "Completed",
        "delayed": "Delayed",
        "add_project": "Register New Project"
      },
      "sabha_page": {
        "title": "Gram Sabha AI Meeting Analyzer",
        "upload_title": "Upload Sabha Meeting Transcript / Notes",
        "upload_desc": "Upload text, notes, or PDF files. AI will summarize, extract decisions and action items.",
        "upload_btn": "Upload Document",
        "processing": "Processing document with GraphRAG and Summarization models...",
        "summary_title": "AI Sabha Summary",
        "decisions_title": "Key Decisions",
        "actions_title": "Action Items Table",
        "action": "Action Description",
        "responsible": "Responsible Person",
        "deadline": "Deadline",
        "status": "Status"
      },
      "gis_page": {
        "title": "GIS Intelligence Map",
        "legend": "Layers & Legend",
        "water": "Water Facilities",
        "schools": "Schools",
        "projects": "Projects",
        "grievances": "Grievances",
        "health": "Health Facilities"
      }
    }
  },
  mr: {
    translation: {
      "app_title": "ई-पंचायत",
      "app_subtitle": "निर्णय समर्थन प्रणाली",
      "nav": {
        "dashboard": "मुख्य फलक",
        "citizens": "नागरिक",
        "all_citizens": "सर्व नागरिक",
        "families": "कुटुंब",
        "search": "नागरिक शोधा",
        "schemes": "शासकीय योजना",
        "all_schemes": "सर्व योजना",
        "eligibility": "पात्रता मार्गदर्शक",
        "beneficiary_recommendations": "लाभार्थी शिफारसी",
        "grievances": "तक्रारी",
        "all_grievances": "सर्व तक्रारी",
        "pending": "प्रलंबित",
        "high_priority": "उच्च प्राथमिकता",
        "sabha": "ग्रामसभा AI",
        "meetings": "बैठका",
        "summaries": "सारांश",
        "gis_map": "जीआयएस नकाशा",
        "ai_assistant": "पंचायत AI",
        "analytics": "विश्लेषण",
        "reports": "अहवाल",
        "settings": "सेटिंग्ज"
      },
      "dashboard": {
        "overview": "गाव आढावा",
        "total_citizens": "एकूण नागरिक",
        "families": "कुटुंब",
        "active_schemes": "सक्रिय योजना",
        "pending_grievances": "प्रलंबित तक्रारी",
        "ongoing_projects": "सुरू प्रकल्प",
        "project_budget": "प्रकल्प बजेट",
        "ai_insights": "🤖 AI प्रशासन अंतर्दृष्टी",
        "view_details": "तपशील पहा →",
        "insight_1": "१२ नागरिक ज्येष्ठ नागरिक कल्याण योजनेसाठी पात्र असू शकतात.",
        "insight_2": "वॉर्ड ३ मध्ये पाणी पुरवठ्याशी संबंधित प्रलंबित तक्रारी सर्वाधिक आहेत.",
        "insight_3": "३ विकास प्रकल्प सध्या नियोजित वेळेपेक्षा मागे आहेत.",
        "insight_4": "सुरू असलेल्या प्रकल्पांमध्ये ₹१८.४ लाख निधी न वापरलेला आहे.",
        "charts": "गाव डेटा विश्लेषण"
      },
      "ai_assistant": {
        "title": "🤖 पंचायत AI सहाय्यक",
        "subtitle": "तुमच्या पंचायतीबद्दल काहीही विचारा...",
        "placeholder": "तक्रारी, बजेट, प्रकल्प किंवा योजनेच्या पात्रतेबद्दल विचारा...",
        "send": "AI विचारा",
        "preset_q1": "कोणत्या वॉर्डमध्ये सर्वाधिक तक्रारी आहेत?",
        "preset_q2": "वॉर्ड ३ मध्ये ज्येष्ठ नागरिक पेन्शनसाठी कोण पात्र आहे?",
        "preset_q3": "विलंब झालेल्या विकास प्रकल्पांची माहिती दाखवा.",
        "preset_q4": "एकूण विकास बजेट किती आहे?",
        "sources": "संदर्भ स्रोत"
      },
      "beneficiary": {
        "title": "लाभार्थी शिफारस प्रणाली",
        "select_scheme": "कल्याणकारी योजना निवडा",
        "select_ward": "वॉर्ड",
        "select_priority": "किमान प्राथमिकता",
        "all": "सर्व",
        "citizen": "नागरिक",
        "age": "वय",
        "income": "वार्षिक उत्पन्न",
        "ward": "वॉर्ड",
        "eligibility": "पात्रता स्थिती",
        "priority": "प्राथमिकता",
        "why_recommended": "शिफारस का केली?",
        "ai_explanation": "AI स्पष्टीकरण",
        "rules": {
          "age": "वयाची अट पूर्ण झाली आहे",
          "income": "उत्पन्नाची अट पूर्ण झाली आहे",
          "residence": "पात्र क्षेत्राचा रहिवासी आहे",
          "conditions": "आवश्यक अटी पूर्ण झाल्या आहेत"
        },
        "reason": "हा नागरिक निवडलेल्या योजनेसाठी परिभाषित केलेल्या पात्रता निकषांची पूर्तता करत असल्याचे दिसते."
      },
      "citizens_page": {
        "title": "नागरिक व्यवस्थापन",
        "search_placeholder": "नाव / आयडी / कुटुंब / वॉर्ड द्वारे नागरिक शोधा...",
        "filters": "फिल्टर्स",
        "gender": "लिंग",
        "occupation": "व्यवसाय",
        "eligible_for": "पात्र योजना",
        "profile": "नागरिक प्रोफाइल",
        "family_tree": "कुटुंब सदस्य",
        "potential_schemes": "संभाव्य पात्र योजना"
      },
      "grievances_page": {
        "title": "तक्रार व्यवस्थापन डॅशबोर्ड",
        "total": "एकूण",
        "pending": "प्रलंबित",
        "resolved": "निवारण",
        "high": "उच्च प्राथमिकता",
        "submit_new": "नवीन तक्रार नोंदवा",
        "grievance_title": "तक्रारीचे शीर्षक",
        "description": "तपशील",
        "ward": "वॉर्ड",
        "category": "वर्ग",
        "priority": "प्राधान्य",
        "status": "स्थिती",
        "submitted": "नोंदणी तारीख",
        "ai_tagging": "AI स्वयंचलित वर्गीकरण",
        "ai_detected": "AI द्वारे शोधलेले तपशील",
        "route_dept": "सुचवलेला विभाग",
        "cancel": "रद्द करा",
        "submit": "सादर करा"
      },
      "projects_page": {
        "title": "विकास प्रकल्प देखरेख",
        "progress": "प्रगती",
        "budget": "बजेट",
        "utilized": "वापरलेला निधी",
        "status": "स्थिती",
        "ongoing": "सुरू असलेले",
        "completed": "पूर्ण झालेले",
        "delayed": "विलंब झालेले",
        "add_project": "नवीन प्रकल्पाची नोंदणी करा"
      },
      "sabha_page": {
        "title": "ग्रामसभा AI बैठक विश्लेषक",
        "upload_title": "ग्रामसभा बैठकीचा मसुदा / नोट्स अपलोड करा",
        "upload_desc": "मसुदा, नोट्स किंवा पीडीएफ फाईल अपलोड करा. AI स्वयंचलितपणे सारांश, निर्णय आणि कृती आराखडा तयार करेल.",
        "upload_btn": "दस्तऐवज अपलोड करा",
        "processing": "GraphRAG आणि विश्लेषण मॉडेल्सद्वारे दस्तऐवज प्रक्रिया करत आहे...",
        "summary_title": "AI ग्रामसभा सारांश",
        "decisions_title": "महत्त्वाचे निर्णय",
        "actions_title": "कृती आराखडा पत्रक",
        "action": "कृतीचे वर्णन",
        "responsible": "जबाबदार व्यक्ती",
        "deadline": "अंतिम तारीख",
        "status": "स्थिती"
      },
      "gis_page": {
        "title": "जीआयएस इंटेलिजन्स नकाशा",
        "legend": "नकाशा स्तर आणि सूची",
        "water": "पाणी सुविधा",
        "schools": "शाळा",
        "projects": "प्रकल्प",
        "grievances": "तक्रारी",
        "health": "आरोग्य सुविधा"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
