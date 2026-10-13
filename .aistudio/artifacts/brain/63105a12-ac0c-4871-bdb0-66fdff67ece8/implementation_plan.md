# Sistema de Gestión de Servicios para Taller Automotriz (AutoTaller OS)

Aplicación web integral para la recepción, control operativo, costeo y seguimiento de servicios mecánicos en talleres automotrices, sincronizada en tiempo real con Google Sheets para almacenamiento persistente y consulta centralizada.

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> A partir de las aclaraciones del usuario, se confirman las siguientes directrices clave para el desarrollo:

- **Almacenamiento en Google Sheets**: Creación y vinculación automatizada de una hoja de cálculo en el Google Drive del usuario mediante Google Workspace OAuth (`https://www.googleapis.com/auth/spreadsheets` y `https://www.googleapis.com/auth/drive.file`), con inicialización de encabezados y formateo automático.
- **Control Operativo y Costos**: Inclusión de estados del servicio (*Pendiente*, *En Proceso*, *Completado*, *Entregado*) y desglose de cotización/costos (mano de obra + lista dinámica de productos/repuestos utilizados con cantidad y precio unitario).
- **Línea Visual**: Estética industrial moderna y profesional con paleta oscura refinada (grafito, carbón, acentos en ámbar automotriz y verde técnico), tipografías nítidas (`Plus Jakarta Sans` y cifras monoespaciadas `JetBrains Mono` con `tabular-nums`), sin adornos superfluos ni píldoras recargadas.

---

## 1. Visión General y Concepto Central

- **Propósito**: Facilitar a administradores y mecánicos el registro rápido de vehículos que ingresan al taller, documentar el procedimiento a realizar y las piezas o insumos utilizados, calcular presupuestos al instante y guardar un historial auditable y editable en Google Sheets.
- **Público Objetivo**: Talleres mecánicos, centros de lubricación y diagnóstico automotriz, jefes de taller y asesores de servicio.
- **Valor Agregado**:
  - Registro ágil en un solo flujo con validación de placa y autocompletado de fecha.
  - Almacenamiento seguro en Google Sheets sin necesidad de configurar bases de datos complejas; los datos son propiedad directa del usuario en su cuenta de Google.
  - Modo sin conexión / caché local resiliente: permite seguir registrando servicios incluso si la conexión a Google Sheets se interrumpe momentáneamente, sincronizando los cambios una vez restablecida.
  - Impresión y exportación limpia de Orden de Trabajo (Work Order / Recibo) para el cliente o mecánico.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos Principales de Usuario
1. **Conexión con Google Workspace**:
   - Al abrir la aplicación, el usuario ve el estado de la hoja de cálculo. Un botón claro permite autenticarse con Google y crear automáticamente la hoja *"AutoTaller - Control de Servicios"* en Drive (o reconectar la existente).
2. **Registro de Nuevo Servicio**:
   - Formulario estructurado con secciones lógicas:
     - **Datos del Cliente**: Nombre completo, teléfono de contacto y correo (opcional).
     - **Datos del Vehículo**: Marca, modelo, año y número de placa vehicular.
     - **Fecha y Estado**: Fecha de recepción (por defecto hoy) y estado operativo (*Pendiente*, *En proceso*, *Terminado*, *Entregado*).
     - **Procedimiento**: Descripción detallada del trabajo mecánico o mantenimiento preventivo.
     - **Productos / Insumos Utilizados**: Lista dinámica de ítems (nombre del producto, cantidad, costo unitario y subtotal automático).
     - **Resumen Financiero**: Mano de obra + costo de materiales = Total general.
3. **Historial de Servicios**:
   - Tabla técnica de alta densidad con filtros rápidos (por estado, búsqueda en vivo por placa, cliente o vehículo, y rango de fechas).
   - Acciones por registro: **Ver Detalle / Orden de Trabajo**, **Editar Registro** (con sincronización inmediata a Google Sheets), y **Abrir en Google Sheets**.
4. **Edición y Actualización**:
   - Modal o vista de edición para modificar cualquier campo del servicio (cambiar de *En Proceso* a *Terminado*, agregar productos adicionales utilizados, etc.) con confirmación de cambios.

### Identidad Visual y Estilo
- **Paleta de Colores**:
  - Fondo y superficies: Carbón pizarra profundo (`#0b0f17`, `#111827`, `#1f2937`) con bordes sutiles en `rgba(255,255,255,0.08)`.
  - Acento Primario: Naranja / Ámbar automotriz (`#f97316` / `#ea580c`) para acciones principales, llamadas a la acción y foco.
  - Estados Semánticos:
    - *Pendiente*: Gris neutro técnico (`#94a3b8`)
    - *En Proceso*: Ámbar mecánico (`#f59e0b`)
    - *Terminado*: Verde esmeralda (`#10b981`)
    - *Entregado*: Azul cobalto (`#3b82f6`)
- **Tipografía**:
  - Títulos y navegación: `Plus Jakarta Sans` con peso SemiBold y espaciado ajustado.
  - Texto base: `DM Sans` / `Plus Jakarta Sans` (14px–15px) para máxima legibilidad bajo iluminación de taller.
  - Números, placas y montos: `font-mono tabular-nums` para perfecta alineación de columnas numéricas.
- **Disciplina de Diseño**:
  - Cero píldoras decorativas vacías; estados representados con texto limpio y viñetas sutiles.
  - Barra superior en una sola fila con 3 zonas: Logotipo del taller, estadísticas resumidas de servicios del día/semana, y control de cuenta Google con enlace a la hoja de Sheets.

---

## 3. Decisiones de Producto y Arquitectura

- **Integración con Google Sheets**:
  - Se utilizará la API REST oficial de Google Sheets (`v4`) y Google Drive (`v3`) mediante el token OAuth obtenido con Firebase Auth (`GoogleAuthProvider` con scopes correspondientes).
  - La hoja de cálculo contendrá columnas normalizadas: `ID Servicio`, `Fecha`, `Cliente`, `Teléfono`, `Vehículo`, `Placa`, `Procedimiento`, `Productos Utilizados`, `Mano de Obra`, `Total`, `Estado`, `Última Actualización`.
  - Al actualizar o editar un registro, se ubicará la fila correspondiente en Google Sheets para realizar una actualización precisa (`spreadsheets.values.update`).
- **Resiliencia y Modo Offline**:
  - Todos los servicios se almacenan también en `localStorage` sincronizado. Si la llamada a Google Sheets falla o expira el token, el usuario puede continuar trabajando y sincronizar en un clic al reconectarse.
- **Seguridad y Confirmación**:
  - Diálogos explícitos de confirmación antes de guardar cambios o sobrescribir registros en la hoja de cálculo.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AutoTaller OS Web Client                        │
├────────────────────────────────┬───────────────────────────────────────┤
│         Vistas y UI            │            Gestión de Estado          │
│ ┌────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ Header & Barra de Acciones │ │ │ AuthState (User, AccessToken)     │ │
│ │ Formulario Nuevo Servicio  │ │ │ SheetSyncState (SheetId, Syncing) │ │
│ │ Historial & Filtros Tabla  │ │ │ ServicesCache (Lista de Servicios)│ │
│ │ Modal Edición / Detalle    │ │ └───────────────────────────────────┘ │
│ │ Vista de Orden de Trabajo  │ │                   │                   │
│ └────────────────────────────┘ │                   ▼                   │
├────────────────────────────────┴───────────────────────────────────────┤
│                         Capa de Servicios y API                        │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │   Google Sheets Service (REST)    │ │   Local Cache & Fallback     │ │
│ │ - Crear Hoja con Headers          │ │ - LocalStorage persistente   │ │
│ │ - Leer Registros (BatchGet)       │ │ - Cola de cambios pendientes │ │
│ │ - Append Row (Nuevo Servicio)     │ │ - Exportación JSON/CSV       │ │
│ │ - Update Row (Edición de Estado)  │ │                              │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ OAuth 2.0 Bearer Token
                               ▼
            ┌─────────────────────────────────────────┐
            │       Google Workspace Cloud APIs       │
            │  - Google Sheets API v4                 │
            │  - Google Drive API v3 (crear archivo)  │
            └─────────────────────────────────────────┘
```

### Estructura de Datos (Registro de Servicio)

```typescript
interface ServiceProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface WorkshopService {
  id: string;                    // UUID único (ej: SRV-2026-001)
  rowNumber?: number;            // Índice de fila en Google Sheets para updates
  clientName: string;            // Nombre del cliente
  clientPhone: string;           // Teléfono / WhatsApp
  clientEmail?: string;          // Correo (opcional)
  vehicleModel: string;          // Marca y Modelo (ej: Toyota Corolla 2020)
  plateNumber: string;           // Placa (ej: ABC-123)
  mileage?: string;              // Kilometraje (ej: 45,000 km)
  date: string;                  // Fecha (YYYY-MM-DD)
  procedure: string;             // Procedimiento detallado a realizar
  products: ServiceProduct[];    // Repuestos y fluidos usados
  productsTextSummary?: string;  // Resumen serializado para Sheets
  laborCost: number;             // Costo de mano de obra
  totalCost: number;             // Costo total
  status: 'pending' | 'in_progress' | 'completed' | 'delivered';
  notes?: string;                // Observaciones mecánicas
  updatedAt: string;             // Marca de tiempo ISO
}
```

---

## Plan de Ejecución Paso a Paso

1. **Configuración de OAuth Workspace**:
   - Solicitar permisos OAuth para Google Sheets y Drive (`set_up_oauth`) con los scopes `https://www.googleapis.com/auth/spreadsheets` y `https://www.googleapis.com/auth/drive.file`.
2. **Infraestructura de Datos y API de Google Sheets**:
   - Implementar módulo cliente `googleSheetsService.ts` para crear la hoja, dar formato a la cabecera (azul/gris oscuro con texto en negrita), escribir nuevas filas y actualizar filas existentes por ID.
3. **Formulario de Registro Dinámico**:
   - Construir formulario interactivo con soporte de productos/repuestos dinámicos (agregar, quitar, cálculo reactivo de subtotal y total).
4. **Panel de Historial, Búsqueda y Edición**:
   - Tabla de alta fidelidad con filtros de estado, búsqueda en tiempo real, modal de edición con sincronización a Google Sheets, y vista para imprimir la Orden de Trabajo.
5. **Verificación y Pruebas**:
   - Comprobación de compilación, verificación de todos los flujos de interacción y manejo de errores amigable.
