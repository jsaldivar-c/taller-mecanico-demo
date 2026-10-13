import React from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Folder } from 'lucide-react';
import { GoogleSheetInfo } from '../types/service';

interface SheetStatusBannerProps {
  sheetInfo: GoogleSheetInfo | null;
  isConnected: boolean;
  isSyncing: boolean;
  syncError: string | null;
  onConnect: () => void;
  onSync: () => void;
  servicesCount: number;
}

export const SheetStatusBanner: React.FC<SheetStatusBannerProps> = ({
  sheetInfo,
  isConnected,
  isSyncing,
  syncError,
  onConnect,
  onSync,
  servicesCount,
}) => {
  if (!isConnected || !sheetInfo) {
    return (
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 sm:p-5 mb-6 text-slate-200 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Sincronización con Google Sheets
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Conecta tu cuenta de Google para guardar, consultar y editar tus registros directamente en tu propia hoja de cálculo en Google Drive. Actualmente operando con respaldo local seguro.
              </p>
            </div>
          </div>
          <button
            onClick={onConnect}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap min-h-[44px] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Vincular Hoja en Google Drive</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 mb-6 text-slate-300">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Google Sheets Vinculado:</span>
          </div>
          <span className="text-white font-medium">{sheetInfo.title}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono tabular-nums">{servicesCount} servicios registrados</span>
          {sheetInfo.lastSyncedAt && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                Sincronizado: {new Date(sheetInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
          {syncError && (
            <span className="flex items-center gap-1 text-rose-400 text-[11px] mr-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {syncError}
            </span>
          )}

          {sheetInfo.folderUrl && (
            <a
              href={sheetInfo.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors min-h-[36px]"
              title="Abrir carpeta en Google Drive"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Carpeta Drive</span>
            </a>
          )}

          <a
            href={sheetInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors min-h-[36px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Hoja</span>
          </a>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-colors disabled:opacity-50 min-h-[36px] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
