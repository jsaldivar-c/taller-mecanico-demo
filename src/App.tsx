import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/auth';
import {
  createWorkshopSpreadsheet,
  findExistingSpreadsheet,
  getServicesFromSheet,
  appendServiceToSheet,
  updateServiceInSheet,
} from './services/sheetsService';
import {
  loadLocalServices,
  saveLocalServices,
  loadSheetInfo,
  saveSheetInfo,
} from './services/storage';
import { WorkshopService, ServiceStatus, GoogleSheetInfo } from './types/service';
import { Header } from './components/Header';
import { SheetStatusBanner } from './components/SheetStatusBanner';
import { ServiceList } from './components/ServiceList';
import { ServiceForm } from './components/ServiceForm';
import { WorkOrderModal } from './components/WorkOrderModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [services, setServices] = useState<WorkshopService[]>(() => loadLocalServices());
  const [user, setUser] = useState<User | null>(null);
  const [sheetInfo, setSheetInfo] = useState<GoogleSheetInfo | null>(() => loadSheetInfo());
  const [currentView, setCurrentView] = useState<'list' | 'new'>('list');
  const [selectedServiceForView, setSelectedServiceForView] = useState<WorkshopService | null>(null);
  const [editingService, setEditingService] = useState<WorkshopService | null>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Refs to prevent infinite render loops and throttle API requests
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);
  const sheetInfoRef = useRef<GoogleSheetInfo | null>(sheetInfo);

  useEffect(() => {
    sheetInfoRef.current = sheetInfo;
  }, [sheetInfo]);

  // Notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Confirmation modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Sync with Google Sheets with strict rate-limit protection
  const syncWithSheet = useCallback(
    async (token: string, currentSheet: GoogleSheetInfo, force = false) => {
      if (isSyncingRef.current) return;

      // Throttle: don't sync if last synced less than 15s ago unless forced
      const now = Date.now();
      if (!force && now - lastSyncTimeRef.current < 15000) {
        return;
      }

      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const remoteServices = await getServicesFromSheet(currentSheet.id, token);
        if (remoteServices.length > 0) {
          // Merge remote services with local services
          setServices((prev) => {
            const mergedMap = new Map<string, WorkshopService>();
            remoteServices.forEach((s) => mergedMap.set(s.id, s));
            prev.forEach((s) => {
              if (!mergedMap.has(s.id)) {
                mergedMap.set(s.id, s);
              }
            });
            const merged = Array.from(mergedMap.values());
            saveLocalServices(merged);
            return merged;
          });
        }

        const updatedInfo: GoogleSheetInfo = {
          ...currentSheet,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetInfo(updatedInfo);
        saveSheetInfo(updatedInfo);
        sheetInfoRef.current = updatedInfo;
        showToast('Datos sincronizados con Google Sheets correctamente', 'success');
      } catch (err: any) {
        console.error('Error al sincronizar con Sheets:', err);
        setSyncError(err?.message || 'Error al conectar con la hoja');
        showToast(err?.message || 'Error de sincronización con Google Sheets', 'error');
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    []
  );

  // Connect or create Google Sheet
  const setupSheet = useCallback(
    async (token: string) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        let isNewSheet = false;
        // Check if existing sheet exists in user's Drive
        let sheet = await findExistingSpreadsheet(token);
        if (!sheet) {
          sheet = await createWorkshopSpreadsheet(token);
          isNewSheet = true;
          showToast('Hoja "AutoTaller - Control de Servicios" creada en Google Drive', 'success');
        } else {
          showToast('Hoja de cálculo existente vinculada exitosamente', 'success');
        }

        const info: GoogleSheetInfo = {
          id: sheet.id,
          title: sheet.title,
          url: sheet.url,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetInfo(info);
        saveSheetInfo(info);
        sheetInfoRef.current = info;
        lastSyncTimeRef.current = Date.now();

        // Release lock before child sync
        isSyncingRef.current = false;
        setIsSyncing(false);

        // If newly created, populate existing local services into the new sheet
        if (isNewSheet) {
          const localList = loadLocalServices();
          for (const s of localList) {
            try {
              await appendServiceToSheet(info.id, token, s);
            } catch (appendErr) {
              console.warn('Error al subir servicio inicial a Sheets:', appendErr);
            }
          }
        } else {
          // If sheet already existed, pull records from it
          await syncWithSheet(token, info, true);
        }
      } catch (err: any) {
        console.error('Error configurando hoja:', err);
        setSyncError(err.message || 'Error al configurar la hoja en Google Sheets');
        showToast('Error al vincular con Google Sheets: ' + err.message, 'error');
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [syncWithSheet]
  );

  // Initialize Firebase Auth listener on load ONCE (empty dependency array)
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        setCachedAccessToken(token);
        const currentSheet = sheetInfoRef.current || loadSheetInfo();
        // Only auto-sync if we have a sheet and at least 30s have elapsed
        if (currentSheet && Date.now() - lastSyncTimeRef.current > 30000) {
          syncWithSheet(token, currentSheet, false);
        }
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, [syncWithSheet]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        await setupSheet(result.accessToken);
      }
    } catch (err: any) {
      console.error('Error en autenticación:', err);
      showToast('No se pudo conectar con Google: ' + (err?.message || 'Permiso denegado'), 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    showToast('Sesión de Google cerrada', 'info');
  };

  const handleManualSync = async () => {
    const token = await getAccessToken();
    if (!token) {
      handleLogin();
      return;
    }
    const currentSheet = sheetInfoRef.current || sheetInfo;
    if (currentSheet) {
      await syncWithSheet(token, currentSheet, true);
    } else {
      await setupSheet(token);
    }
  };

  // Save new service or update existing service
  const handleSaveService = async (serviceData: WorkshopService) => {
    const isEditing = !!editingService;
    const token = await getAccessToken();

    // If editing and Google Sheets is connected, require explicit confirmation dialog (per Workspace skill rules)
    if (isEditing && token && sheetInfo) {
      setConfirmModalState({
        isOpen: true,
        title: '¿Confirmar actualización en Google Sheets?',
        message: `Se actualizará el registro del vehículo ${serviceData.plateNumber} (${serviceData.vehicleModel}) tanto localmente como en la hoja de cálculo vinculada.`,
        confirmLabel: 'Actualizar Registro',
        onConfirm: async () => {
          setConfirmModalState(null);
          await executeSaveService(serviceData, isEditing, token);
        },
      });
      return;
    }

    await executeSaveService(serviceData, isEditing, token);
  };

  const executeSaveService = async (
    serviceData: WorkshopService,
    isEditing: boolean,
    token: string | null
  ) => {
    setIsSaving(true);
    try {
      let finalService = { ...serviceData };

      // Update in Google Sheets if connected
      if (token && sheetInfo) {
        try {
          if (isEditing && finalService.rowNumber) {
            await updateServiceInSheet(sheetInfo.id, token, finalService.rowNumber, finalService);
          } else {
            const newRow = await appendServiceToSheet(sheetInfo.id, token, finalService);
            if (newRow > 0) {
              finalService.rowNumber = newRow;
            }
          }
        } catch (sheetErr: any) {
          console.error('Error guardando en Google Sheets:', sheetErr);
          showToast('Guardado localmente. Error al escribir en Google Sheets: ' + sheetErr.message, 'error');
        }
      }

      // Update local state
      setServices((prev) => {
        let updated: WorkshopService[];
        if (isEditing) {
          updated = prev.map((s) => (s.id === finalService.id ? finalService : s));
        } else {
          updated = [finalService, ...prev];
        }
        saveLocalServices(updated);
        return updated;
      });

      showToast(
        isEditing
          ? `Servicio ${finalService.id} actualizado correctamente`
          : `Servicio para placa ${finalService.plateNumber} registrado con éxito`,
        'success'
      );

      // Return to list view
      setEditingService(null);
      setCurrentView('list');
    } catch (err: any) {
      console.error('Error al guardar servicio:', err);
      showToast('Error al guardar el servicio: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick status change from list table
  const handleStatusChange = async (service: WorkshopService, newStatus: ServiceStatus) => {
    if (service.status === newStatus) return;

    const token = await getAccessToken();

    // Confirm dialog for status update on Google Sheets
    setConfirmModalState({
      isOpen: true,
      title: '¿Cambiar estado del servicio?',
      message: `El servicio ${service.id} (${service.plateNumber}) pasará de "${service.status}" a "${newStatus}". Se sincronizará el cambio con Google Sheets.`,
      confirmLabel: 'Confirmar Cambio',
      onConfirm: async () => {
        setConfirmModalState(null);
        const updatedService: WorkshopService = {
          ...service,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        if (token && sheetInfo && service.rowNumber) {
          try {
            await updateServiceInSheet(sheetInfo.id, token, service.rowNumber, updatedService);
          } catch (err: any) {
            console.error('Error actualizando estado en Sheets:', err);
            showToast('Actualizado localmente. Error en Sheets: ' + err.message, 'error');
          }
        }

        setServices((prev) => {
          const updated = prev.map((s) => (s.id === service.id ? updatedService : s));
          saveLocalServices(updated);
          return updated;
        });

        showToast(`Estado de ${service.plateNumber} actualizado a ${newStatus}`, 'success');
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium max-w-md ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-slate-900 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalState && (
        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          title={confirmModalState.title}
          message={confirmModalState.message}
          confirmLabel={confirmModalState.confirmLabel}
          isDestructive={confirmModalState.isDestructive}
          onConfirm={confirmModalState.onConfirm}
          onCancel={() => setConfirmModalState(null)}
        />
      )}

      {/* Work Order Modal */}
      {selectedServiceForView && (
        <WorkOrderModal
          service={selectedServiceForView}
          onClose={() => setSelectedServiceForView(null)}
          onEdit={(srv) => {
            setSelectedServiceForView(null);
            setEditingService(srv);
            setCurrentView('new');
          }}
          sheetUrl={sheetInfo?.url}
        />
      )}

      {/* Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'new') {
            setEditingService(null);
          }
          setCurrentView(view);
        }}
        user={user}
        sheetInfo={sheetInfo}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Status Banner */}
        <SheetStatusBanner
          sheetInfo={sheetInfo}
          isConnected={!!user && !!sheetInfo}
          isSyncing={isSyncing}
          syncError={syncError}
          onConnect={handleLogin}
          onSync={handleManualSync}
          servicesCount={services.length}
        />

        {currentView === 'list' ? (
          <ServiceList
            services={services}
            onNewService={() => {
              setEditingService(null);
              setCurrentView('new');
            }}
            onViewService={(srv) => setSelectedServiceForView(srv)}
            onEditService={(srv) => {
              setEditingService(srv);
              setCurrentView('new');
            }}
            onStatusChange={handleStatusChange}
            sheetUrl={sheetInfo?.url}
          />
        ) : (
          <ServiceForm
            initialService={editingService}
            onSave={handleSaveService}
            onCancel={() => {
              setEditingService(null);
              setCurrentView('list');
            }}
            isSaving={isSaving}
            sheetConnected={!!user && !!sheetInfo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080c13] py-5 px-4 lg:px-8 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AutoTaller OS · Sistema de Gestión de Servicios Automotrices</span>
          <span className="flex items-center gap-1.5">
            <span>Sincronizado con Google Sheets</span>
            {sheetInfo && (
              <>
                <span>·</span>
                <a
                  href={sheetInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:underline"
                >
                  Abrir Hoja de Cálculo
                </a>
              </>
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
