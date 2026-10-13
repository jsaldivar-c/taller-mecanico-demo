import React, { useState, useEffect } from 'react';
import {
  Car,
  User,
  Calendar,
  FileText,
  Package,
  Plus,
  Trash2,
  Save,
  Clock,
  Sparkles,
  Check,
  Truck,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import { WorkshopService, ServiceProduct, ServiceStatus } from '../types/service';

interface ServiceFormProps {
  initialService?: WorkshopService | null;
  onSave: (service: WorkshopService) => Promise<void>;
  onCancel?: () => void;
  isSaving: boolean;
  sheetConnected: boolean;
}

const COMMON_PROCEDURES = [
  'Cambio de aceite sintético, filtro y revisión de 21 puntos',
  'Mantenimiento de frenos delanteros y rectificado de discos',
  'Afinación mayor de motor (bujías, filtros y lavado inyectores)',
  'Inspección y cambio de amortiguadores / suspensión',
  'Diagnóstico electrónico computarizado con escáner OBD-II',
  'Mantenimiento de sistema de enfriamiento y purgado',
];

const QUICK_PRODUCTS = [
  { name: 'Aceite Sintético 5W-30 (Galón)', price: 38.0 },
  { name: 'Filtro de Aceite Automotriz', price: 14.0 },
  { name: 'Filtro de Aire Motor', price: 18.0 },
  { name: 'Filtro de Cabina / A/C', price: 16.0 },
  { name: 'Juego de Pastillas Cerámicas', price: 55.0 },
  { name: 'Líquido de Frenos DOT 4', price: 8.5 },
  { name: 'Refrigerante 50/50 (Galón)', price: 20.0 },
  { name: 'Bujías de Iridio (Set 4)', price: 44.0 },
];

export const ServiceForm: React.FC<ServiceFormProps> = ({
  initialService,
  onSave,
  onCancel,
  isSaving,
  sheetConnected,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [mileage, setMileage] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ServiceStatus>('pending');
  const [procedure, setProcedure] = useState('');
  const [notes, setNotes] = useState('');
  const [laborCost, setLaborCost] = useState<number>(50);
  const [products, setProducts] = useState<ServiceProduct[]>([
    { id: 'prod-init-1', name: '', quantity: 1, unitPrice: 0, subtotal: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialService) {
      setClientName(initialService.clientName);
      setClientPhone(initialService.clientPhone);
      setClientEmail(initialService.clientEmail || '');
      setVehicleModel(initialService.vehicleModel);
      setPlateNumber(initialService.plateNumber);
      setMileage(initialService.mileage || '');
      setDate(initialService.date);
      setStatus(initialService.status);
      setProcedure(initialService.procedure);
      setNotes(initialService.notes || '');
      setLaborCost(initialService.laborCost);
      if (initialService.products && initialService.products.length > 0) {
        setProducts(initialService.products);
      } else {
        setProducts([{ id: 'p1', name: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
      }
    } else {
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setVehicleModel('');
      setPlateNumber('');
      setMileage('');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('pending');
      setProcedure('');
      setNotes('');
      setLaborCost(50);
      setProducts([{ id: 'prod-1', name: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
    }
  }, [initialService]);

  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      { id: `prod-${Date.now()}`, name: '', quantity: 1, unitPrice: 0, subtotal: 0 },
    ]);
  };

  const handleQuickAddProduct = (quickItem: { name: string; price: number }) => {
    if (products.length === 1 && !products[0].name.trim() && products[0].unitPrice === 0) {
      setProducts([
        {
          id: `prod-${Date.now()}`,
          name: quickItem.name,
          quantity: 1,
          unitPrice: quickItem.price,
          subtotal: quickItem.price,
        },
      ]);
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        id: `prod-${Date.now()}`,
        name: quickItem.name,
        quantity: 1,
        unitPrice: quickItem.price,
        subtotal: quickItem.price,
      },
    ]);
  };

  const handleUpdateProduct = (
    index: number,
    field: 'name' | 'quantity' | 'unitPrice',
    val: any
  ) => {
    setProducts((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'name') {
        item.name = val;
      } else if (field === 'quantity') {
        const qty = parseFloat(val) || 0;
        item.quantity = qty;
        item.subtotal = qty * item.unitPrice;
      } else if (field === 'unitPrice') {
        const price = parseFloat(val) || 0;
        item.unitPrice = price;
        item.subtotal = item.quantity * price;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveProduct = (index: number) => {
    if (products.length <= 1) {
      setProducts([{ id: `prod-${Date.now()}`, name: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
      return;
    }
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const productsTotal = products.reduce((acc, p) => acc + (p.subtotal || 0), 0);
  const grandTotal = (laborCost || 0) + productsTotal;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clientName.trim()) errs.clientName = 'Ingresa el nombre del cliente';
    if (!vehicleModel.trim()) errs.vehicleModel = 'Ingresa marca y modelo del vehículo';
    if (!plateNumber.trim()) errs.plateNumber = 'Ingresa la placa vehicular';
    if (!date) errs.date = 'Selecciona la fecha';
    if (!procedure.trim()) errs.procedure = 'Describe el procedimiento a realizar';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanedProducts = products.filter(
      (p) => p.name.trim().length > 0 || p.unitPrice > 0
    );

    const serviceData: WorkshopService = {
      id: initialService?.id || `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      rowNumber: initialService?.rowNumber,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      vehicleModel: vehicleModel.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      mileage: mileage.trim() || undefined,
      date,
      procedure: procedure.trim(),
      products: cleanedProducts,
      laborCost: Number(laborCost) || 0,
      totalCost: Number(grandTotal) || 0,
      status,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await onSave(serviceData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Header / Back button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg bg-slate-950 sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {initialService ? 'Editar Servicio' : 'Nuevo Servicio'}
              {initialService && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {initialService.id}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              Registra los datos del vehículo, cliente y cotización.
            </p>
          </div>
        </div>

        {/* Date input in header */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Status Selector (Thumb-friendly 2x2 grid on mobile, row on tablet) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Estado del Servicio
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setStatus('pending')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              status === 'pending'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Pendiente</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus('in_progress')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>En Proceso</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus('completed')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
            }`}
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Terminado</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus('delivered')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              status === 'delivered'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Entregado</span>
          </button>
        </div>
      </div>

      {/* Grid: Cliente & Vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-800/80">
        {/* Vehículo First (Mobile Mechanic Priority) */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Car className="w-4 h-4" />
            <span>Datos del Vehículo</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Vehículo (Marca, Modelo, Año) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Ej. Chevrolet Spark 2018"
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px] transition-colors ${
                errors.vehicleModel ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.vehicleModel && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.vehicleModel}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Placa <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="XYZ-1244"
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm font-mono tracking-wider uppercase text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px] ${
                  errors.plateNumber ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.plateNumber && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.plateNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kilometraje
              </label>
              <input
                type="text"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="Ej. 75,000 km"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Cliente Info */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <User className="w-4 h-4" />
            <span>Datos del Cliente</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre del Cliente <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej. Roberto Sánchez"
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px] transition-colors ${
                errors.clientName ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.clientName && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.clientName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="5555555555"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo (Opcional)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="cliente@correo.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Procedimiento */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
          <FileText className="w-4 h-4" />
          <span>Procedimiento a Realizar <span className="text-rose-400">*</span></span>
        </div>

        <textarea
          required
          rows={3}
          value={procedure}
          onChange={(e) => setProcedure(e.target.value)}
          placeholder="Describe el trabajo mecánico, afinación, cambio de aceite o diagnóstico a realizar..."
          className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed ${
            errors.procedure ? 'border-rose-500' : 'border-slate-800'
          }`}
        />
        {errors.procedure && (
          <p className="text-[11px] text-rose-400 mt-0.5">{errors.procedure}</p>
        )}

        {/* Quick Suggestions Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
          <span className="text-[11px] text-slate-500 shrink-0">Atajos:</span>
          {COMMON_PROCEDURES.slice(0, 3).map((proc, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setProcedure(proc)}
              className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 shrink-0 transition-colors whitespace-nowrap min-h-[32px]"
            >
              {proc.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Productos / Repuestos Utilizados */}
      <div className="pt-2 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Package className="w-4 h-4" />
            <span>Productos Utilizados</span>
          </div>
          <button
            type="button"
            onClick={handleAddProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors min-h-[36px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Insumos frecuentes scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] text-slate-500 shrink-0">Comunes:</span>
          {QUICK_PRODUCTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAddProduct(qp)}
              className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap min-h-[32px]"
            >
              <span>+ {qp.name.split('(')[0].trim()}</span>
              <span className="text-amber-400 font-mono">${qp.price}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Product Cards / Rows (Responsive for touch) */}
        <div className="space-y-2.5">
          {products.map((prod, index) => (
            <div
              key={prod.id || index}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5"
            >
              {/* Product Description */}
              <input
                type="text"
                value={prod.name}
                onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                placeholder="Nombre del producto o repuesto (ej: Aceite 5W-30)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[40px]"
              />

              {/* Quantities, Unit Price, Subtotal, Delete in one touch row */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 sm:col-span-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-500">Cant:</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={prod.quantity || 1}
                      onChange={(e) => handleUpdateProduct(index, 'quantity', e.target.value)}
                      className="w-full pl-9 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={prod.unitPrice || 0}
                      onChange={(e) => handleUpdateProduct(index, 'unitPrice', e.target.value)}
                      placeholder="Precio"
                      className="w-full pl-6 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-4 text-right">
                  <span className="text-xs sm:text-sm font-mono font-semibold text-slate-100 tabular-nums">
                    ${(prod.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                <div className="col-span-1 sm:col-span-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Costos y Totales (Resumen financiero) */}
      <div className="pt-3 border-t border-slate-800 bg-slate-950/80 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Mano de Obra ($)
            </label>
            <div className="relative w-full sm:w-36">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={laborCost}
                onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px]"
              />
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-1 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <div>Repuestos: <strong className="font-mono text-slate-200">${productsTotal.toFixed(2)}</strong></div>
            <div>Mano de Obra: <strong className="font-mono text-slate-200">${Number(laborCost).toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total a Pagar
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            ${grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Observaciones o Notas Técnicas (Opcional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Diagnóstico visual favorable. Próxima afinación sugerida en 10,000 km."
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px]"
        />
      </div>

      {/* Form Action Buttons (Full width on mobile) */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-400 order-2 sm:order-1 text-center sm:text-left">
          {sheetConnected
            ? '✓ Se sincronizará automáticamente en Google Sheets'
            : '✓ Se guardará en el almacenamiento local seguro'}
        </span>

        <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors min-h-[48px] cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 min-h-[48px] cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{isSaving ? 'Guardando...' : initialService ? 'Actualizar Servicio' : 'Registrar Servicio'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
