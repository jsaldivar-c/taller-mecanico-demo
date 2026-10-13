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

export const WORKSHOP_FOLDER_NAME = 'AutoTaller OS';

export const getOrCreateWorkshopFolder = async (
  token: string,
  folderName = WORKSHOP_FOLDER_NAME
): Promise<{ id: string; name: string; url: string }> => {
  try {
    const q = encodeURIComponent(
      `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const folder = data.files[0];
        return {
          id: folder.id,
          name: folder.name,
          url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
        };
      }
    }

    // Create the folder in Google Drive
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folder = await createRes.json();
      return {
        id: folder.id,
        name: folderName,
        url: `https://drive.google.com/drive/folders/${folder.id}`,
      };
    }
  } catch (err) {
    console.warn('Error al gestionar carpeta en Google Drive:', err);
  }

  return { id: '', name: folderName, url: '' };
};

export const moveFileToFolder = async (
  token: string,
  fileId: string,
  folderId: string
): Promise<void> => {
  if (!folderId || !fileId) return;
  try {
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let previousParents = '';
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      if (fileData.parents && Array.isArray(fileData.parents)) {
        if (fileData.parents.includes(folderId)) return;
        previousParents = fileData.parents.join(',');
      }
    }

    const patchUrl = previousParents
      ? `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}&fields=id,parents`
      : `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&fields=id,parents`;

    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn('Error moviendo archivo a carpeta en Google Drive:', err);
  }
};

export const createWorkshopSpreadsheet = async (
  token: string,
  folderName = WORKSHOP_FOLDER_NAME
): Promise<{
  id: string;
  title: string;
  url: string;
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
}> => {
  // 1. Ensure folder exists in Drive
  const folder = await getOrCreateWorkshopFolder(token, folderName);

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

  // Format headers: clean light background, NO bold, black text, and 25px height
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Set header row height to 25px
          {
            updateDimensionProperties: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 1,
              },
              properties: {
                pixelSize: 25,
              },
              fields: 'pixelSize',
            },
          },
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
                  backgroundColor: { red: 0.95, green: 0.96, blue: 0.98 },
                  textFormat: {
                    foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 },
                    bold: false,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('No se pudo aplicar el formato a la cabecera:', err);
  }

  // 2. Move file inside dedicated folder
  if (folder.id) {
    await moveFileToFolder(token, spreadsheetId, folder.id);
  }

  return {
    id: spreadsheetId,
    title: SHEET_TITLE,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    folderId: folder.id,
    folderName: folder.name,
    folderUrl: folder.url,
  };
};

export const findExistingSpreadsheet = async (
  token: string,
  folderName = WORKSHOP_FOLDER_NAME
): Promise<{
  id: string;
  title: string;
  url: string;
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
} | null> => {
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
      const folder = await getOrCreateWorkshopFolder(token, folderName);
      if (folder.id) {
        // Move existing sheet into folder if it was in root
        await moveFileToFolder(token, file.id, folder.id);
      }
      return {
        id: file.id,
        title: file.name,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`,
        folderId: folder.id,
        folderName: folder.name,
        folderUrl: folder.url,
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

let cachedSheetTabId: number | null = null;

export const getSheetTabId = async (spreadsheetId: string, token: string): Promise<number> => {
  if (cachedSheetTabId !== null) return cachedSheetTabId;
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const tab = data.sheets?.find((s: any) => s.properties?.title === TAB_NAME) || data.sheets?.[0];
      if (tab?.properties?.sheetId !== undefined) {
        const id = Number(tab.properties.sheetId);
        cachedSheetTabId = id;
        return id;
      }
    }
  } catch (err) {
    console.warn('Error obteniendo sheetTabId:', err);
  }
  return 0;
};

export const formatSheetRow = async (
  spreadsheetId: string,
  token: string,
  rowNumber: number
): Promise<void> => {
  try {
    const sheetTabId = await getSheetTabId(spreadsheetId, token);
    const startRowIndex = rowNumber - 1; // 0-indexed

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Set row height to 25px
          {
            updateDimensionProperties: {
              range: {
                sheetId: sheetTabId,
                dimension: 'ROWS',
                startIndex: startRowIndex,
                endIndex: startRowIndex + 1,
              },
              properties: {
                pixelSize: 25,
              },
              fields: 'pixelSize',
            },
          },
          // Format cells: white background (no black background), NO bold, normal 10pt text, middle vertical alignment
          {
            repeatCell: {
              range: {
                sheetId: sheetTabId,
                startRowIndex: startRowIndex,
                endRowIndex: startRowIndex + 1,
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 1 },
                  textFormat: {
                    foregroundColor: { red: 0, green: 0, blue: 0 },
                    bold: false,
                    fontSize: 10,
                  },
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Error al formatear fila con altura 25 en Google Sheets:', err);
  }
};

export const formatAllExistingRows = async (
  spreadsheetId: string,
  token: string,
  rowCount: number
): Promise<void> => {
  if (rowCount <= 0) return;
  try {
    const sheetTabId = await getSheetTabId(spreadsheetId, token);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Set all rows (from 0 to rowCount + 5) to 25px height
          {
            updateDimensionProperties: {
              range: {
                sheetId: sheetTabId,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: Math.max(rowCount + 5, 20),
              },
              properties: {
                pixelSize: 25,
              },
              fields: 'pixelSize',
            },
          },
          // Format all data rows (starting from row 1) with white background, NO bold, black text
          {
            repeatCell: {
              range: {
                sheetId: sheetTabId,
                startRowIndex: 1,
                endRowIndex: Math.max(rowCount + 1, 20),
                startColumnIndex: 0,
                endColumnIndex: HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 1 },
                  textFormat: {
                    foregroundColor: { red: 0, green: 0, blue: 0 },
                    bold: false,
                    fontSize: 10,
                  },
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Error al formatear rango de filas en Google Sheets:', err);
  }
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
  const match = result.updates?.updatedRange?.match(/![A-Z]+(\d+):/);
  const rowNumber = match ? parseInt(match[1], 10) : 0;

  // Format row: 25px height, white background, no bold
  if (rowNumber > 0) {
    await formatSheetRow(spreadsheetId, token, rowNumber);
  }

  return rowNumber;
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

  // Format row: 25px height, white background, no bold
  await formatSheetRow(spreadsheetId, token, rowNumber);
};
