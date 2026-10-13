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
  CheckCircle,
  Clock,
  Check,
  Truck,
  Sparkles,
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
  'Cambio de aceite sintético, filtro y revisión de 21 puntos de seguridad',
  'Mantenimiento integral del sistema de frenos y rectificado de discos',
  'Afinación mayor de motor (bujías de iridio, filtros y limpieza de inyectores)',
  'Inspección y sustitución de amortiguadores y terminales de suspensión',
  'Diagnóstico electrónico computarizado con escáner OBD-II',
  'Mantenimiento del sistema de enfriamiento y purgado de refrigerante',
];

const QUICK_PRODUCTS = [
  { name: 'Aceite Sintético 5W-30 (Galón)', price: 38.0 },
  { name: 'Filtro de Aceite Automotriz', price: 14.0 },
  { name: 'Filtro de Aire Motor', price: 18.0 },
  { name: 'Filtro de Cabina / A/C', price: 16.0 },
  { name: 'Juego de Pastillas Cerámicas', price: 55.0 },
  { name: 'Líquido de Frenos DOT 4 (500ml)', price: 8.5 },
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
      // Reset defaults
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
    // If first item is empty, replace it
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
    if (!clientName.trim()) errs.clientName = 'El nombre del cliente es obligatorio';
    if (!vehicleModel.trim()) errs.vehicleModel = 'El vehículo (marca/modelo) es obligatorio';
    if (!plateNumber.trim()) errs.plateNumber = 'La placa vehicular es obligatoria';
    if (!date) errs.date = 'La fecha es obligatoria';
    if (!procedure.trim()) errs.procedure = 'El procedimiento a realizar es obligatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Filter out completely blank product rows
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
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl max-w-4xl mx-auto">
      {/* Header Form Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {initialService ? 'Editar Registro de Servicio' : 'Nuevo Servicio Automotriz'}
            {initialService && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {initialService.id}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingresa los detalles técnicos, repuestos requeridos y cotización del trabajo.
          </p>
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatus('pending')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              status === 'pending'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendiente
          </button>
          <button
            type="button"
            onClick={() => setStatus('in_progress')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            En Proceso
          </button>
          <button
            type="button"
            onClick={() => setStatus('completed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Terminado
          </button>
          <button
            type="button"
            onClick={() => setStatus('delivered')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              status === 'delivered'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            Entregado
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Cliente & Vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente Info */}
          <div className="space-y-4">
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
                placeholder="Ej. Roberto Sánchez Gómez"
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
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
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej. +52 55 9876 5432"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Vehículo Info */}
          <div className="space-y-4">
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
                placeholder="Ej. Toyota Corolla 2.0L 2021"
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
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
                  Placa Vehicular <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="XYZ-1234"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-sm font-mono tracking-wider uppercase text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      errors.plateNumber ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                </div>
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
                  placeholder="Ej. 65,000 km"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fecha y Procedimiento */}
        <div className="pt-2 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <FileText className="w-4 h-4" />
              <span>Procedimiento y Trabajo Solicitado</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs text-slate-400">Fecha del Servicio:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <textarea
              required
              rows={3}
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="Describe detalladamente el trabajo mecánico, afinación o diagnóstico a realizar..."
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed ${
                errors.procedure ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.procedure && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.procedure}</p>
            )}

            {/* Quick Suggestions for procedures */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Sugerencias rápidas:</span>
              {COMMON_PROCEDURES.slice(0, 3).map((proc, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setProcedure(proc)}
                  className="text-[11px] px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
                >
                  {proc.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Productos y Repuestos Utilizados */}
        <div className="pt-2 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Package className="w-4 h-4" />
              <span>Productos y Repuestos Utilizados</span>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Producto
            </button>
          </div>

          {/* Quick chip selector */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-slate-400">Insumos frecuentes:</span>
            {QUICK_PRODUCTS.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickAddProduct(qp)}
                className="text-[11px] px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors flex items-center gap-1"
              >
                <span>+ {qp.name.split('(')[0].trim()}</span>
                <span className="text-amber-400 font-mono">${qp.price}</span>
              </button>
            ))}
          </div>

          {/* Products Dynamic Table */}
          <div className="space-y-2">
            {products.map((prod, index) => (
              <div
                key={prod.id || index}
                className="grid grid-cols-12 gap-2 items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80"
              >
                <div className="col-span-12 sm:col-span-6">
                  <input
                    type="text"
                    value={prod.name}
                    onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                    placeholder="Descripción del producto o repuesto (ej: Filtro de aceite)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-500">Cant:</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={prod.quantity || 1}
                      onChange={(e) => handleUpdateProduct(index, 'quantity', e.target.value)}
                      className="w-full pl-9 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={prod.unitPrice || 0}
                      onChange={(e) => handleUpdateProduct(index, 'unitPrice', e.target.value)}
                      placeholder="Precio"
                      className="w-full pl-6 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-1 text-right">
                  <span className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                    ${(prod.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                <div className="col-span-1 sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Costos y Totales */}
        <div className="pt-4 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Mano de Obra ($)
              </label>
              <div className="relative w-32">
                <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm text-slate-100 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 pl-4 border-l border-slate-800">
              <span className="block">Repuestos: <strong className="font-mono text-slate-200">${productsTotal.toFixed(2)}</strong></span>
              <span className="block mt-0.5">Mano de Obra: <strong className="font-mono text-slate-200">${Number(laborCost).toFixed(2)}</strong></span>
            </div>
          </div>

          <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Total del Servicio</span>
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Notas u Observaciones del Taller (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Diagnóstico visual favorable. Próximo cambio de aceite recomendado en 5,000 km."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          {sheetConnected ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Se guardará y sincronizará directamente en Google Sheets</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Se guardará en el almacenamiento local seguro</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : initialService ? 'Actualizar en Google Sheets' : 'Registrar Servicio'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
