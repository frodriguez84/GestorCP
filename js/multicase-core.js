// ===============================================
// MULTICASE-CORE.JS - Sistema Multicaso
// ===============================================

// ===============================================
// NUEVA ESTRUCTURA DE DATOS JERÁRQUICA
// ===============================================

// Variable global principal (nueva)
let currentRequirement = null;
let currentCaseId = null; // ID del caso activo
let multicaseMode = false; // Flag para activar funcionalidad multicaso

// ===============================================
// ESTRUCTURA DEL REQUERIMIENTO
// ===============================================

/**
 * Estructura completa del requerimiento
 * @typedef {Object} Requirement
 * @property {string} id - ID único del requerimiento
 * @property {Object} info - Información del requerimiento
 * @property {Array} cases - Array de casos
 * @property {Object} stats - Estadísticas calculadas
 */

function createEmptyRequirement() {
    return {
        id: `req_${Date.now()}`,
        version: "3.0-multicaso",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Información del requerimiento (actual requirementInfo)
        info: {
            number: '',
            name: '',
            description: '',
            caso: '',
            titleCase: '',
            tester: '',
            startDate: '',
            endDate: '',
            status: 'active' // active, completed, paused
        },

        // Array de casos
        cases: [],

        // Estadísticas calculadas automáticamente
        stats: {
            totalCases: 0,
            totalScenarios: 0,
            totalHours: 0,
            totalOK: 0,
            totalNO: 0,
            totalPending: 0,
            successRate: 0,
            activeCycles: []
        }
    };
}

// ===============================================
// ESTRUCTURA DEL CASO
// ===============================================

/**
 * Estructura de un caso individual
 * @typedef {Object} Case
 * @property {string} id - ID único del caso
 * @property {string} caseNumber - Número del caso
 * @property {string} title - Título del caso
 * @property {string} objective - Objetivo del caso
 * @property {string} prerequisites - Prerequisitos del caso
 * @property {Array} scenarios - Escenarios (actual testCases)
 * @property {Array} inputVariableNames - Variables de entrada
 * @property {Object} stats - Estadísticas del caso
 */

function createNewCase(title = "Nuevo Caso", objective = "", caseNumber = "") {
    return {
        id: `case_${Date.now()}`,
        caseNumber: caseNumber, // 🆕 NUEVO CAMPO para número del caso
        title: title,
        objective: objective,
        prerequisites: '', // 🆕 NUEVO CAMPO para prerequisitos/requisitos
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active', // active, completed, paused

        // Escenarios del caso (actual testCases)
        scenarios: [],

        // Variables de entrada específicas del caso
        inputVariableNames: ['Variable 1', 'Variable 2'],

        // Estadísticas del caso
        stats: {
            totalScenarios: 0,
            totalHours: 0,
            totalOK: 0,
            totalNO: 0,
            totalPending: 0,
            successRate: 0,
            cycles: []
        }
    };
}

// ===============================================
// MIGRACIÓN DE DATOS EXISTENTES
// ===============================================

/**
 * Migra los datos actuales al nuevo formato multicaso
 */
function migrateToMulticase() {
    console.log('🔄 Iniciando migración a formato multicaso...');

    try {
        // Crear nuevo requerimiento
        const newRequirement = createEmptyRequirement();

        // Migrar información del requerimiento actual
        if (requirementInfo && typeof requirementInfo === 'object') {
            newRequirement.info = { ...newRequirement.info, ...requirementInfo };
            console.log('✅ Información del requerimiento migrada');
        }

        // Crear "Caso 1" con todos los escenarios actuales
        const defaultCase = createNewCase("Caso 1", "Casos de prueba principales", "1");

        // Migrar escenarios actuales
        if (testCases && Array.isArray(testCases) && testCases.length > 0) {
            defaultCase.scenarios = [...testCases];
            console.log(`✅ ${testCases.length} escenarios migrados al Caso 1`);
        }

        // Migrar variables de entrada actuales
        if (inputVariableNames && Array.isArray(inputVariableNames) && inputVariableNames.length > 0) {
            defaultCase.inputVariableNames = [...inputVariableNames];
            console.log(`✅ ${inputVariableNames.length} variables migradas al Caso 1`);
        }

        // Agregar caso al requerimiento
        newRequirement.cases.push(defaultCase);

        // Calcular estadísticas
        updateRequirementStats(newRequirement);

        // Establecer como requerimiento actual
        currentRequirement = newRequirement;
        currentCaseId = defaultCase.id;

        console.log('✅ Migración completada exitosamente');
        console.log('📊 Requerimiento:', newRequirement.info.name || 'Sin nombre');
        console.log('📁 Casos:', newRequirement.cases.length);
        console.log('📝 Escenarios totales:', newRequirement.stats.totalScenarios);

        return newRequirement;

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw new Error('Error al migrar datos: ' + error.message);
    }
}

// ===============================================
// CÁLCULO DE ESTADÍSTICAS
// ===============================================

/**
 * Actualiza las estadísticas de un caso específico
 */
function updateCaseStats(caseObj) {
    if (!caseObj || !caseObj.scenarios) return;

    const scenarios = caseObj.scenarios;

    caseObj.stats = {
        totalScenarios: scenarios.length,
        totalHours: scenarios.reduce((sum, s) => sum + (parseFloat(s.testTime) || 0), 0),
        totalOK: scenarios.filter(s => s.status === 'OK').length,
        totalNO: scenarios.filter(s => s.status === 'NO').length,
        totalPending: scenarios.filter(s => !s.status || s.status === '' || s.status === 'Pendiente').length,
        cycles: [...new Set(scenarios.map(s => s.cycleNumber).filter(c => c))]
    };

    // Calcular tasa de éxito
    caseObj.stats.successRate = caseObj.stats.totalScenarios > 0 ?
        Math.round((caseObj.stats.totalOK / caseObj.stats.totalScenarios) * 100) : 0;

    caseObj.updatedAt = new Date().toISOString();
}

/**
 * Actualiza las estadísticas del requerimiento completo
 */
function updateRequirementStats(requirement) {
    if (!requirement || !requirement.cases) return;

    // Actualizar stats de cada caso primero
    requirement.cases.forEach(updateCaseStats);

    // Calcular stats consolidadas
    const allScenarios = requirement.cases.flatMap(c => c.scenarios || []);
    const allCycles = [...new Set(allScenarios.map(s => s.cycleNumber).filter(c => c))];

    requirement.stats = {
        totalCases: requirement.cases.length,
        totalScenarios: allScenarios.length,
        totalHours: requirement.cases.reduce((sum, c) => sum + (c.stats.totalHours || 0), 0),
        totalOK: requirement.cases.reduce((sum, c) => sum + (c.stats.totalOK || 0), 0),
        totalNO: requirement.cases.reduce((sum, c) => sum + (c.stats.totalNO || 0), 0),
        totalPending: requirement.cases.reduce((sum, c) => sum + (c.stats.totalPending || 0), 0),
        activeCycles: allCycles.sort((a, b) => parseInt(a) - parseInt(b))
    };

    // Calcular tasa de éxito general
    requirement.stats.successRate = requirement.stats.totalScenarios > 0 ?
        Math.round((requirement.stats.totalOK / requirement.stats.totalScenarios) * 100) : 0;

    requirement.updatedAt = new Date().toISOString();
}

// ===============================================
// GESTIÓN DE CASOS
// ===============================================

/**
 * Agrega un nuevo caso al requerimiento actual
 */
function addNewCase(title, objective, caseNumber = "") {
    if (!currentRequirement) {
        console.error('❌ No hay requerimiento activo');
        return null;
    }

    const newCase = createNewCase(title, objective, caseNumber);
    currentRequirement.cases.push(newCase);

    updateRequirementStats(currentRequirement);
    saveMulticaseData();

    console.log('✅ Nuevo caso agregado:', title);
    return newCase;
}

/**
 * Elimina un caso del requerimiento actual
 */
function deleteCase(caseId) {
    if (!currentRequirement || !caseId) return false;

    const caseIndex = currentRequirement.cases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) {
        console.error('❌ Caso no encontrado:', caseId);
        return false;
    }

    // Si es el caso activo, cambiar a otro
    if (currentCaseId === caseId) {
        const remainingCases = currentRequirement.cases.filter(c => c.id !== caseId);
        currentCaseId = remainingCases.length > 0 ? remainingCases[0].id : null;
    }

    currentRequirement.cases.splice(caseIndex, 1);
    updateRequirementStats(currentRequirement);
    saveMulticaseData();

    console.log('✅ Caso eliminado:', caseId);
    return true;
}

/**
 * Obtiene el caso actualmente seleccionado
 */
function getCurrentCase() {
    if (!currentRequirement || !currentCaseId) return null;

    return currentRequirement.cases.find(c => c.id === currentCaseId);
}

/**
 * Cambia al caso especificado
 */
function switchToCase(caseId) {
    if (!currentRequirement) {
        console.error('❌ No hay requerimiento activo');
        return false;
    }

    const targetCase = currentRequirement.cases.find(c => c.id === caseId);
    if (!targetCase) {
        console.error('❌ Caso no encontrado:', caseId);
        return false;
    }

    currentCaseId = caseId;

    // Actualizar variables globales actuales para mantener compatibilidad
    testCases = targetCase.scenarios || [];
    inputVariableNames = targetCase.inputVariableNames || [];
    filteredCases = [...testCases];

    console.log('✅ Cambiado al caso:', targetCase.title);
    return true;
}

// ===============================================
// PERSISTENCIA DE DATOS
// ===============================================

/**
 * Guarda todos los datos multicaso en localStorage
 */
function saveMulticaseData() {
    if (!currentRequirement) return;

    try {
        // Actualizar estadísticas antes de guardar
        updateRequirementStats(currentRequirement);

        // Guardar estructura completa
        localStorage.setItem('currentRequirement', JSON.stringify(currentRequirement));
        localStorage.setItem('currentCaseId', currentCaseId);
        localStorage.setItem('multicaseMode', multicaseMode.toString());

        console.log('✅ Datos multicaso guardados');

    } catch (error) {
        console.error('❌ Error guardando datos multicaso:', error);
    }
}

/**
 * Carga datos multicaso desde localStorage
 */
function loadMulticaseData() {
    try {
        const savedRequirement = localStorage.getItem('currentRequirement');
        const savedCaseId = localStorage.getItem('currentCaseId');
        const savedMulticaseMode = localStorage.getItem('multicaseMode');

        if (savedRequirement) {
            currentRequirement = JSON.parse(savedRequirement);
            currentCaseId = savedCaseId;
            multicaseMode = savedMulticaseMode === 'true';

            // Si hay un caso activo, cargar sus datos en las variables globales
            if (currentCaseId) {
                switchToCase(currentCaseId);
            }

            console.log('✅ Datos multicaso cargados');
            console.log('📋 Requerimiento:', currentRequirement.info.name || 'Sin nombre');
            console.log('📁 Casos:', currentRequirement.cases.length);

            return true;
        }

        return false;

    } catch (error) {
        console.error('❌ Error cargando datos multicaso:', error);
        return false;
    }
}

// ===============================================
// FUNCIONES DE UTILIDAD
// ===============================================

/**
 * Verifica si el modo multicaso está activo
 */
function isMulticaseMode() {
    return multicaseMode && currentRequirement && currentRequirement.cases.length > 0;
}

/**
 * Activa el modo multicaso
 */
function enableMulticaseMode() {
    multicaseMode = true;

    // Si no hay requerimiento, migrar datos actuales
    if (!currentRequirement) {
        migrateToMulticase();
    }

    saveMulticaseData();
    console.log('✅ Modo multicaso activado');
}

/**
 * Obtiene resumen de estadísticas para debug
 */
function getMulticaseStats() {
    if (!currentRequirement) return null;

    return {
        requirement: currentRequirement.info.name || 'Sin nombre',
        cases: currentRequirement.cases.length,
        totalScenarios: currentRequirement.stats.totalScenarios,
        totalHours: currentRequirement.stats.totalHours,
        successRate: currentRequirement.stats.successRate,
        currentCase: getCurrentCase()?.title || 'Ninguno'
    };
}

// ===============================================
// SINCRONIZACIÓN DE DATOS
// ===============================================

/**
 * Sincroniza los datos del requerimiento entre el sistema antiguo y multicaso
 */
function syncRequirementData() {
    if (!currentRequirement) {
        console.log('⚠️ No hay requerimiento multicaso activo para sincronizar');
        return;
    }

    if (requirementInfo && typeof requirementInfo === 'object') {
        // Sincronizar desde requirementInfo hacia currentRequirement.info
        currentRequirement.info = { ...currentRequirement.info, ...requirementInfo };
        currentRequirement.updatedAt = new Date().toISOString();

        // Guardar datos multicaso
        saveMulticaseData();

        console.log('✅ Datos del requerimiento sincronizados');
        console.log('📋 Datos sincronizados:', currentRequirement.info);
    }
}

// ===============================================
// EXPOSICIÓN GLOBAL Y DEBUG
// ===============================================

// Exponer funciones principales globalmente
window.migrateToMulticase = migrateToMulticase;
window.enableMulticaseMode = enableMulticaseMode;
window.addNewCase = addNewCase;
window.deleteCase = deleteCase;
window.switchToCase = switchToCase;
window.getCurrentCase = getCurrentCase;
window.saveMulticaseData = saveMulticaseData;
window.loadMulticaseData = loadMulticaseData;
window.isMulticaseMode = isMulticaseMode;
window.getMulticaseStats = getMulticaseStats;
window.syncRequirementData = syncRequirementData;

// Debug functions
window.debugMulticase = function () {
    console.log('🔍 DEBUG MULTICASO:');
    console.log('currentRequirement:', currentRequirement);
    console.log('currentCaseId:', currentCaseId);
    console.log('multicaseMode:', multicaseMode);
    console.log('Stats:', getMulticaseStats());
};

// ===============================================
// INICIALIZACIÓN
// ===============================================

// Intentar cargar datos multicaso al cargar el archivo
// Inicialización automática al cargar el archivo
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        // 1. Intentar cargar datos multicaso existentes
        const loaded = loadMulticaseData();

        if (loaded) {
            console.log('✅ Datos multicaso cargados automáticamente');
            return;
        }

        // 2. Si no hay datos multicaso, verificar si hay datos del sistema antiguo
        if (testCases && testCases.length > 0) {
            console.log('🔄 Datos del sistema antiguo detectados, migrando automáticamente...');
            enableMulticaseMode();
            return;
        }

        // 3. Si no hay datos de ningún tipo, activar modo multicaso por defecto
        console.log('🚀 Activando modo multicaso automáticamente (primera vez)');
        enableMulticaseMode();

    }, 200); // Esperar 200ms para que se carguen los datos del sistema antiguo
});

console.log('✅ multicase-core.js cargado - Sistema multicaso inicializado');