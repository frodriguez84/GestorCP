# 📋 Sistema de Gestión de Casos de Prueba - PWA

## 🎯 ¿Qué es esta aplicación?

Una **Progressive Web App (PWA)** diseñada específicamente para equipos de QA que necesitan gestionar, ejecutar y documentar casos de prueba de manera eficiente. La aplicación funciona completamente offline una vez instalada y permite a cada tester trabajar de forma independiente con sus propios datos.

---

## ✨ Funcionalidades Principales

### 📊 **Gestión Completa de Casos**

- ✅ Crear, editar y eliminar escenarios de prueba
- ✅ Organización por **ciclos de testing** (Ciclo 1: testing inicial, Ciclos 2+: regresión)
- ✅ Renumeración inteligente automática por ciclos
- ✅ Estados visuales: **Pendiente** (dorado), **OK** (verde), **NO** (rojo)
- ✅ Duplicación inteligente de casos con detección automática

### ⏱️ **Cronometraje Integrado**

- ✅ Cronómetro individual por cada caso de prueba
- ✅ Solo un cronómetro activo a la vez (evita errores)
- ✅ Tiempo acumulativo con pausa/reanudación
- ✅ Edición manual de tiempos registrados

### 🔧 **Variables Dinámicas**

- ✅ Sistema completamente configurable de variables de entrada
- ✅ Se adapta a cualquier tipo de proyecto o metodología
- ✅ Aplicación automática a todos los casos existentes

### 📸 **Gestión de Evidencias**

- ✅ Carga múltiple de imágenes por caso
- ✅ Vista previa con zoom completo
- ✅ Almacenamiento seguro y optimizado

### 📈 **Estadísticas en Tiempo Real**

- ✅ Contador total de casos
- ✅ Tasa de éxito actualizada automáticamente
- ✅ Casos aprobados, fallidos y pendientes
- ✅ Gestión de casos ocultos

### 🔍 **Sistema de Filtros Avanzado**

- ✅ Búsqueda por texto (descripción, tester, observaciones)
- ✅ Filtro por tester con dropdown dinámico
- ✅ Filtro por estado (Todos, OK, NO, Pendiente)
- ✅ Filtro por rango de fechas
- ✅ Toggle para mostrar/ocultar casos

### ✅ **Selección Múltiple y Acciones Masivas**

- ✅ Checkboxes para selección individual y total
- ✅ Edición masiva de campos comunes
- ✅ Eliminación en lote con confirmación
- ✅ Ocultación temporal de casos no relevantes

### 📊 **Exportación Excel Profesional**

- ✅ Reporte completo con información del requerimiento
- ✅ Tabla principal con todas las variables dinámicas
- ✅ Inserción automática de evidencias organizadas por ciclo y escenario
- ✅ Formato profesional para stakeholders

### 📥 **Importación Inteligente**

- ✅ Importación desde archivos Excel existentes
- ✅ Reconocimiento automático de estructura de datos
- ✅ Distribución correcta de evidencias por caso
- ✅ Importación de información del requerimiento

### 🌐 **Progressive Web App**

- ✅ Instalable como aplicación nativa en desktop y móvil
- ✅ Funciona completamente offline
- ✅ Actualizaciones automáticas
- ✅ Sincronización cuando vuelve la conectividad

### 🎨 **Experiencia de Usuario**

- ✅ Modo claro/oscuro con persistencia
- ✅ Drag scroll horizontal para tablas grandes
- ✅ Tooltips informativos en todos los controles
- ✅ Diseño responsivo optimizado para tablets

---

## ⚠️ Limitaciones Actuales

### 🔒 **Almacenamiento Local**

- Los datos se guardan en el navegador local de cada usuario
- **No hay sincronización** entre diferentes usuarios o dispositivos
- Cada tester trabaja con su propio conjunto de datos independiente

### 🌐 **Requisitos del Navegador**

- Requiere navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript debe estar habilitado
- Para instalación como PWA se requiere protocolo HTTPS o localhost

### 💾 **Gestión de Datos**

- Dependiente del localStorage del navegador (límite ~5-10MB)
- Los datos pueden perderse si se limpia el cache del navegador
- **Importante**: Hacer backups regulares usando "Exportar JSON"

### 🔄 **Colaboración**

- No incluye sistema de usuarios o permisos
- Para compartir resultados se debe usar exportación Excel/JSON
- No hay chat o comentarios colaborativos

---

## 🚀 Instalación

### **Opción 1: Instalación como PWA (Recomendada)**

1. **Abrir en navegador**: Acceder a la URL de la aplicación
2. **Buscar ícono de instalación**: Aparece en la barra de direcciones del navegador
3. **Hacer clic en "Instalar"**: Se añadirá como aplicación nativa
4. **¡Listo!**: La aplicación estará disponible offline

### **Opción 2: Servidor Local (Para desarrollo)**

```bash
# Con Python (más simple)
cd carpeta-del-proyecto
python -m http.server 8000
# Abrir: http://localhost:8000

# Con Node.js
npm install -g http-server
http-server
# Abrir: http://localhost:8080
```

### **Opción 3: Hosting (Para equipos)**

- Subir archivos a Vercel, Netlify, GitHub Pages
- Compartir URL única con el equipo
- Cada tester accede desde su dispositivo

---

## 📖 Manual de Uso

### **🔧 1. Configuración Inicial**

#### Configurar Variables de Entrada

1. Hacer clic en **"⚙️ Configurar Variables"**
2. Agregar variables específicas del proyecto (ej: "Usuario", "Contraseña", "URL")
3. Guardar configuración
4. Las variables se aplicarán automáticamente a todos los casos

#### Configurar Información del Requerimiento

1. Hacer clic en **"✏️ Editar"** en la sección de información del requerimiento
2. Completar: N° Requerimiento, Nombre, Descripción, N° Caso, Tester Principal, Fecha de Inicio
3. Esta información aparecerá en los reportes Excel

### **📝 2. Gestión de Casos**

#### Crear Nuevo Caso

1. Hacer clic en **"➕ Nuevo Escenario"**
2. Completar campos obligatorios:
   - **Ciclo**: Generalmente "1" para testing inicial
   - **N° Escenario**: Se sugiere automáticamente el siguiente número
   - **Descripción**: Detalle del caso de prueba
   - **Tester**: Nombre del responsable
3. Completar variables de entrada configuradas
4. Agregar evidencias si es necesario
5. Guardar

#### Duplicar Casos

- **Para el último escenario**: Se crea automáticamente el siguiente número en Ciclo 1
- **Para escenarios intermedios**: Se abre modal para editar números y datos

#### Ejecutar Casos

1. **Iniciar cronómetro**: Hacer clic en ⏱️ en la fila del caso
2. **Ejecutar prueba**: Realizar las acciones del caso
3. **Cargar evidencias**: Si es necesario
4. **Cambiar estado**: Seleccionar OK/NO en el dropdown
5. **Detener cronómetro**: El tiempo se guarda automáticamente
6. **Agregar observaciones**: Si hay notas importantes

### **🔍 3. Búsqueda y Filtros**

#### Filtros Disponibles

- **Búsqueda**: Texto libre en descripción, tester, observaciones
- **Tester**: Dropdown con todos los testers del proyecto
- **Estado**: Todos, OK, NO, Pendiente
- **Fechas**: Rango desde/hasta para casos ejecutados
- **Casos ocultos**: Toggle para mostrar casos temporalmente ocultos

#### Casos Ocultos

- Usar para escenarios no relevantes en el momento
- Los casos ocultos se mantienen guardados pero no aparecen en la vista principal
- Se pueden mostrar nuevamente usando el toggle de filtros

### **📊 4. Sistema de Reportes**

#### Generación de Reportes Profesionales

* **Vista Previa** : Modal con preview completo del reporte antes de descargar
* **Formato PDF** : Descarga directa en formato PDF
* **Reporte Completo** : Incluye toda la información del proyecto de testing
* **Timestamp** : Fecha y hora exacta de generación del reporte

### **✅ 5. Selección Múltiple**

#### Seleccionar Casos

- **Individual**: Marcar checkbox de cada caso
- **Todos**: Usar checkbox del header de la tabla
- **Toolbar aparece automáticamente** cuando hay casos seleccionados

#### Acciones Masivas

- **📝 Editar Seleccionados**: Cambiar campos comunes en múltiples casos
- **👁️‍🗨️ Ocultar Seleccionados**: Ocultar temporalmente casos no relevantes
- **🗑️ Eliminar Seleccionados**: Borrar múltiples casos con renumeración automática

### **6. Sistema de Rordenamiento Drag & Drop**

* Arrastrar y soltar con handle dedicado
* Reordenamiento de bloques completos
* Auto-scroll inteligente
* Sistema de deshacer con Ctrl+Z
* Restricciones inteligentes
* Feedback visual avanzado

### **🔢 Renumeración Inteligente Avanzada** (sección expandida)

* Renumeración completa por escenarios
* Mapeo automático hacia todos los ciclos
* Preview de cambios
* Detección automática de orden

### **📖 Manual de Uso actualizado:**

* **Nueva sección** : "Reordenar Escenarios"
* **Nueva sección** : "Renumerar Escenarios"
* **Actualizada** : Restricciones de reordenamiento en filtros
* **Actualizada** : Tips de reordenamiento efectivo

### **🎨 Experiencia de Usuario:**

* Agregado reordenamiento drag & drop

### **📊 7. Reportes y Exportación**

#### Exportar a Excel

1. Hacer clic en **"📊 Exportar Excel"**
2. Se genera automáticamente:
   - **Hoja 1**: Información del requerimiento
   - **Hoja 2**: Tabla completa de casos con variables dinámicas
   - **Evidencias**: Organizadas por ciclo y escenario al final
3. Archivo listo para compartir con stakeholders

#### Backup de Datos

1. **Guardar JSON**: Hacer clic en "💾 Guardar Escenarios" para backup completo
2. **Cargar JSON**: Usar "📂 Cargar Escenarios" para restaurar o migrar datos

#### Importar desde Excel

1. **Preparar Excel**: Debe tener estructura compatible (usar export como referencia)
2. **Importar**: Hacer clic en "📥 Importar Excel"
3. **Verificar**: La aplicación detecta automáticamente casos, variables y evidencias
4. **Confirmar**: Revisar resumen antes de aplicar cambios

### **⚙️ 8. Tips y Mejores Prácticas**

#### Organización por Ciclos

- **Ciclo 1**: Todos los casos iniciales numerados secuencialmente (1, 2, 3, 4...)
- **Ciclo 2+**: Casos de regresión que mantienen su numeración original
- La renumeración automática solo afecta al Ciclo 1

#### Gestión de Evidencias

- Usar nombres descriptivos para las imágenes
- Las evidencias se almacenan optimizadas automáticamente
- En Excel aparecen organizadas por escenario para fácil revisión

#### Cronometraje Efectivo

- Solo un cronómetro puede estar activo a la vez
- El tiempo se puede editar manualmente si es necesario
- Se trunca automáticamente a minutos enteros

#### Backup y Seguridad

- Hacer backup JSON regularmente (especialmente antes de cambios grandes)
- Los datos son locales al navegador - no se pierden al cerrar pestañas
- Importante: No limpiar datos del navegador sin backup previo

---

## 💡 Soporte y Feedback

Para consultas, reportar bugs o solicitar nuevas funcionalidades, contactar al equipo de QA.

**¡Que tengan excelentes testing! 🚀**

---

*Versión: 2.1 PWA | Última actualización: Agosto 2025*
