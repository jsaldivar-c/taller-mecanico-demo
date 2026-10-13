import React from 'react';
import { Wrench, FileSpreadsheet, PlusCircle, ListFilter, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSheetInfo } from '../types/service';

interface HeaderProps {
  currentView: 'list' | 'new';
  onViewChange: (view: 'list' | 'new') => void;
  user: User | null;
  sheetInfo: GoogleSheetInfo | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  user,
  sheetInfo,
  isLoggingIn,
  onLogin,
  onLogout,
  onSync,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0d121c]/95 backdrop-blur border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20">
            <Wrench className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-none">
              AutoTaller<span className="text-amber-500 font-semibold ml-0.5">OS</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 block leading-tight mt-0.5">
              Control de Servicios & Sheets
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
          <button
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              currentView === 'list'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Historial de Servicios
          </button>
          <button
            onClick={() => onViewChange('new')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
              currentView === 'new'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Registrar Servicio
          </button>
        </nav>

        {/* Zone 3: Google Workspace Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {sheetInfo && (
            <div className="hidden lg:flex items-center gap-2">
              <a
                href={sheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir hoja de cálculo en Google Sheets"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-md hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Abrir en Sheets</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                onClick={onSync}
                disabled={isSyncing}
                title="Sincronizar datos con Google Sheets"
                className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {user.displayName?.split(' ')[0] || user.email}
              </span>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'Conectando...' : 'Conectar Google Sheets'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden items-center justify-around mt-3 pt-2 border-t border-slate-800">
        <button
          onClick={() => onViewChange('list')}
          className={`flex items-center gap-1.5 py-1 text-xs font-medium ${
            currentView === 'list' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          Historial
        </button>
        <button
          onClick={() => onViewChange('new')}
          className={`flex items-center gap-1.5 py-1 text-xs font-medium ${
            currentView === 'new' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Registrar Servicio
        </button>
        {sheetInfo && (
          <a
            href={sheetInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 py-1 text-xs text-emerald-400 font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sheets
          </a>
        )}
      </div>
    </header>
  );
};
