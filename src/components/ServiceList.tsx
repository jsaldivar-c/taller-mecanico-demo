import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Eye,
  Edit,
  Clock,
  Sparkles,
  CheckCircle,
  Truck,
  Car,
  Phone,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { WorkshopService, ServiceStatus } from '../types/service';

interface ServiceListProps {
  services: WorkshopService[];
  onNewService: () => void;
  onViewService: (service: WorkshopService) => void;
  onEditService: (service: WorkshopService) => void;
  onStatusChange: (service: WorkshopService, newStatus: ServiceStatus) => void;
  sheetUrl?: string;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  onNewService,
  onViewService,
  onEditService,
  onStatusChange,
  sheetUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  const filteredServices = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekStr = sevenDaysAgo.toISOString().split('T')[0];

    return services.filter((srv) => {
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        srv.clientName.toLowerCase().includes(term) ||
        srv.plateNumber.toLowerCase().includes(term) ||
        srv.vehicleModel.toLowerCase().includes(term) ||
        srv.id.toLowerCase().includes(term) ||
        srv.procedure.toLowerCase().includes(term);

      // Status filter
      const matchesStatus = statusFilter === 'all' || srv.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = srv.date === todayStr;
      } else if (dateFilter === 'week') {
        matchesDate = srv.date >= weekStr;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [services, searchTerm, statusFilter, dateFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const active = services.filter((s) => s.status === 'pending' || s.status === 'in_progress').length;
    const completed = services.filter((s) => s.status === 'completed' || s.status === 'delivered').length;
    const revenue = services.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    return {
      total: services.length,
      active,
      completed,
      revenue,
    };
  }, [services]);

  const renderStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-amber-400" />
            En Proceso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Terminado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 whitespace-nowrap">
            <Truck className="w-3 h-3 text-blue-400" />
            Entregado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            <Clock className="w-3 h-3 text-slate-400" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Workshop Metric Strip (Responsive 2x2 grid on mobile, 4 columns on lg) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Total Servicios
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 sm:mt-1 block tabular-nums">
            {stats.total}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block truncate">
            Historial del taller
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] font-medium text-amber-400 block uppercase tracking-wider">
            En Taller Ahora
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5 sm:mt-1 block tabular-nums">
            {stats.active}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block truncate">
            Pendientes / Proceso
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 block uppercase tracking-wider">
            Finalizados
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5 sm:mt-1 block tabular-nums">
            {stats.completed}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block truncate">
            Listos / Entregados
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Monto Servicios
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 sm:mt-1 block tabular-nums">
            ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block truncate">
            Total facturado
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, cliente o vehículo..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors min-h-[44px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-3 text-slate-500 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-between md:justify-end">
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px] flex-1 md:flex-none"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Servicios de Hoy</option>
              <option value="week">Últimos 7 días</option>
            </select>

            {/* New service action button (visible on tablet/desktop, mobile has bottom bar) */}
            <button
              onClick={onNewService}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap min-h-[44px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* Status Filter Horizontal Scroller */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 text-[11px] mr-1 shrink-0 hidden sm:inline">Estado:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
              statusFilter === 'pending'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
              statusFilter === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            En Proceso
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Terminados
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
              statusFilter === 'delivered'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Entregados
          </button>
        </div>
      </div>

      {/* Zero Results State */}
      {filteredServices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl text-center py-12 px-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No se encontraron servicios</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'No hay registros que coincidan con los filtros aplicados. Intenta reiniciar la búsqueda.'
              : 'Aún no se han registrado servicios en el taller. Haz clic en el botón para agregar el primero.'}
          </p>
          {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="text-xs text-amber-400 hover:underline pt-2 inline-block cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          ) : (
            <button
              onClick={onNewService}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all min-h-[44px] cursor-pointer"
            >
              Registrar Primer Servicio
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* MOBILE / SMARTPHONE CARD VIEW (< md)                           */}
          {/* Touch-optimized cards with high readability and 44px hitboxes */}
          {/* ============================================================== */}
          <div className="space-y-3 md:hidden">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-md space-y-3 transition-all active:border-slate-700"
              >
                {/* Mobile Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-amber-300 text-xs tracking-wider uppercase">
                      {srv.plateNumber}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {srv.id}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {srv.date}
                    </span>
                  </div>
                </div>

                {/* Mobile Card Vehicle & Client */}
                <div>
                  <h4 className="text-sm font-semibold text-white leading-tight">
                    {srv.vehicleModel}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
                    <span>Cliente: <strong className="text-slate-100 font-medium">{srv.clientName}</strong></span>
                    {srv.clientPhone && (
                      <a
                        href={`tel:${srv.clientPhone}`}
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 p-1 font-mono text-[11px]"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Llamar</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Mobile Card Procedure */}
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60 text-xs text-slate-300">
                  <p className="line-clamp-2 leading-relaxed">
                    {srv.procedure}
                  </p>
                  {srv.products && srv.products.length > 0 && (
                    <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                      📦 {srv.products.length} producto(s) utilizado(s)
                    </span>
                  )}
                </div>

                {/* Mobile Card Price and Status Selector */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Total
                    </span>
                    <span className="font-mono text-lg font-bold text-amber-400 tabular-nums block">
                      ${srv.totalCost.toFixed(2)}
                    </span>
                  </div>

                  {/* Inline Status Dropdown with 44px touch target */}
                  <div className="relative">
                    <select
                      value={srv.status}
                      onChange={(e) => onStatusChange(srv, e.target.value as ServiceStatus)}
                      className="text-xs font-semibold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer min-h-[44px]"
                    >
                      <option value="pending">⏳ Pendiente</option>
                      <option value="in_progress">⚙️ En Proceso</option>
                      <option value="completed">✅ Terminado</option>
                      <option value="delivered">🚗 Entregado</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Card Touch Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onViewService(srv)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl min-h-[44px] transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>Ver Orden</span>
                  </button>

                  <button
                    onClick={() => onEditService(srv)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl min-h-[44px] transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ============================================================== */}
          {/* DESKTOP / TABLET HIGH-DENSITY TABLE (hidden on mobile)          */}
          {/* ============================================================== */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Folio / Fecha</th>
                    <th className="py-3 px-4">Vehículo & Placa</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4 max-w-xs">Procedimiento</th>
                    <th className="py-3 px-4 text-right">Repuestos / Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {filteredServices.map((srv) => (
                    <tr
                      key={srv.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Folio / Fecha */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono font-semibold text-amber-400 block">
                          {srv.id}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                          {srv.date}
                        </span>
                      </td>

                      {/* Vehículo & Placa */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded font-mono font-bold text-slate-100 text-[11px] tracking-wider uppercase">
                            {srv.plateNumber}
                          </span>
                          {srv.mileage && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {srv.mileage}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-200 font-medium block mt-1">
                          {srv.vehicleModel}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="text-slate-200 font-medium block">{srv.clientName}</span>
                        {srv.clientPhone && (
                          <a
                            href={`tel:${srv.clientPhone}`}
                            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 mt-0.5 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{srv.clientPhone}</span>
                          </a>
                        )}
                      </td>

                      {/* Procedimiento */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">
                          {srv.procedure}
                        </p>
                        {srv.products && srv.products.length > 0 && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {srv.products.length} producto(s) utilizado(s)
                          </span>
                        )}
                      </td>

                      {/* Repuestos / Total */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <span className="font-mono font-bold text-sm text-slate-100 block tabular-nums">
                          ${srv.totalCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5 tabular-nums">
                          M.O.: ${srv.laborCost.toFixed(2)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="inline-block relative">
                          <select
                            value={srv.status}
                            onChange={(e) => onStatusChange(srv, e.target.value as ServiceStatus)}
                            className="text-[11px] font-medium bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer min-h-[36px]"
                          >
                            <option value="pending">⏳ Pendiente</option>
                            <option value="in_progress">⚙️ En Proceso</option>
                            <option value="completed">✅ Terminado</option>
                            <option value="delivered">🚗 Entregado</option>
                          </select>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewService(srv)}
                            title="Ver Orden de Trabajo / Imprimir"
                            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditService(srv)}
                            title="Editar Registro"
                            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {sheetUrl && (
                            <a
                              href={sheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir en Google Sheets"
                              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
