import React from 'react';
import { X, Printer, Wrench, Edit3, CheckCircle, Clock, Truck, Sparkles } from 'lucide-react';
import { WorkshopService } from '../types/service';

interface WorkOrderModalProps {
  service: WorkshopService | null;
  onClose: () => void;
  onEdit: (service: WorkshopService) => void;
  sheetUrl?: string;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  service,
  onClose,
  onEdit,
  sheetUrl,
}) => {
  if (!service) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            En Proceso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            Terminado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Truck className="w-3.5 h-3.5" />
            Entregado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-slate-200">
        {/* Top Actions in Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-500 font-bold">{service.id}</span>
            <span className="text-slate-600">·</span>
            {getStatusBadge(service.status)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(service)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-md transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Work Order Body */}
        <div className="pt-6 space-y-6 print:text-black">
          {/* Workshop Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white tracking-tight">AutoTaller OS</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Orden de Trabajo & Hoja de Servicio</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Fecha de Emisión: {service.date}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Folio / ID</span>
              <span className="text-xl font-bold font-mono text-amber-400">{service.id}</span>
              {service.rowNumber && (
                <span className="text-[10px] text-slate-500 block font-mono">
                  Fila Sheets: #{service.rowNumber}
                </span>
              )}
            </div>
          </div>

          {/* Customer & Vehicle Info Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Cliente</span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">{service.clientName}</p>
              {service.clientPhone && (
                <p className="text-slate-300 font-mono mt-0.5">Tel: {service.clientPhone}</p>
              )}
              {service.clientEmail && (
                <p className="text-slate-400 mt-0.5">{service.clientEmail}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Vehículo</span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">{service.vehicleModel}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold text-amber-300 text-xs">
                  {service.plateNumber}
                </span>
                {service.mileage && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    {service.mileage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Procedure */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 block mb-1.5">
              Procedimiento Realizado
            </span>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200">
              {service.procedure}
            </div>
          </div>

          {/* Products List */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 block mb-1.5">
              Productos y Repuestos Utilizados
            </span>
            {service.products && service.products.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">Precio Unit.</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                    {service.products.map((prod, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-200 font-sans">{prod.name}</td>
                        <td className="py-2 px-3 text-center text-slate-400 tabular-nums">{prod.quantity}</td>
                        <td className="py-2 px-3 text-right text-slate-400 tabular-nums">
                          ${prod.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200 font-medium tabular-nums">
                          ${prod.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg border border-slate-800">
                No se registraron productos o repuestos adicionales para este servicio.
              </p>
            )}
          </div>

          {/* Financial summary */}
          <div className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 space-y-1">
              <div>Mano de Obra: <strong className="text-slate-200 font-mono">${service.laborCost.toFixed(2)}</strong></div>
              <div>
                Repuestos: <strong className="text-slate-200 font-mono">
                  ${(service.totalCost - service.laborCost).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Total a Pagar</span>
              <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                ${service.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {service.notes && (
            <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
              <strong className="text-slate-300">Observaciones Técnicas:</strong> {service.notes}
            </div>
          )}

          {/* Signatures for physical printing */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <div>
              <div className="border-b border-slate-700 w-3/4 mx-auto mb-2 h-10"></div>
              <span>Firma del Asesor de Servicio</span>
            </div>
            <div>
              <div className="border-b border-slate-700 w-3/4 mx-auto mb-2 h-10"></div>
              <span>Firma del Cliente (Conforme)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
