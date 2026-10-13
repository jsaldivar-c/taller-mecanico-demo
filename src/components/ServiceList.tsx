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

  const renderStatus = (status: ServiceStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-amber-400" />
            En Proceso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Terminado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <Truck className="w-3 h-3 text-blue-400" />
            Entregado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            <Clock className="w-3 h-3 text-slate-400" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Workshop Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Total Servicios
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums">
            {stats.total}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Historial registrado</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-amber-400 block uppercase tracking-wider">
            En Taller Ahora
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block tabular-nums">
            {stats.active}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Pendientes + En proceso</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-emerald-400 block uppercase tracking-wider">
            Finalizados
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
            {stats.completed}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Completados / Entregados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Monto de Servicios
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums">
            ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Mano de obra + repuestos</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, cliente, vehículo o folio..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Servicios de Hoy</option>
              <option value="week">Últimos 7 días</option>
            </select>

            {/* New service action button */}
            <button
              onClick={onNewService}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Nuevo Servicio
            </button>
          </div>
        </div>

        {/* Status Filter Segmented Buttons */}
        <div className="flex items-center gap-1 pt-2 border-t border-slate-800/80 overflow-x-auto text-xs pb-1 sm:pb-0">
          <span className="text-slate-400 text-[11px] mr-2 shrink-0">Filtrar estado:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              statusFilter === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            En Proceso
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Terminados
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ${
              statusFilter === 'delivered'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entregados
          </button>
        </div>
      </div>

      {/* Services High-Density Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
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
                className="text-xs text-amber-400 hover:underline pt-2 inline-block"
              >
                Limpiar todos los filtros
              </button>
            ) : (
              <button
                onClick={onNewService}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Registrar Primer Servicio
              </button>
            )}
          </div>
        ) : (
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
                      <span className="text-[11px] text-slate-400 block mt-0.5">
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
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {srv.clientPhone}
                        </span>
                      )}
                    </td>

                    {/* Procedimiento */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <p className="text-slate-300 line-clamp-2 leading-relaxed">
                        {srv.procedure}
                      </p>
                      {srv.products && srv.products.length > 0 && (
                        <span className="text-[10px] text-slate-500 block mt-1">
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

                    {/* Estado con selector de cambio rápido */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="inline-block relative">
                        <select
                          value={srv.status}
                          onChange={(e) => onStatusChange(srv, e.target.value as ServiceStatus)}
                          className="text-[11px] font-medium bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
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
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditService(srv)}
                          title="Editar Registro"
                          className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {sheetUrl && (
                          <a
                            href={sheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir en Google Sheets"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
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
        )}
      </div>
    </div>
  );
};
