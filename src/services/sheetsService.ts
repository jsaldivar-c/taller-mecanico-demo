import { WorkshopService, ServiceProduct, ServiceStatus } from '../types/service';

const SHEET_TITLE = 'AutoTaller - Control de Servicios';
const TAB_NAME = 'Servicios';

const HEADERS = [
  'ID Servicio',
  'Fecha',
  'Cliente',
  'Teléfono',
  'Vehículo',
  'Placa',
  'Kilometraje',
  'Procedimiento',
  'Productos Utilizados',
  'Mano de Obra ($)',
  'Total ($)',
  'Estado',
  'Observaciones',
  'Última Actualización',
];

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 2,
  delayMs = 2000
): Promise<Response> => {
  const response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    console.warn(`Límite 429 alcanzado en Sheets API. Esperando ${delayMs}ms antes de reintentar...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(url, options, retries - 1, delayMs * 2);
  }
  return response;
};

export const formatProductsSummary = (products: ServiceProduct[]): string => {
  if (!products || products.length === 0) return 'Sin productos adicionales';
  return products
    .map(
      (p) =>
        `${p.name} (Cant: ${p.quantity} x $${p.unitPrice.toFixed(2)} = $${p.subtotal.toFixed(2)})`
    )
    .join(' | ');
};

export const parseProductsSummary = (text: string): ServiceProduct[] => {
  if (!text || text === 'Sin productos adicionales') return [];
  try {
    const parts = text.split(' | ');
    return parts.map((part, index) => {
      // Format: "Aceite (Cant: 4 x $10.00 = $40.00)"
      const match = part.match(/^(.*?)\s*\(Cant:\s*([\d.]+)\s*x\s*\$([\d.]+)/);
      if (match) {
        const name = match[1].trim();
        const quantity = parseFloat(match[2]) || 1;
        const unitPrice = parseFloat(match[3]) || 0;
        return {
          id: `prod-${index}-${Date.now()}`,
          name,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
        };
      }
      return {
        id: `prod-${index}-${Date.now()}`,
        name: part.trim(),
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
      };
    });
  } catch (err) {
    console.error('Error parsing products:', err);
    return [];
  }
};

const serviceToRow = (service: WorkshopService): (string | number)[] => {
  return [
    service.id,
    service.date,
    service.clientName,
    service.clientPhone,
    service.vehicleModel,
    service.plateNumber.toUpperCase(),
    service.mileage || '',
    service.procedure,
    formatProductsSummary(service.products),
    service.laborCost,
    service.totalCost,
    service.status,
    service.notes || '',
    service.updatedAt || new Date().toISOString(),
  ];
};

export const createWorkshopSpreadsheet = async (
  token: string
): Promise<{ id: string; title: string; url: string }> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: TAB_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al crear la hoja en Google Sheets: ${response.status} - ${errorText}`);
  }

  const sheetData = await response.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;

  // Insert headers
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      TAB_NAME
    )}!A1:N1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [HEADERS],
      }),
    }
  );

  // Format headers (dark industrial background, white bold text)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.12, blue: 0.18 }, // Dark slate #141f2e
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('No se pudo aplicar el formato estilizado a la cabecera:', err);
  }

  return {
    id: spreadsheetId,
    title: SHEET_TITLE,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
};

export const findExistingSpreadsheet = async (
  token: string
): Promise<{ id: string; title: string; url: string } | null> => {
  try {
    const q = encodeURIComponent(
      `name = '${SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&pageSize=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      console.warn('Error buscando archivos en Drive:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        id: file.id,
        title: file.name,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`,
      };
    }
  } catch (err) {
    console.warn('Excepción al buscar en Drive:', err);
  }
  return null;
};

export const getServicesFromSheet = async (
  spreadsheetId: string,
  token: string
): Promise<WorkshopService[]> => {
  const range = encodeURIComponent(`${TAB_NAME}!A1:N500`);
  const res = await fetchWithRetry(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(
        'Límite de consultas por minuto de Google Sheets alcanzado. Espera unos segundos y vuelve a sincronizar.'
      );
    }
    const errorText = await res.text();
    throw new Error(`Error al leer servicios de la hoja: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const rows: (string | number)[][] = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  const services: WorkshopService[] = [];

  // Row 0 is the header; start at index 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    const id = String(row[0] || `SRV-${i}`);
    const date = String(row[1] || new Date().toISOString().split('T')[0]);
    const clientName = String(row[2] || '');
    const clientPhone = String(row[3] || '');
    const vehicleModel = String(row[4] || '');
    const plateNumber = String(row[5] || '').toUpperCase();
    const mileage = row[6] ? String(row[6]) : '';
    const procedure = String(row[7] || '');
    const productsText = String(row[8] || '');
    const laborCost = parseFloat(String(row[9] || '0').replace(/[^0-9.-]+/g, '')) || 0;
    const totalCost = parseFloat(String(row[10] || '0').replace(/[^0-9.-]+/g, '')) || 0;
    const status = (String(row[11] || 'pending').toLowerCase() as ServiceStatus) || 'pending';
    const notes = row[12] ? String(row[12]) : '';
    const updatedAt = row[13] ? String(row[13]) : new Date().toISOString();

    services.push({
      id,
      rowNumber: i + 1, // 1-indexed row number in Google Sheet
      clientName,
      clientPhone,
      vehicleModel,
      plateNumber,
      mileage,
      date,
      procedure,
      products: parseProductsSummary(productsText),
      laborCost,
      totalCost: totalCost || laborCost,
      status: ['pending', 'in_progress', 'completed', 'delivered'].includes(status)
        ? status
        : 'pending',
      notes,
      updatedAt,
    });
  }

  return services;
};

export const appendServiceToSheet = async (
  spreadsheetId: string,
  token: string,
  service: WorkshopService
): Promise<number> => {
  const rowValues = serviceToRow(service);
  const range = encodeURIComponent(`${TAB_NAME}!A1:N`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al guardar servicio en Google Sheets: ${res.status} - ${errorText}`);
  }

  const result = await res.json();
  // result.updates.updatedRange format: "Servicios!A12:N12"
  const match = result.updates?.updatedRange?.match(/![A-Z]+(\d+):/);
  return match ? parseInt(match[1], 10) : 0;
};

export const updateServiceInSheet = async (
  spreadsheetId: string,
  token: string,
  rowNumber: number,
  service: WorkshopService
): Promise<void> => {
  const rowValues = serviceToRow(service);
  const range = encodeURIComponent(`${TAB_NAME}!A${rowNumber}:N${rowNumber}`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al actualizar servicio en Google Sheets: ${res.status} - ${errorText}`);
  }
};
