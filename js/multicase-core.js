// ===============================================
// MULTICASE-CORE.JS - Sistema Multicaso CORREGIDO
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

/**
 * Verifica si existe un requerimiento activo
 */
function hasActiveRequirement() {
    return currentRequirement !== null;
}

// ===============================================
// ESTRUCTURA DEL CASO
// ===============================================

function createNewCase(title = "Nuevo Caso", objective = "", caseNumber = "") {
    return {
        id: `case_${Date.now()}`,
        caseNumber: caseNumber,
        title: title,
        objective: objective,
        prerequisites: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',

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
        console.log('📄 Escenarios totales:', newRequirement.stats.totalScenarios);

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
 * Cambia al caso especificado - VERSIÓN CORREGIDA
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

    // 🎯 PASO 1: Sincronizar caso actual ANTES de cambiar
    if (currentCaseId && currentCaseId !== caseId) {
        const currentCase = getCurrentCase();
        if (currentCase) {
            console.log('🔄 Sincronizando caso anterior antes del cambio...');
            currentCase.scenarios = [...testCases];
            currentCase.inputVariableNames = [...inputVariableNames];
            updateCaseStats(currentCase);
        }
    }

    // 🎯 PASO 2: Cambiar al nuevo caso
    currentCaseId = caseId;

    // 🎯 PASO 3: Actualizar variables globales ULTRA-ROBUSTA - PRESERVAR TODO
    console.log('🔄 Cargando escenarios del caso:', targetCase.title);
    console.log('📊 Escenarios en caso:', targetCase.scenarios?.length || 0);

    // Hacer copia ULTRA-PROFUNDA preservando ABSOLUTAMENTE TODOS los campos
    testCases = (targetCase.scenarios || []).map((scenario, index) => {
        // Log para debug
        console.log(`📋 Procesando escenario ${index}:`, {
            scenario: scenario.scenarioNumber,
            cycle: scenario.cycleNumber,
            status: scenario.status,
            id: scenario.id
        });

        // Crear objeto completamente nuevo preservando TODO
        const copiedScenario = {};

        // Copiar TODAS las propiedades del escenario original
        for (const key in scenario) {
            if (scenario.hasOwnProperty(key)) {
                if (Array.isArray(scenario[key])) {
                    // Arrays: copia profunda
                    copiedScenario[key] = scenario[key].map(item =>
                        typeof item === 'object' && item !== null ? { ...item } : item
                    );
                } else if (typeof scenario[key] === 'object' && scenario[key] !== null) {
                    // Objetos: copia profunda
                    copiedScenario[key] = { ...scenario[key] };
                } else {
                    // Primitivos: copia directa
                    copiedScenario[key] = scenario[key];
                }
            }
        }

        // Asegurar campos mínimos requeridos
        if (!copiedScenario.id) {
            copiedScenario.id = Date.now() + index;
        }

        // CRÍTICO: Asegurar que el estado se preserve exactamente
        if (scenario.status !== undefined) {
            copiedScenario.status = scenario.status;
        }

        console.log(`✅ Escenario ${index} copiado:`, {
            scenario: copiedScenario.scenarioNumber,
            cycle: copiedScenario.cycleNumber,
            status: copiedScenario.status,
            originalStatus: scenario.status
        });

        return copiedScenario;
    });

    inputVariableNames = [...(targetCase.inputVariableNames || ['Variable 1', 'Variable 2'])];
    filteredCases = [...testCases];

    console.log('📊 Estados finales cargados:', testCases.map(tc => ({
        scenario: tc.scenarioNumber,
        cycle: tc.cycleNumber,
        status: tc.status,
        id: tc.id
    })));

    // 🎯 PASO 4: Verificar que los IDs sean únicos
    testCases.forEach((testCase, index) => {
        if (!testCase.id) {
            testCase.id = Date.now() + index;
        }
    });

    console.log('✅ Estados preservados:', testCases.map(tc => ({ id: tc.id, scenario: tc.scenarioNumber, status: tc.status })));

    // 🎯 PASO 5: Guardar cambios inmediatamente
    updateCaseStats(targetCase);
    updateRequirementStats(currentRequirement);
    saveMulticaseData();

    // 🎯 PASO 6: Actualizar filtros después de cambiar caso
    setTimeout(() => {
        if (typeof updateFilters === 'function') {
            updateFilters();
            console.log('✅ Filtros actualizados después de cambiar caso');
        }
    }, 100);

    console.log('✅ Cambiado al caso:', targetCase.title);
    console.log(`📊 Cargados ${testCases.length} escenarios del caso`);
    console.log('📋 IDs de escenarios:', testCases.map(tc => tc.id));

    return true;

    return true;
}

// ===============================================
// PERSISTENCIA DE DATOS
// ===============================================

/**
 * Guarda todos los datos multicaso en localStorage - VERSIÓN ROBUSTA
 */
function saveMulticaseData() {
    if (!currentRequirement) {
        console.warn('⚠️ No hay requerimiento para guardar');
        return;
    }

    try {
        console.log('💾 Guardando datos multicaso...');

        // 🎯 SINCRONIZAR CASO ACTUAL ANTES DE GUARDAR
        if (currentCaseId) {
            const currentCase = getCurrentCase();
            if (currentCase) {
                console.log('🔄 Sincronizando caso actual antes de guardar...');

                // Sincronizar escenarios preservando TODOS los campos
                currentCase.scenarios = testCases.map(testCase => {
                    const syncedScenario = {};

                    // Copiar TODAS las propiedades
                    for (const key in testCase) {
                        if (testCase.hasOwnProperty(key)) {
                            if (Array.isArray(testCase[key])) {
                                syncedScenario[key] = testCase[key].map(item =>
                                    typeof item === 'object' && item !== null ? { ...item } : item
                                );
                            } else if (typeof testCase[key] === 'object' && testCase[key] !== null) {
                                syncedScenario[key] = { ...testCase[key] };
                            } else {
                                syncedScenario[key] = testCase[key];
                            }
                        }
                    }

                    return syncedScenario;
                });

                currentCase.inputVariableNames = [...inputVariableNames];
                updateCaseStats(currentCase);

                console.log('✅ Caso actual sincronizado antes de guardar');
                console.log('📊 Estados a guardar:', currentCase.scenarios.map(s => ({
                    scenario: s.scenarioNumber,
                    cycle: s.cycleNumber,
                    status: s.status
                })));
            }
        }

        // Actualizar estadísticas antes de guardar
        updateRequirementStats(currentRequirement);

        // Crear copia para verificación
        const dataToSave = JSON.stringify(currentRequirement);

        // Guardar estructura completa
        localStorage.setItem('currentRequirement', dataToSave);
        localStorage.setItem('currentCaseId', currentCaseId);
        localStorage.setItem('multicaseMode', multicaseMode.toString());

        console.log('✅ Datos multicaso guardados exitosamente');

        // 🎯 VERIFICAR QUE SE GUARDÓ CORRECTAMENTE
        const verification = localStorage.getItem('currentRequirement');
        if (verification) {
            const parsed = JSON.parse(verification);
            const currentCase = parsed.cases.find(c => c.id === currentCaseId);
            if (currentCase) {
                console.log('✅ Verificación de guardado exitosa');
                console.log('📊 Estados guardados:', currentCase.scenarios.map(s => ({
                    scenario: s.scenarioNumber,
                    cycle: s.cycleNumber,
                    status: s.status
                })));
            }
        }

    } catch (error) {
        console.error('❌ Error guardando datos multicaso:', error);

        // Intentar guardar una versión mínima de respaldo
        try {
            const backupData = {
                id: currentRequirement.id,
                info: currentRequirement.info,
                cases: currentRequirement.cases.map(c => ({
                    id: c.id,
                    title: c.title,
                    scenarios: c.scenarios || []
                }))
            };
            localStorage.setItem('currentRequirement_backup', JSON.stringify(backupData));
            console.log('💾 Datos de respaldo guardados');
        } catch (backupError) {
            console.error('❌ Error guardando respaldo:', backupError);
        }
    }
}

/**
 * Carga datos multicaso desde localStorage - VERSIÓN CORREGIDA
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

            // 🎯 VERIFICAR INTEGRIDAD DE DATOS
            if (!currentRequirement.cases || currentRequirement.cases.length === 0) {
                console.log('⚠️ Datos multicaso corruptos, reiniciando...');
                return false;
            }

            // 🎯 VERIFICAR QUE EL CASO ACTIVO EXISTE
            const activeCase = currentRequirement.cases.find(c => c.id === currentCaseId);
            if (!activeCase) {
                console.log('⚠️ Caso activo no encontrado, usando el primero...');
                currentCaseId = currentRequirement.cases[0].id;
            }

            // 🎯 CARGAR DATOS DEL CASO ACTIVO EN VARIABLES GLOBALES
            if (currentCaseId) {
                const success = switchToCase(currentCaseId);
                if (!success) {
                    console.error('❌ Error cargando caso activo');
                    return false;
                }
            }

            console.log('✅ Datos multicaso cargados correctamente');
            console.log('📋 Requerimiento:', currentRequirement.info.name || 'Sin nombre');
            console.log('📁 Casos:', currentRequirement.cases.length);
            console.log('📄 Caso activo:', activeCase?.title || 'Ninguno');

            // Actualizar UI inmediatamente después de cargar
            setTimeout(() => {
                if (typeof autoUpdateMulticaseUI === 'function') {
                    autoUpdateMulticaseUI();
                }
            }, 100);

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
 * Activa el modo multicaso - VERSIÓN MEJORADA
 */
function enableMulticaseMode() {
    multicaseMode = true;

    // Si no hay requerimiento, migrar datos actuales
    if (!currentRequirement) {
        migrateToMulticase();
    }

    // 🎯 ASEGURAR QUE HAY DATOS EN VARIABLES GLOBALES
    if (currentCaseId) {
        const currentCase = getCurrentCase();
        if (currentCase && currentCase.scenarios.length > 0) {
            testCases = [...currentCase.scenarios];
            inputVariableNames = [...currentCase.inputVariableNames];
            filteredCases = [...testCases];
        }
    }

    saveMulticaseData();
    console.log('✅ Modo multicaso activado correctamente');
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
// SINCRONIZACIÓN DE DATOS - MEJORADA
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

/**
 * Sincroniza escenarios entre sistema global y multicaso - VERSIÓN ULTRA-ROBUSTA
 */
function syncScenariosWithCurrentCase() {
    if (!currentRequirement || !currentCaseId) {
        console.log('⚠️ No hay caso activo para sincronizar');
        return false;
    }

    const currentCase = getCurrentCase();
    if (!currentCase) {
        console.log('⚠️ No se encontró el caso actual');
        return false;
    }

    console.log('🔄 Sincronizando escenarios ULTRA-ROBUSTA...');
    console.log(`📊 testCases: ${testCases.length} escenarios`);
    console.log(`📊 currentCase.scenarios: ${currentCase.scenarios?.length || 0} escenarios`);

    // 🎯 SINCRONIZACIÓN ULTRA-ROBUSTA - Preservar ABSOLUTAMENTE TODO
    currentCase.scenarios = testCases.map((testCase, index) => {
        console.log(`🔄 Sincronizando escenario ${index}:`, {
            scenario: testCase.scenarioNumber,
            cycle: testCase.cycleNumber,
            status: testCase.status,
            id: testCase.id
        });

        // Crear objeto completamente nuevo preservando TODO
        const syncedScenario = {};

        // Copiar TODAS las propiedades del testCase
        for (const key in testCase) {
            if (testCase.hasOwnProperty(key)) {
                if (Array.isArray(testCase[key])) {
                    // Arrays: copia profunda
                    syncedScenario[key] = testCase[key].map(item =>
                        typeof item === 'object' && item !== null ? { ...item } : item
                    );
                } else if (typeof testCase[key] === 'object' && testCase[key] !== null) {
                    // Objetos: copia profunda
                    syncedScenario[key] = { ...testCase[key] };
                } else {
                    // Primitivos: copia directa
                    syncedScenario[key] = testCase[key];
                }
            }
        }

        // CRÍTICO: Verificar que el estado se preserve
        if (testCase.status !== undefined) {
            syncedScenario.status = testCase.status;
        }

        console.log(`✅ Escenario ${index} sincronizado:`, {
            scenario: syncedScenario.scenarioNumber,
            cycle: syncedScenario.cycleNumber,
            status: syncedScenario.status,
            originalStatus: testCase.status
        });

        return syncedScenario;
    });

    currentCase.inputVariableNames = [...inputVariableNames];
    currentCase.updatedAt = new Date().toISOString();

    // Actualizar estadísticas
    updateCaseStats(currentCase);
    updateRequirementStats(currentRequirement);

    // Guardar datos multicaso
    saveMulticaseData();

    console.log('✅ Sincronización ULTRA-ROBUSTA completada');
    console.log(`📊 Resultado: ${currentCase.scenarios.length} escenarios en caso actual`);
    console.log('📊 Estados sincronizados:', currentCase.scenarios.map(s => ({
        scenario: s.scenarioNumber,
        cycle: s.cycleNumber,
        status: s.status
    })));

    return true;
}

/**
 * Función de guardado mejorada que sincroniza ambos sistemas
 */
function saveAndSync() {
    // 1. Guardar en sistema antiguo
    saveToStorage();

    // 2. Sincronizar con sistema multicaso
    syncScenariosWithCurrentCase();

    console.log('✅ Datos guardados y sincronizados en ambos sistemas');
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
window.syncScenariosWithCurrentCase = syncScenariosWithCurrentCase;
window.saveAndSync = saveAndSync;

// Debug functions
window.debugMulticase = function () {
    console.log('🔍 DEBUG MULTICASO:');
    console.log('currentRequirement:', currentRequirement);
    console.log('currentCaseId:', currentCaseId);
    console.log('multicaseMode:', multicaseMode);
    console.log('testCases length:', testCases.length);
    console.log('testCases IDs:', testCases.map(tc => tc.id));
    console.log('Stats:', getMulticaseStats());
};

// ===============================================
// INICIALIZACIÓN MEJORADA
// ===============================================

// 🎯 NUEVA INICIALIZACIÓN QUE NO DEPENDE DE DOM
function initializeMulticaseSystem() {
    console.log('🚀 Inicializando sistema multicaso...');

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
}

/**
 * Fuerza sincronización completa entre sistemas
 */
window.forceFullSync = function () {
    console.log('🔄 FORZANDO SINCRONIZACIÓN COMPLETA...');

    if (!currentRequirement || !currentCaseId) {
        console.error('❌ No hay caso activo para sincronizar');
        return false;
    }

    const currentCase = getCurrentCase();
    if (!currentCase) {
        console.error('❌ No se encontró el caso actual');
        return false;
    }

    console.log('📊 Estado ANTES de sincronización:');
    console.log('testCases:', testCases.map(tc => ({ id: tc.id, scenario: tc.scenarioNumber, status: tc.status })));
    console.log('currentCase.scenarios:', currentCase.scenarios.map(s => ({ id: s.id, scenario: s.scenarioNumber, status: s.status })));

    // Sincronizar desde testCases hacia currentCase.scenarios
    syncScenariosWithCurrentCase();

    // Guardar inmediatamente
    saveMulticaseData();

    // Guardar también en sistema tradicional
    saveToStorage();

    console.log('📊 Estado DESPUÉS de sincronización:');
    const updatedCase = getCurrentCase();
    console.log('testCases:', testCases.map(tc => ({ id: tc.id, scenario: tc.scenarioNumber, status: tc.status })));
    console.log('currentCase.scenarios:', updatedCase.scenarios.map(s => ({ id: s.id, scenario: s.scenarioNumber, status: s.status })));

    console.log('✅ Sincronización forzada completada');
    return true;
};

// Exponer globalmente
window.forceFullSync = forceFullSync;

// FUNCIÓN DEBUG PARA RASTREAR ESTADOS
window.debugStates = function () {
    console.log('=== DEBUG ESTADOS COMPLETO ===');

    console.log('📊 testCases estados:', testCases.map((tc, i) => ({
        index: i,
        id: tc.id,
        scenario: tc.scenarioNumber,
        cycle: tc.cycleNumber,
        status: tc.status,
        tester: tc.tester
    })));

    const currentCase = getCurrentCase();
    if (currentCase) {
        console.log('📊 currentCase.scenarios estados:', currentCase.scenarios.map((s, i) => ({
            index: i,
            id: s.id,
            scenario: s.scenarioNumber,
            cycle: s.cycleNumber,
            status: s.status,
            tester: s.tester
        })));

        // Comparar diferencias
        const differences = [];
        testCases.forEach((tc, i) => {
            const corresponding = currentCase.scenarios[i];
            if (corresponding && tc.status !== corresponding.status) {
                differences.push({
                    index: i,
                    testCaseStatus: tc.status,
                    caseScenarioStatus: corresponding.status,
                    scenario: tc.scenarioNumber,
                    cycle: tc.cycleNumber
                });
            }
        });

        if (differences.length > 0) {
            console.warn('⚠️ DIFERENCIAS ENCONTRADAS:', differences);
        } else {
            console.log('✅ Todos los estados coinciden');
        }
    }

    console.log('📋 Requerimiento completo:', currentRequirement);
}

// Exportar función de inicialización
window.initializeMulticaseSystem = initializeMulticaseSystem;
window.hasActiveRequirement = hasActiveRequirement;

console.log('✅ multicase-core.js cargado - Sistema multicaso mejorado inicializado');