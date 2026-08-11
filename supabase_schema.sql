-- 🏛️ Supabase Database Schema for Loni Kalbhor E-Panchayat

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CITIZENS TABLE
CREATE TABLE IF NOT EXISTS citizens (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_mr VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(50) NOT NULL,
    gender_mr VARCHAR(50) NOT NULL,
    income DECIMAL(12, 2) NOT NULL,
    occupation VARCHAR(100) NOT NULL,
    occupation_mr VARCHAR(100) NOT NULL,
    ward INT NOT NULL,
    phone VARCHAR(50),
    relationship VARCHAR(100),
    relationship_mr VARCHAR(100),
    family_id VARCHAR(100) NOT NULL,
    is_head BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. GRIEVANCES TABLE
CREATE TABLE IF NOT EXISTS grievances (
    id VARCHAR(100) PRIMARY KEY,
    citizen_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    ward INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    category_mr VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_mr VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_mr TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_mr VARCHAR(50) NOT NULL,
    date VARCHAR(50) NOT NULL,
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_mr VARCHAR(255) NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    budget DECIMAL(15, 2) NOT NULL,
    utilized DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    status_mr VARCHAR(50) NOT NULL,
    ward INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    location_mr VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_mr TEXT NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CITIZEN DOCUMENTS (DIGITAL LOCKER) TABLE
CREATE TABLE IF NOT EXISTS citizen_documents (
    id VARCHAR(100) PRIMARY KEY,
    citizen_name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(100) NOT NULL,
    doc_type_mr VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    status_mr VARCHAR(50) NOT NULL,
    verification_date VARCHAR(50),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SABHA MEETINGS (GRAM SABHA CHECKLIST) TABLE
CREATE TABLE IF NOT EXISTS sabha_meetings (
    id VARCHAR(100) PRIMARY KEY,
    date VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_mr VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    summary_mr TEXT NOT NULL,
    decisions TEXT[] NOT NULL,
    decisions_mr TEXT[] NOT NULL,
    action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS) FOR SAFE PUBLIC WORK
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sabha_meetings ENABLE ROW LEVEL SECURITY;

-- Create simple policies allowing anonymous select and inserts (suitable for quick Gov-Tech prototypes)
CREATE POLICY "Allow anonymous read access" ON citizens FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON grievances FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON citizen_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON sabha_meetings FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access" ON citizens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access" ON grievances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access" ON citizen_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert access" ON sabha_meetings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" ON citizens FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON grievances FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON citizen_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update access" ON sabha_meetings FOR UPDATE USING (true);

-- 7. SEED INITIAL MOCK CITIZENS
INSERT INTO citizens (id, name, name_mr, age, gender, gender_mr, income, occupation, occupation_mr, ward, phone, relationship, relationship_mr, family_id, is_head) VALUES
('cit_101', 'Savita Ramchandra Patil', 'सविता रामचंद्र पाटील', 61, 'Female', 'महिला', 0, 'Unemployed (Widow)', 'बेरोजगार (विधवा)', 3, '+91 98221 44551', 'Household Head', 'कुटुंब प्रमुख', 'fam_patil', true),
('cit_102', 'Ramesh Ananda Shinde', 'रमेश आनंदा शिंदे', 72, 'Male', 'पुरुष', 38000, 'Retired Farmer', 'सेवानिवृत्त शेतकरी', 4, '+91 98450 11223', 'Household Head', 'कुटुंब प्रमुख', 'fam_shinde', true),
('cit_103', 'Lata Ramesh Shinde', 'लता रमेश शिंदे', 65, 'Female', 'महिला', 12000, 'Housewife', 'गृहिणी', 4, '+91 98450 11224', 'Spouse', 'पत्नी', 'fam_shinde', false),
('cit_104', 'Anandrao Tukaram Patil', 'आनंदराव तुकाराम पाटील', 54, 'Male', 'पुरुष', 145000, 'Agriculture (Sugarcane)', 'शेती (ऊस उत्पादन)', 3, '+91 98230 67890', 'Household Head', 'कुटुंब प्रमुख', 'fam_anand_patil', true)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED INITIAL MOCK PROJECTS
INSERT INTO projects (id, name, name_mr, progress, budget, utilized, status, status_mr, ward, location, location_mr, description, description_mr, latitude, longitude) VALUES
('proj_301', 'Village Concrete Road Construction', 'गाव अंतर्गत सिमेंट काँक्रीट रस्ता बांधकाम', 68, 1000000, 720000, 'Delayed', 'विलंब झालेला', 3, 'Ward 3, Shivapur Road To School Lane', 'वॉर्ड ३, शिवापूर रस्ता ते शाळा गल्ली', 'Upgrading the muddy lane to a full-width durable cement concrete road with standard side drainage blocks.', 'चिखलाची गल्ली सर्व रुंदीच्या मजबूत सिमेंट काँक्रीट रस्त्यामध्ये बाजूच्या गटारांसह अद्ययावत करणे.', 18.4901, 73.9814),
('proj_302', 'Gram Panchayat Digital Center Setup', 'ग्रामपंचायत डिजिटल सेवा केंद्र उभारणी', 100, 350000, 345000, 'Completed', 'पूर्ण झालेले', 2, 'Ward 2, Main Gram Panchayat Building', 'वॉर्ड २, मुख्य ग्रामपंचायत कार्यालय इमारत', 'Equipping the office with high speed fiber internet, citizen service kiosks, printers and computers for digital certificates delivery.', 'डिजिटल प्रमाणपत्रे वितरणासाठी कार्यालयात हाय-स्पीड फायबर इंटरनेट, नागरी सेवा किओस्क, प्रिंटर आणि संगणक सुसज्ज करणे.', 18.4907, 73.9806),
('proj_303', 'Water Tank and Pipeline Installation', 'पाण्याची टाकी आणि मुख्य वाहिनी जोडणी', 45, 1500000, 950000, 'Ongoing', 'सुरू असलेले', 1, 'Ward 1, Hilltop Site & Colony Extension', 'वॉर्ड १, टेकडी परिसर आणि वसाहत विस्तार', 'Constructing a 50,000-liter overhead storage tank and laying PVC water pipes to 120 new housing units.', '५०,००० लिटर क्षमतेची उंचावरील पाण्याची टाकी बांधणे आणि १२० नवीन घरांना पीव्हीसी पाण्याचे पाईप्स टाकणे.', 18.4881, 73.9781)
ON CONFLICT (id) DO NOTHING;
