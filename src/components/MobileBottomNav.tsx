import React from 'react';
import { ListFilter, PlusCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { GoogleSheetInfo } from '../types/service';

interface MobileBottomNavProps {
  currentView: 'list' | 'new';
  onViewChange: (view: 'list' | 'new') => void;
  sheetInfo: GoogleSheetInfo | null;
  onSync: () => void;
  isSyncing: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  sheetInfo,
  onSync,
  isSyncing,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d121c]/95 backdrop-blur-lg border-t border-slate-800/90 md:hidden flex items-center justify-around h-16 px-2 pb-safe no-print shadow-2xl">
      {/* Tab 1: Historial */}
      <button
        onClick={() => onViewChange('list')}
        className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
          currentView === 'list'
            ? 'text-amber-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ListFilter className="w-5 h-5" />
        <span className="text-[10px] mt-1 tracking-tight">Historial</span>
      </button>

      {/* Tab 2: Primary Action (+ Registrar) */}
      <button
        onClick={() => onViewChange('new')}
        className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
          currentView === 'new'
            ? 'text-amber-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-2 rounded-full -mt-4 shadow-lg border ${
          currentView === 'new'
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
            : 'bg-slate-800 text-amber-400 border-slate-700'
        }`}>
          <PlusCircle className="w-6 h-6 stroke-[2.2]" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Registrar</span>
      </button>

      {/* Tab 3: Google Sheets Link */}
      {sheetInfo ? (
        <a
          href={sheetInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Ver Sheets</span>
        </a>
      ) : (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">{isSyncing ? 'Conectando' : 'Sincronizar'}</span>
        </button>
      )}
    </nav>
  );
};
