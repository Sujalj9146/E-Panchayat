import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  Landmark, 
  Megaphone, 
  Construction, 
  Notebook, 
  Map, 
  Bot, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react';


interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  collapsed, 
  setCollapsed 
}) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'citizens', label: t('nav.citizens'), icon: Users },
    { id: 'schemes', label: t('nav.schemes'), icon: Landmark },
    { id: 'grievances', label: t('nav.grievances'), icon: Megaphone },
    { id: 'projects', label: t('nav.projects'), icon: Construction },
    { id: 'sabha', label: t('nav.sabha'), icon: Notebook },
    { id: 'gis_map', label: t('nav.gis_map'), icon: Map },
    { id: 'ai_assistant', label: t('nav.ai_assistant'), icon: Bot, isAI: true },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
  ];

  return (
    <aside 
      className={`h-screen sticky top-0 flex flex-col justify-between glass-panel border-r border-slate-800 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-extrabold text-lg">P</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col select-none">
                <span className="font-bold text-white tracking-wide whitespace-nowrap">{t('app_title')}</span>
                <span className="text-xs text-indigo-400 font-medium whitespace-nowrap">{t('app_subtitle')}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive 
                    ? item.isAI
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-indigo-600/15 border-l-2 border-indigo-500 text-indigo-200'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isActive 
                      ? item.isAI ? 'text-white' : 'text-indigo-400' 
                      : item.isAI ? 'text-purple-400' : 'text-slate-400'
                  }`} 
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {item.isAI && !collapsed && (
                  <span className="ml-auto bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    AI
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-950 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Language Toggle & User Section */}
      <div className="p-3 border-t border-slate-800 space-y-3">
        {/* Language Button */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-xs font-semibold"
        >
          <Globe size={16} className="text-indigo-400 animate-pulse" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span>Language / भाषा</span>
              <span className="bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {i18n.language === 'en' ? 'मराठी' : 'English'}
              </span>
            </div>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 p-1.5 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-indigo-300 font-bold border border-slate-700">
            PO
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <span className="text-xs font-semibold text-slate-200">Panchayat Officer</span>
              <span className="text-[10px] text-slate-500">Khed Shivapur</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
