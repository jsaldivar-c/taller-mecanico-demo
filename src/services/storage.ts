import { WorkshopService, GoogleSheetInfo } from '../types/service';

const SERVICES_KEY = 'autotaller_services_v1';
const SHEET_INFO_KEY = 'autotaller_sheet_info_v1';

export const INITIAL_SERVICES: WorkshopService[] = [
  {
    id: 'SRV-1001',
    rowNumber: 2,
    clientName: 'Carlos Mendoza',
    clientPhone: '+52 55 1234 5678',
    clientEmail: 'carlos.mendoza@email.com',
    vehicleModel: 'Toyota Hilux 2.8 D-4D 2021',
    plateNumber: 'PZA-4821',
    mileage: '65,400 km',
    date: '2026-10-12',
    procedure: 'Mantenimiento mayor preventivo: Cambio de aceite sintético, sustitución de filtro de combustible y revisión integral de frenos delanteros.',
    products: [
      { id: 'p1', name: 'Aceite Sintético 5W-30 (Galón)', quantity: 2, unitPrice: 42.5, subtotal: 85.0 },
      { id: 'p2', name: 'Filtro de Aceite OEM Toyota', quantity: 1, unitPrice: 16.0, subtotal: 16.0 },
      { id: 'p3', name: 'Filtro de Combustible Diésel', quantity: 1, unitPrice: 28.5, subtotal: 28.5 },
      { id: 'p4', name: 'Líquido de Frenos DOT 4 (500ml)', quantity: 2, unitPrice: 9.0, subtotal: 18.0 },
    ],
    laborCost: 75.0,
    totalCost: 222.5,
    status: 'in_progress',
    notes: 'Pastillas de freno con 40% de vida restante. Programar cambio en próximo servicio.',
    updatedAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'SRV-1002',
    rowNumber: 3,
    clientName: 'Mariana Duarte',
    clientPhone: '+52 55 8765 4321',
    clientEmail: 'm.duarte@servicios.com',
    vehicleModel: 'Volkswagen Golf TSI 2019',
    plateNumber: 'NEK-9032',
    mileage: '82,150 km',
    date: '2026-10-12',
    procedure: 'Diagnóstico de sobrecalentamiento y sustitución de bomba de agua auxiliar y purgado del sistema de refrigeración.',
    products: [
      { id: 'p5', name: 'Bomba de Agua Auxiliar', quantity: 1, unitPrice: 110.0, subtotal: 110.0 },
      { id: 'p6', name: 'Refrigerante G12 Evo Rosa (Galón)', quantity: 2, unitPrice: 22.0, subtotal: 44.0 },
      { id: 'p7', name: 'Abrazaderas de Presión Reforzadas', quantity: 4, unitPrice: 3.5, subtotal: 14.0 },
    ],
    laborCost: 90.0,
    totalCost: 258.0,
    status: 'pending',
    notes: 'Cliente reportó pérdida leve de refrigerante al dejar estacionado el auto.',
    updatedAt: '2026-10-12T11:15:00Z',
  },
  {
    id: 'SRV-1003',
    rowNumber: 4,
    clientName: 'Roberto Fuentes',
    clientPhone: '+52 55 9988 7766',
    clientEmail: 'rfuentes@logistica.net',
    vehicleModel: 'Ford Ranger XLT 2022',
    plateNumber: 'LMP-1549',
    mileage: '48,200 km',
    date: '2026-10-11',
    procedure: 'Alineación computarizada, balanceo de 4 ruedas y rotación de neumáticos.',
    products: [
      { id: 'p8', name: 'Pesas de Balanceo Adhesivas (Pack)', quantity: 1, unitPrice: 12.0, subtotal: 12.0 },
      { id: 'p9', name: 'Válvulas de Aire Metálicas', quantity: 4, unitPrice: 4.0, subtotal: 16.0 },
    ],
    laborCost: 45.0,
    totalCost: 73.0,
    status: 'completed',
    notes: 'Presión calibrada a 35 PSI en las cuatro ruedas. Listo para entrega.',
    updatedAt: '2026-10-11T17:40:00Z',
  },
  {
    id: 'SRV-1004',
    rowNumber: 5,
    clientName: 'Andrea Solís',
    clientPhone: '+52 55 3344 5566',
    clientEmail: 'andrea.solis@tech.io',
    vehicleModel: 'Honda Civic Turbo 2020',
    plateNumber: 'TRX-7714',
    mileage: '53,000 km',
    date: '2026-10-10',
    procedure: 'Servicio de frenos: Reemplazo de pastillas delanteras de cerámica y rectificado de discos.',
    products: [
      { id: 'p10', name: 'Juego de Pastillas Cerámicas Akebono', quantity: 1, unitPrice: 68.0, subtotal: 68.0 },
      { id: 'p11', name: 'Limpiador de Frenos Brake Cleaner (Spray)', quantity: 2, unitPrice: 7.5, subtotal: 15.0 },
    ],
    laborCost: 55.0,
    totalCost: 138.0,
    status: 'delivered',
    notes: 'Vehículo entregado a satisfacción. Garantía de 6 meses en mano de obra.',
    updatedAt: '2026-10-10T18:00:00Z',
  },
];

export const loadLocalServices = (): WorkshopService[] => {
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error al leer caché local de servicios:', err);
  }
  return INITIAL_SERVICES;
};

export const saveLocalServices = (services: WorkshopService[]) => {
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  } catch (err) {
    console.warn('Error al guardar servicios en caché local:', err);
  }
};

export const loadSheetInfo = (): GoogleSheetInfo | null => {
  try {
    const raw = localStorage.getItem(SHEET_INFO_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error al cargar info de hoja local:', err);
  }
  return null;
};

export const saveSheetInfo = (info: GoogleSheetInfo | null) => {
  try {
    if (info) {
      localStorage.setItem(SHEET_INFO_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(SHEET_INFO_KEY);
    }
  } catch (err) {
    console.warn('Error al guardar info de hoja:', err);
  }
};
