# Manual de Operación: FlotaControl PWA

![FlotaControl Dashboard](file:///C:/Users/alfredo.netro/.gemini/antigravity/brain/dfd62585-2795-4991-ab67-d12cd90cea51/flotacontrol_dashboard_preview_1778966182599.png)

## 1. Introducción
**FlotaControl** es una aplicación progresiva (PWA) diseñada para el monitoreo estratégico y automatizado del mantenimiento preventivo de la flota vehicular. El sistema centraliza el control de kilometraje, alertas de servicio y reportes automáticos sincronizados con Google Sheets.

---

## 2. Jerarquía de Usuarios y Privilegios
El sistema opera bajo un esquema de roles que define las capacidades de interacción de cada usuario.

| Rol | Usuario(s) de Ejemplo | Capacidades |
| :--- | :--- | :--- |
| **Tecnico** | `jcontreras`, `anetro` | Lectura de flota, actualización de KM semanal, registro de afinaciones. |
| **Supervisor** | `wramos` | Todo lo anterior + Envío de reportes bajo demanda a todo el equipo. |
| **Coordinador** | `gilagor` | Todo lo anterior + Ajuste del intervalo global de mantenimiento (KM). |

---

## 3. Guía de Operación por Pantallas

### 3.1 Acceso al Sistema (Login)
*   **Proceso**: Ingrese su nombre de usuario y contraseña asignada.
*   **Persistencia**: Al ser una PWA, puede instalarla en su pantalla de inicio para acceso directo sin navegar.

### 3.2 Panel de Control (Inicio)
Es la pantalla principal de monitoreo.
*   **Indicadores Superiores**: Muestra el total de unidades y las alertas críticas (Rojo/Amarillo).
*   **Filtros Inteligentes**: Permite segmentar la flota por:
    *   🔴 **Urgente**: Unidades con mantenimiento vencido.
    *   🟡 **Próximo**: Unidades cercanas al límite de kilometraje.
    *   🟢 **Al día**: Unidades en rango óptimo.
    *   ⚪ **Sin KM**: Unidades que requieren captura inicial.

### 3.3 Detalle de Unidad
Al seleccionar una unidad, se despliega su expediente técnico:
*   **Barra de Progreso**: Visualización gráfica del uso del intervalo actual.
*   **Botón "Actualizar KM"**: Uso semanal obligatorio para mantener la flota monitoreada.
*   **Botón "Registrar Afinación"**: Se usa tras realizar un servicio mayor (aceite, filtros, etc.) para reiniciar el ciclo de 5,000 km (o el intervalo vigente).

---

## 4. Funciones Especiales por Rol

### 👤 Para Supervisores y Coordinadores
> [!TIP]
> **Reporte Bajo Demanda**
> En la sección de **Reportes**, encontrará el botón "📧 Enviar reporte ahora a todos". Al presionarlo, el sistema enviará un resumen ejecutivo del estado de la flota a los correos electrónicos de todo el equipo de gestión.

### 👑 Solo para Coordinadores
> [!IMPORTANT]
> **Configuración Global**
> El Coordinador tiene la facultad exclusiva de modificar el **Intervalo de Mantenimiento**. Cambiar este valor afectará el cálculo de alertas de TODA la flota de manera inmediata.

---

## 5. Flujos de Trabajo Comunes

````carousel
### 1. Actualización Semanal
1. Entre a la unidad correspondiente.
2. Toque en **Actualizar KM Actual**.
3. Ingrese la lectura del odómetro.
4. Guarde los cambios.
<!-- slide -->
### 2. Registro de Mantenimiento
1. Tras el servicio, entre al detalle de la unidad.
2. Toque en **Registrar Nueva Afinación**.
3. Ingrese el KM del servicio y la fecha.
4. El sistema reiniciará automáticamente los kilómetros recorridos.
<!-- slide -->
### 3. Revisión de Reportes
1. Vaya a la pestaña de **Reportes**.
2. Revise el estado general de la flota.
3. (Opcional) Cargue el historial mensual seleccionando mes y año.
````

---

> [!NOTE]
> Todos los datos se sincronizan en tiempo real con la base de datos maestra en Google Sheets. Si no tiene conexión, el Service Worker (PWA) permite visualizar la última información cargada.
