import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { 
  MAP_CENTER, 
  GIS_FACILITIES, 
  PROJECTS, 
  GRIEVANCES 
} from '../data/mockData';

export const GISMap: React.FC = () => {
  const { t, i18n } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters State
  const [showWater, setShowWater] = useState(true);
  const [showSchools, setShowSchools] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showGrievances, setShowGrievances] = useState(true);
  const [showHealth, setShowHealth] = useState(true);



  // Color mapping config
  // Tailwind colors text/border mappings need inline-style support in leafet divicon html
  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'water':
        return L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-lg text-cyan-400 font-extrabold text-xs">🚰</div>`,
          className: 'custom-icon', iconSize: [28, 28], iconAnchor: [14, 14]
        });
      case 'school':
        return L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center shadow-lg text-blue-500 font-extrabold text-xs">🏫</div>`,
          className: 'custom-icon', iconSize: [28, 28], iconAnchor: [14, 14]
        });
      case 'health':
        return L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center shadow-lg text-purple-500 font-extrabold text-xs">🏥</div>`,
          className: 'custom-icon', iconSize: [28, 28], iconAnchor: [14, 14]
        });
      case 'project':
        return L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-yellow-500 flex items-center justify-center shadow-lg text-yellow-400 font-extrabold text-xs">🏗️</div>`,
          className: 'custom-icon', iconSize: [28, 28], iconAnchor: [14, 14]
        });
      case 'grievance':
        return L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-red-500 flex items-center justify-center shadow-lg text-red-500 font-extrabold text-xs">⚠️</div>`,
          className: 'custom-icon', iconSize: [28, 28], iconAnchor: [14, 14]
        });
      default:
        return L.divIcon({
          html: `<div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-400 flex items-center justify-center shadow-lg text-slate-400 font-extrabold text-xs">📍</div>`,
          className: 'custom-icon', iconSize: [28, 28], iconAnchor: [14, 14]
        });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return; // Only init once

    // Create Leaflet Map instance
    const map = L.map('panchayat-leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(MAP_CENTER, 16);

    mapRef.current = map;

    // Load CartoDB Dark Matter tiles (premium dark mode map styling)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Create marker overlay layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Cleanup map on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when filter state changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers(); // Clean up existing pins

    const isEnglish = i18n.language === 'en';

    // 1. Plot Mapped Facilities (Schools, Water, Health)
    GIS_FACILITIES.forEach((fac) => {
      if (fac.type === 'school' && !showSchools) return;
      if (fac.type === 'water' && !showWater) return;
      if (fac.type === 'health' && !showHealth) return;

      const titleText = isEnglish ? fac.name : fac.nameMr;
      const popupHtml = `
        <div class="p-2 space-y-1 bg-slate-900 text-white font-sans text-xs">
          <strong class="text-sm font-bold text-indigo-300 block">${titleText}</strong>
          <span class="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">${fac.type.toUpperCase()}</span>
          <p class="text-slate-300 mt-1.5 leading-relaxed">${fac.details}</p>
        </div>
      `;

      L.marker(fac.coordinates as [number, number], { icon: getMarkerIcon(fac.type) })
        .bindPopup(popupHtml)
        .addTo(markersLayer);
    });

    // 2. Plot Ongoing/Delayed Projects
    if (showProjects) {
      PROJECTS.forEach((proj) => {
        const titleText = isEnglish ? proj.name : proj.nameMr;
        const statusText = isEnglish ? proj.status : proj.statusMr;
        const progressColor = proj.status === 'Completed' ? 'text-emerald-400' : proj.status === 'Delayed' ? 'text-rose-400' : 'text-indigo-400';
        
        const popupHtml = `
          <div class="p-2.5 space-y-2 bg-slate-900 text-white font-sans text-xs min-w-[200px]">
            <div class="border-b border-slate-850 pb-1.5">
              <strong class="text-sm font-bold text-yellow-400 block">${titleText}</strong>
              <span class="text-[9px] uppercase font-bold bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">PROJECT</span>
            </div>
            <div class="grid grid-cols-2 gap-1 text-[11px]">
              <div><span class="text-slate-500">Progress:</span> <strong class="${progressColor}">${proj.progress}%</strong></div>
              <div><span class="text-slate-500">Status:</span> <strong class="${progressColor}">${statusText}</strong></div>
              <div class="col-span-2 mt-1"><span class="text-slate-500">Budget:</span> <strong class="text-slate-200">₹${(proj.budget/100000).toFixed(1)} Lakh</strong></div>
            </div>
          </div>
        `;

        L.marker(proj.coordinates, { icon: getMarkerIcon('project') })
          .bindPopup(popupHtml)
          .addTo(markersLayer);
      });
    }

    // 3. Plot Pending Grievances
    if (showGrievances) {
      GRIEVANCES.forEach((grv) => {
        const titleText = isEnglish ? grv.title : grv.titleMr;
        const priorityColor = grv.priority === 'Critical' || grv.priority === 'High' ? 'text-rose-400' : 'text-slate-300';
        
        const popupHtml = `
          <div class="p-2.5 space-y-2 bg-slate-900 text-white font-sans text-xs min-w-[220px]">
            <div class="border-b border-slate-850 pb-1.5">
              <strong class="text-sm font-bold text-rose-400 block">${titleText}</strong>
              <span class="text-[9px] uppercase font-bold bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">GRIEVANCE</span>
            </div>
            <div class="text-[11px] space-y-1">
              <div><span class="text-slate-500">Priority:</span> <strong class="${priorityColor}">${isEnglish ? grv.priority : grv.priorityMr}</strong></div>
              <div><span class="text-slate-500">Location:</span> <strong class="text-slate-200">Ward ${grv.ward}</strong></div>
              <p class="text-slate-350 leading-relaxed mt-1 italic">"${isEnglish ? grv.description.substring(0, 70) + '...' : grv.descriptionMr.substring(0, 70) + '...'}"</p>
            </div>
          </div>
        `;

        L.marker(grv.coordinates, { icon: getMarkerIcon('grievance') })
          .bindPopup(popupHtml)
          .addTo(markersLayer);
      });
    }

  }, [showWater, showSchools, showProjects, showGrievances, showHealth, i18n.language]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide m-0">{t('gis_page.title')}</h1>
        <p className="text-xs text-slate-500 mt-1">Interactive geospatial analysis of water pipelines, schools, ongoing construction, and live civic complaints.</p>
      </div>

      {/* Map Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Map Container - span 3 */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl relative">
          <div 
            id="panchayat-leaflet-map" 
            className="w-full h-[550px] z-10"
          />
          {/* GIS Coordinates floating banner */}
          <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 px-2.5 py-1 rounded shadow-lg select-none z-20">
            Center Lat: {MAP_CENTER[0]}, Lng: {MAP_CENTER[1]} (Khed Shivapur, Pune)
          </div>
        </div>

        {/* Legend Filter Panel */}
        <div className="glass-card rounded-xl border border-slate-800 p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Layers size={16} className="text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-wide m-0 uppercase text-slate-400">{t('gis_page.legend')}</h2>
          </div>

          <div className="space-y-3.5">
            {/* Projects Toggle */}
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="w-full flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-yellow-500 flex items-center justify-center text-xs">🏗️</div>
                <span className="text-xs font-semibold text-slate-200">{t('gis_page.projects')}</span>
              </div>
              {showProjects ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-slate-600" />}
            </button>

            {/* Grievances Toggle */}
            <button
              onClick={() => setShowGrievances(!showGrievances)}
              className="w-full flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-red-500 flex items-center justify-center text-xs">⚠️</div>
                <span className="text-xs font-semibold text-slate-200">{t('gis_page.grievances')}</span>
              </div>
              {showGrievances ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-slate-600" />}
            </button>

            {/* Water Toggle */}
            <button
              onClick={() => setShowWater(!showWater)}
              className="w-full flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-cyan-400 flex items-center justify-center text-xs">🚰</div>
                <span className="text-xs font-semibold text-slate-200">{t('gis_page.water')}</span>
              </div>
              {showWater ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-slate-600" />}
            </button>

            {/* Schools Toggle */}
            <button
              onClick={() => setShowSchools(!showSchools)}
              className="w-full flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-blue-500 flex items-center justify-center text-xs">🏫</div>
                <span className="text-xs font-semibold text-slate-200">{t('gis_page.schools')}</span>
              </div>
              {showSchools ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-slate-600" />}
            </button>

            {/* Health Facilities Toggle */}
            <button
              onClick={() => setShowHealth(!showHealth)}
              className="w-full flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-850 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-purple-500 flex items-center justify-center text-xs">🏥</div>
                <span className="text-xs font-semibold text-slate-200">{t('gis_page.health')}</span>
              </div>
              {showHealth ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-slate-600" />}
            </button>
          </div>

          <div className="p-3 bg-indigo-500/5 rounded border border-indigo-500/10 flex items-start gap-2">
            <Sparkles size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-[10px] text-slate-400 leading-normal">
              <strong>GIS Tip:</strong> Click any pin on the map to trigger AI asset status popups, project budgets, or grievance text summaries.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
