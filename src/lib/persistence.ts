import { supabase, isSupabaseConfigured } from './supabase';

// In-memory callbacks to update React component states when cloud data finishes syncing
const listeners: Set<() => void> = new Set();

export const addPersistenceListener = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const notifyListeners = () => {
  listeners.forEach(cb => cb());
};

// Map local storage keys to Supabase table names
const keyToTableMap: Record<string, string> = {
  'panchayat_citizens': 'citizens',
  'panchayat_grievances': 'grievances',
  'panchayat_projects': 'projects',
  'panchayat_digital_locker': 'citizen_documents',
  'panchayat_sabha_meeting': 'sabha_meetings'
};

export const getPersistentData = <T>(key: string, defaultData: T): T => {
  if (typeof window === 'undefined') return defaultData;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse local storage key:", key, e);
    }
  }
  // Initialize storage with defaultData
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
};

// Asynchronous background upsert to Supabase
export const savePersistentData = async (key: string, data: any): Promise<void> => {
  if (typeof window === 'undefined') return;

  // 1. Immediately cache in localStorage (keeps frontend synchronous and fast)
  localStorage.setItem(key, JSON.stringify(data));

  // 2. Perform background sync if Supabase is active
  if (!isSupabaseConfigured || !supabase) return;

  const tableName = keyToTableMap[key];
  if (!tableName) return;

  try {
    // Standardize data representation to array of records
    const records = Array.isArray(data) ? data : [data];

    // Map JS camelCase object properties to Postgres snake_case columns
    const mappedRecords = records.map(item => {
      const mapped: any = {};
      for (const [k, val] of Object.entries(item)) {
        // Convert camelCase to snake_case
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        // Handle array of strings or complex JSON values
        if (Array.isArray(val) && (tableName === 'sabha_meetings' || tableName === 'grievances')) {
          mapped[snakeKey] = val;
        } else if (typeof val === 'object' && val !== null) {
          mapped[snakeKey] = JSON.stringify(val);
        } else {
          mapped[snakeKey] = val;
        }
      }
      return mapped;
    });

    console.log(`Syncing ${mappedRecords.length} records to Supabase table: ${tableName}`);
    const { error } = await supabase.from(tableName).upsert(mappedRecords);
    if (error) {
      console.warn(`Supabase upsert warning for ${tableName}:`, error.message);
    }
  } catch (err) {
    console.warn(`Supabase sync failed for ${key}, using cached local storage:`, err);
  }
};

// Initial Cloud database fetch to local cache on system boot
export const syncCloudDataToLocal = async (
  CITIZENS: any[],
  GRIEVANCES: any[],
  PROJECTS: any[],
  CITIZEN_DOCUMENTS: any[],
  MOCK_SABHA_MEETING: any
): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log("Supabase URL or Key not set. Running in LocalStorage-only mode.");
    return;
  }

  console.log("Initializing Supabase cloud database fetch...");

  try {
    // 1. Fetch Citizens
    const { data: citizens, error: cErr } = await supabase.from('citizens').select('*');
    if (!cErr && citizens && citizens.length > 0) {
      const parsed = citizens.map(c => ({
        id: c.id,
        name: c.name,
        nameMr: c.name_mr,
        age: c.age,
        gender: c.gender,
        genderMr: c.gender_mr,
        income: Number(c.income),
        occupation: c.occupation,
        occupationMr: c.occupation_mr,
        ward: c.ward,
        phone: c.phone,
        relationship: c.relationship,
        relationshipMr: c.relationship_mr,
        familyId: c.family_id,
        isHead: c.is_head
      }));
      CITIZENS.splice(0, CITIZENS.length, ...parsed);
      localStorage.setItem('panchayat_citizens', JSON.stringify(parsed));
    }

    // 2. Fetch Projects
    const { data: projects, error: pErr } = await supabase.from('projects').select('*');
    if (!pErr && projects && projects.length > 0) {
      const parsed = projects.map(p => ({
        id: p.id,
        name: p.name,
        nameMr: p.name_mr,
        progress: p.progress,
        budget: Number(p.budget),
        utilized: Number(p.utilized),
        status: p.status,
        statusMr: p.status_mr,
        ward: p.ward,
        location: p.location,
        locationMr: p.location_mr,
        description: p.description,
        descriptionMr: p.description_mr,
        coordinates: [Number(p.latitude), Number(p.longitude)]
      }));
      PROJECTS.splice(0, PROJECTS.length, ...parsed);
      localStorage.setItem('panchayat_projects', JSON.stringify(parsed));
    }

    // 3. Fetch Grievances
    const { data: grievances, error: gErr } = await supabase.from('grievances').select('*');
    if (!gErr && grievances) {
      const parsed = grievances.map(g => ({
        id: g.id,
        citizenName: g.citizen_name,
        phone: g.phone,
        ward: g.ward,
        category: g.category,
        categoryMr: g.category_mr,
        title: g.title,
        titleMr: g.title_mr,
        description: g.description,
        descriptionMr: g.description_mr,
        priority: g.priority,
        status: g.status,
        statusMr: g.status_mr,
        date: g.date,
        officerNotes: g.officer_notes || ""
      }));
      if (parsed.length > 0) {
        GRIEVANCES.splice(0, GRIEVANCES.length, ...parsed);
        localStorage.setItem('panchayat_grievances', JSON.stringify(parsed));
      }
    }

    // 4. Fetch Digital Locker Documents
    const { data: docs, error: dErr } = await supabase.from('citizen_documents').select('*');
    if (!dErr && docs) {
      const parsed = docs.map(d => ({
        id: d.id,
        citizenName: d.citizen_name,
        docType: d.doc_type,
        docTypeMr: d.doc_type_mr,
        fileName: d.file_name,
        uploadedAt: d.uploaded_at,
        status: d.status,
        statusMr: d.status_mr,
        verificationDate: d.verification_date || "",
        rejectionReason: d.rejection_reason || ""
      }));
      if (parsed.length > 0) {
        CITIZEN_DOCUMENTS.splice(0, CITIZEN_DOCUMENTS.length, ...parsed);
        localStorage.setItem('panchayat_digital_locker', JSON.stringify(parsed));
      }
    }

    // 5. Fetch Sabha Meetings
    const { data: sabha, error: sErr } = await supabase.from('sabha_meetings').select('*').limit(1);
    if (!sErr && sabha && sabha.length > 0) {
      const raw = sabha[0];
      const parsedActionItems = typeof raw.action_items === 'string' 
        ? JSON.parse(raw.action_items) 
        : raw.action_items;

      const parsed = {
        id: raw.id,
        date: raw.date,
        title: raw.title,
        titleMr: raw.title_mr,
        summary: raw.summary,
        summaryMr: raw.summary_mr,
        decisions: raw.decisions || [],
        decisionsMr: raw.decisions_mr || [],
        actionItems: parsedActionItems || []
      };
      Object.assign(MOCK_SABHA_MEETING, parsed);
      localStorage.setItem('panchayat_sabha_meeting', JSON.stringify(parsed));
    }

    console.log("Supabase cloud database synchronization completed successfully!");
    notifyListeners();
  } catch (err) {
    console.warn("Supabase initial fetch failed, falling back to local storage cache:", err);
  }
};
