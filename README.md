# Sistema de Gestión de Casos de Prueba

Una **Progressive Web App (PWA)** profesional para la gestión, ejecución y documentación de casos de prueba de software. Diseñada para equipos de QA que necesitan una herramienta robusta, intuitiva y que funcione tanto online como offline.

## Características Principales

###  **Gestión por Ciclos de Testing**
- **Ciclo 1**: Testing inicial de todos los casos
- **Ciclos 2+**: Regresión específica de casos fallidos
- **Renumeración inteligente**: Mantiene secuencia limpia en Ciclo 1, preserva números específicos en regresiones

###  **Cronometraje Integrado**
- **Cronómetro individual** por cada caso de prueba
- **Un solo cronómetro activo** para evitar errores
- **Tiempo acumulativo** con pausa/reanudación
- **Edición manual** de tiempos registrados

###  **Variables Dinámicas Configurables**
- **Sistema flexible** de variables de entrada personalizables
- **Configuración global** que se aplica a todos los casos
- **Adaptable** a cualquier tipo de proyecto o metodología

###  **Gestión Avanzada de Evidencias**
- **Carga múltiple** de imágenes por caso
- **Vista previa** en miniatura con zoom completo
- **Almacenamiento seguro** en Base64
- **Visualización organizada** en modal dedicado

##  **Funcionalidades de Productividad**

###  **Selección Múltiple y Acciones en Lote**
- **Checkboxes** para selección individual y masiva
- **Eliminación en lote** con confirmación inteligente
- **Ocultación temporal** de casos no relevantes
- **Toolbar dinámico** que aparece al seleccionar casos

###  **Duplicación Inteligente de Casos**
- **Duplicación automática** para último escenario (incrementa número + Ciclo 1)
- **Duplicación con edición** para escenarios intermedios
- **Renumeración automática** cuando se modifican números de escenario

###  **Sistema de Filtros Avanzado**
- **Búsqueda de texto** en descripción, tester, observaciones
- **Filtro por tester** con dropdown dinámico
- **Filtro por estado**: Todos, OK, NO, Pendiente
- **Filtro por rango de fechas** con selección de calendario
- **Toggle para mostrar casos ocultos**

###  **Estadísticas en Tiempo Real**
- **Contador total** de casos
- **Casos aprobados/fallidos** con tasa de éxito
- **Casos ocultos** con gestión centralizada
- **Actualización automática** según filtros aplicados

##  **Experiencia de Usuario Superior**

###  **Modo Claro/Oscuro**
- **Switch instantáneo** entre temas
- **Persistencia** de preferencia del usuario
- **Paleta moderna** optimizada para modo oscuro
- **Scrollbars súper visibles** en modo oscuro

###  **Navegación Intuitiva**
- **Drag scroll horizontal** con botón derecho del mouse
- **Indicadores visuales** por estado de caso (verde/rojo/amarillo)
- **Tooltips informativos** en todos los botones
- **Atajos de teclado** para acciones frecuentes

###  **Reorganización Flexible**
- **Botones de reordenamiento** individual ()
- **Movimiento en lote** de casos seleccionados
- **Mantenimiento automático** del orden lógico

##  **Importación y Exportación**

###  **Exportación Excel Avanzada**
- **Tabla principal** con todos los datos y variables dinámicas
- **Organización por ciclos** con líneas identificatorias amarillas
- **Inserción de evidencias** organizadas por escenario
- **Espaciado inteligente**: 10 filas entre imágenes, 20 entre escenarios, 30 entre ciclos
- **Solo escenarios con evidencias** para optimizar el reporte

###  **Gestión de Datos JSON**
- **Exportación completa** en formato JSON estructurado
- **Importación flexible**: reemplazar o agregar casos existentes
- **Validación automática** de formato de archivo
- **Migración de datos** automática para compatibilidad

##  **Progressive Web App (PWA)**

###  **Instalación Nativa**
- **Instalable** como aplicación nativa en desktop y móvil
- **Icono en escritorio** y menú de aplicaciones
- **Pantalla completa** sin barra del navegador
- **Arranque instantáneo** desde el sistema operativo

###  **Funcionalidad Offline**
- **Funciona completamente sin internet** una vez cargada
- **Datos persistentes** en localStorage del navegador
- **Service Worker inteligente** para cache automático
- **Actualización automática** cuando hay nueva versión disponible

###  **Optimizada para Productividad**
- **Orientación landscape** optimizada para tablas extensas
- **Shortcuts de aplicación** para "Nuevo Caso" y "Estadísticas"
- **Integración con sistema operativo** para compartir y abrir archivos

##  **Especificaciones Técnicas**

###  **Arquitectura**
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Persistencia**: localStorage para datos + Service Worker para cache
- **Exportación**: ExcelJS para reportes avanzados con imágenes
- **PWA**: Web App Manifest + Service Worker para funcionalidad nativa

###  **Bibliotecas Integradas**
- **ExcelJS**: Generación de archivos Excel con imágenes embebidas
- **XLSX**: Manipulación de hojas de cálculo
- **Service Worker**: Cache inteligente y funcionalidad offline

###  **Diseño Responsivo**
- **Desktop**: Tabla completa con drag scroll horizontal
- **Tablet/Móvil**: Interface adaptativa con scroll touch
- **Compatibilidad**: Chrome, Firefox, Safari, Edge (moderno)

##  **Estados de Casos de Prueba**

###  **Pendiente**
- **Estado inicial** de casos recién creados
- **Identificación visual** con color amarillo dorado
- **Sin fecha** de ejecución automática

###  **OK (Aprobado)**
- **Caso ejecutado exitosamente**
- **Auto-asignación** de fecha de ejecución
- **Identificación visual** con color verde

###  **NO (Fallido)**
- **Caso con bug o error detectado**
- **Campo de número de error/bug** para trazabilidad
- **Candidato automático** para regresión en próximo ciclo

##  **Flujo de Trabajo Recomendado**

### 1. **Configuración Inicial**
- Configurar variables de entrada específicas del proyecto
- Definir testers y responsabilidades

### 2. **Ciclo 1 - Testing Inicial**
- Crear casos secuenciales (1, 2, 3, 4...)
- Ejecutar con cronometraje y evidencias
- Marcar estados según resultados

### 3. **Análisis y Reporte**
- Revisar estadísticas de éxito
- Exportar reporte Excel para stakeholders
- Identificar casos fallidos para regresión

### 4. **Ciclos de Regresión**
- Duplicar casos fallidos para nuevo ciclo
- Mantener numeración original para trazabilidad
- Ejecutar solo casos con bugs corregidos

### 5. **Gestión Continua**
- Usar selección múltiple para acciones en lote
- Ocultar casos no relevantes temporalmente
- Mantener datos con exportación JSON periódica

##  **Instalación y Uso**

### **Requisitos Mínimos**
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript habilitado
- 50-100MB de espacio local para datos y cache

### **Instalación**
1. Abrir la aplicación en el navegador
2. Buscar el ícono de "Instalar aplicación" en la barra de direcciones
3. Hacer clic en "Instalar" para añadir como aplicación nativa
4. ¡Listo! La aplicación está disponible offline

### **Primer Uso**
1. Configurar variables de entrada específicas del proyecto
2. Crear el primer caso de prueba como ejemplo
3. Explorar las funcionalidades con datos de prueba
4. Exportar/importar para familiarizarse con el flujo

##  **Casos de Uso Típicos**

###  **Para Testers QA**
- Ejecución sistemática de casos con cronometraje
- Documentación detallada con evidencias fotográficas
- Seguimiento de regresiones por ciclos

###  **Para QA Leads**
- Supervisión de avance por estadísticas en tiempo real
- Generación de reportes ejecutivos en Excel
- Asignación y distribución de casos por tester

###  **Para Equipos Ágiles**
- Organización por sprints usando ciclos
- Trazabilidad de acceptance criteria
- Retrospectivas basadas en datos y evidencias

###  **Para Testing Móvil/Campo**
- Funcionalidad offline completa
- Aplicación nativa instalable
- Sincronización al retornar conectividad

##  **Seguridad y Privacidad**

- **Datos locales**: Toda la información se almacena en el dispositivo del usuario
- **Sin tracking**: No se recopilan datos analíticos ni de uso
- **HTTPS recomendado**: Para instalación PWA en producción
- **Backups manuales**: Control total del usuario sobre sus datos

##  **Actualizaciones y Mantenimiento**

- **Actualizaciones automáticas**: Notificación cuando hay nueva versión
- **Backward compatibility**: Migración automática de datos antiguos
- **Cache inteligente**: Optimización automática de recursos
- **Versionado semántico**: Control de cambios y mejoras

##  **Contribuir**

Este proyecto está diseñado para ser extensible y mejorable. Las funcionalidades están modularizadas para facilitar nuevas características y optimizaciones.

---

**Desarrollado para equipos de QA que buscan excelencia en testing**

*Sistema de Casos de Prueba - Versión PWA 2.0*
