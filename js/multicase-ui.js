// ===============================================
// MULTICASE-UI.JS - Interfaz de Usuario Multicaso
// ===============================================

// ===============================================
// COMPONENTE: REQUIREMENT HEADER
// ===============================================

/**
 * Crea y actualiza el header principal del requerimiento (MEJORADO)
 */
function createRequirementHeader() {
    let headerContainer = document.getElementById('requirementHeader');
    
    if (!headerContainer) {
        headerContainer = document.createElement('div');
        headerContainer.id = 'requirementHeader';
        headerContainer.className = 'requirement-header-multicaso';
        
        // Insertar después del header actual
        const currentHeader = document.querySelector('.header');
        if (currentHeader) {
            currentHeader.parentNode.insertBefore(headerContainer, currentHeader.nextSibling);
        }
        
        // OCULTAR la card vieja para evitar duplicación
        const oldRequirementInfo = document.getElementById('requirementInfo');
        if (oldRequirementInfo) {
            oldRequirementInfo.style.display = 'none';
        }
    }
    
    const requirement = currentRequirement;
    if (!requirement) return;
    
    const stats = requirement.stats;
    const currentCase = getCurrentCase();
    
    // Calcular fecha del primer escenario ejecutado del caso actual
    const firstExecutionDate = currentCase ? getFirstExecutionDate(currentCase) : null;
    
    headerContainer.innerHTML = `
        <div class="requirement-header-content">
            <!-- SECCIÓN SUPERIOR: DATOS DEL REQUERIMIENTO -->
            <div class="requirement-title-section">
                <div class="requirement-icon">📋</div>
                <div class="requirement-info">
                    <h2 class="requirement-title">${requirement.info.name || 'Requerimiento Sin Nombre'}</h2>
                    <div class="requirement-meta">
                        <span class="requirement-number">📋 ${requirement.info.number || 'Sin número'}</span>
                        <span class="requirement-separator">•</span>
                        <span class="requirement-tester">👤 ${requirement.info.tester || 'Sin tester principal'}</span>
                        <span class="requirement-separator">•</span>
                        <span class="requirement-date">📅 ${formatDateForDisplay(requirement.info.startDate) || 'Sin fecha'}</span>
                    </div>
                </div>
            </div>
            
            <div class="requirement-stats">
                <div class="stat-item">
                    <div class="stat-number">${stats.totalCases}</div>
                    <div class="stat-label">Casos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.totalScenarios}</div>
                    <div class="stat-label">Escenarios</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.totalHours.toFixed(1)}h</div>
                    <div class="stat-label">Tiempo</div>
                </div>
                <div class="stat-item stat-success">
                    <div class="stat-number">${stats.successRate}%</div>
                    <div class="stat-label">Éxito</div>
                </div>
            </div>
        </div>
        
        <!-- SECCIÓN INFERIOR: DATOS DEL CASO ACTIVO -->
        <div class="current-case-details-section">
            <div class="case-details-grid">
                <div class="case-detail-group">
                    <div class="case-detail-item">
                        <span class="case-detail-label">N° Caso Actual</span>
                        <span class="case-detail-value">${currentCase ? extractCaseNumber(currentCase) : '-'}</span>
                    </div>
                    <div class="case-detail-item">
                        <span class="case-detail-label">Título Caso</span>
                        <span class="case-detail-value">${currentCase ? currentCase.title : 'Sin caso activo'}</span>
                    </div>
                </div>
                <div class="case-detail-group">
                    <div class="case-detail-item">
                        <span class="case-detail-label">Prerequisitos/Requisitos</span>
                        <span class="case-detail-value">${currentCase ? (currentCase.prerequisites || 'A completar por tester') : '-'}</span>
                    </div>
                    <div class="case-detail-item">
                        <span class="case-detail-label">Fecha de inicio</span>
                        <span class="case-detail-value">${firstExecutionDate ? formatDateForDisplay(firstExecutionDate) : 'Sin ejecuciones'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="requirement-actions">
            <button class="btn btn-success btn-small" onclick="openNewCaseModal()">
                ➕ Nuevo Caso
            </button>
            <button class="btn btn-info btn-small" onclick="openRequirementReports()">
                📊 Reportes
            </button>
            <button class="btn btn-warning btn-small" onclick="openRequirementConfig()">
                ⚙️ Configuración
            </button>
            <button class="btn btn-primary btn-small" onclick="openRequirementSaveLoad()">
                💾 Guardar/Cargar
            </button>
        </div>
    `;
    
    console.log('✅ Requirement header mejorado actualizado');
}

/**
 * Extrae el número del caso (ahora usa el campo caseNumber)
 */
function extractCaseNumber(caseObj) {
    if (!caseObj) return '-';
    
    // Usar el campo caseNumber si existe, sino extraer del título
    if (caseObj.caseNumber) {
        return caseObj.caseNumber;
    }
    
    // Fallback: extraer del título
    const match = caseObj.title.match(/(?:caso|case)\s*(\d+)/i) || caseObj.title.match(/^(\d+)$/);
    return match ? match[1] : caseObj.title;
}

/**
 * Obtiene la fecha del primer escenario ejecutado (OK/NO) del caso
 */
function getFirstExecutionDate(caseObj) {
    if (!caseObj || !caseObj.scenarios) return null;
    
    // Filtrar solo escenarios ejecutados (OK o NO)
    const executedScenarios = caseObj.scenarios.filter(scenario => 
        scenario.status === 'OK' || scenario.status === 'NO'
    );
    
    if (executedScenarios.length === 0) return null;
    
    // Ordenar por fecha de ejecución y tomar el primero
    executedScenarios.sort((a, b) => {
        const dateA = new Date(a.executionDate || '9999-12-31');
        const dateB = new Date(b.executionDate || '9999-12-31');
        return dateA - dateB;
    });
    
    return executedScenarios[0].executionDate;
}

// ===============================================
// COMPONENTE: CASE NAVIGATION TABS
// ===============================================

/**
 * Crea y actualiza la navegación entre casos
 */
function createCaseNavigation() {
    let navigationContainer = document.getElementById('caseNavigation');
    
    if (!navigationContainer) {
        navigationContainer = document.createElement('div');
        navigationContainer.id = 'caseNavigation';
        navigationContainer.className = 'case-navigation';
        
        // Insertar después del requirement header
        const requirementHeader = document.getElementById('requirementHeader');
        if (requirementHeader) {
            requirementHeader.parentNode.insertBefore(navigationContainer, requirementHeader.nextSibling);
        }
    }
    
    const requirement = currentRequirement;
    if (!requirement || !requirement.cases) return;
    
    const caseTabs = requirement.cases.map(caseObj => {
        const isActive = caseObj.id === currentCaseId;
        const scenarios = caseObj.scenarios.length;
        const hours = caseObj.stats.totalHours.toFixed(1);
        
        return `
            <div class="case-tab ${isActive ? 'case-tab-active' : ''}" 
                 onclick="switchToCaseUI('${caseObj.id}')" 
                 data-case-id="${caseObj.id}">
                <div class="case-tab-header">
                    <span class="case-tab-icon">📁</span>
                    <span class="case-tab-title"> Caso ${caseObj.caseNumber}</span>
                    <div class="case-tab-actions">
                        <button class="case-tab-edit" onclick="editCaseUI('${caseObj.id}', event)" title="Editar caso">
                            ⚙️
                        </button>
                        <button class="case-tab-close" onclick="deleteCaseUI('${caseObj.id}', event)" title="Eliminar caso">
                            ✕
                        </button>
                    </div>
                </div>
                <div class="case-tab-stats">
                    <span class="case-stat">${scenarios} escenarios</span>
                    <span class="case-separator">•</span>
                    <span class="case-stat">${hours}h</span>
                    <span class="case-separator">•</span>
                    <span class="case-stat case-success">${caseObj.stats.successRate}%</span>
                </div>
                <div class="case-tab-objective">${caseObj.title || 'Sin objetivo definido'}</div>
            </div>
        `;
    }).join('');
    
    navigationContainer.innerHTML = `
        <div class="case-navigation-content">
            <div class="case-tabs-container">
                ${caseTabs}
                <div class="case-tab case-tab-add" onclick="openNewCaseModal()">
                    <div class="case-add-icon">➕</div>
                    <div class="case-add-text">Nuevo Caso</div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Case navigation actualizada');
}

// ===============================================
// FUNCIONES DE INTERACCIÓN
// ===============================================

/**
 * Cambia a un caso específico desde la UI
 */
function switchToCaseUI(caseId) {
    console.log('🔄 Cambiando a caso:', caseId);
    
    const success = switchToCase(caseId);
    if (success) {
        // Actualizar navegación
        updateCaseNavigation();
        
        // 🆕 ACTUALIZAR HEADER DEL REQUERIMIENTO (para "N° Caso Actual")
        createRequirementHeader();
        
        // Actualizar contenido del caso
        updateCurrentCaseContent();
        
        // Actualizar estadísticas
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        // Actualizar tabla de escenarios
        if (typeof renderTestCases === 'function') {
            renderTestCases();
        }
        
        console.log('✅ Cambiado a caso exitosamente');
    }
}

/**
 * Elimina un caso desde la UI
 */
function deleteCaseUI(caseId, event) {
    // Prevenir propagación para que no active el switch
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const caseObj = currentRequirement.cases.find(c => c.id === caseId);
    if (!caseObj) return;
    
    const confirmMessage = `⚠️ ¿Eliminar "${caseObj.title}"?\n\n` +
        `• ${caseObj.scenarios.length} escenarios se perderán\n` +
        `• ${caseObj.stats.totalHours.toFixed(1)} horas de trabajo\n\n` +
        `Esta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
        const success = deleteCase(caseId);
        if (success) {
            // Actualizar UI completa
            updateMulticaseUI();
            
            alert(`✅ "${caseObj.title}" eliminado correctamente`);
        }
    }
}

/**
 * Edita un caso desde la UI
 */
function editCaseUI(caseId, event) {
    // Prevenir propagación para que no active el switch
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const caseObj = currentRequirement.cases.find(c => c.id === caseId);
    if (!caseObj) return;
    
    openEditCaseModal(caseObj);
}

/**
 * Actualiza solo la navegación de casos
 */
function updateCaseNavigation() {
    createCaseNavigation();
}

/**
 * Actualiza el contenido del caso actual
 */
function updateCurrentCaseContent() {
    const currentCase = getCurrentCase();
    if (!currentCase) return;
    
    // Actualizar título del caso en algún lugar visible
    updateCurrentCaseHeader(currentCase);
}

/**
 * Actualiza el header del caso actual
 */
function updateCurrentCaseHeader(caseObj) {
    // Buscar si hay algún elemento donde mostrar info del caso actual
    let caseHeader = document.getElementById('currentCaseHeader');
    
    if (!caseHeader) {
        caseHeader = document.createElement('div');
        caseHeader.id = 'currentCaseHeader';
        caseHeader.className = 'current-case-header';
        
        // Insertar antes de los filtros actuales
        const filters = document.querySelector('.filters');
        if (filters) {
            filters.parentNode.insertBefore(caseHeader, filters);
        }
    }
    
    caseHeader.innerHTML = `
        <div class="current-case-info">
            <h3 class="current-case-title">📁 Caso ${caseObj.caseNumber}</h3>
            <p class="current-case-objective">${caseObj.title || 'Sin objetivo definido'}</p>
        </div>
        <div class="current-case-stats">
            <span class="case-stat">${caseObj.scenarios.length} escenarios</span>
            <span class="case-separator">•</span>
            <span class="case-stat">${caseObj.stats.totalHours.toFixed(1)} horas</span>
            <span class="case-separator">•</span>
            <span class="case-stat">${caseObj.stats.successRate}% éxito</span>
        </div>
    `;
}

// ===============================================
// MODAL: NUEVO CASO
// ===============================================

/**
 * Abre modal para crear nuevo caso
 */
function openNewCaseModal() {
    // Crear modal si no existe
    let modal = document.getElementById('newCaseModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'newCaseModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>📁 Nuevo Caso de Prueba</h2>
                    <span class="close" onclick="closeNewCaseModal()">&times;</span>
                </div>
                <form id="newCaseForm">
                    <div class="form-group">
                        <label>N° del Caso: *</label>
                        <input type="text" id="newCaseNumber" placeholder="Ej: 1, 2, 3..." required>
                    </div>
                    <div class="form-group">
                        <label>Título del Caso: *</label>
                        <input type="text" id="newCaseTitle" placeholder="Ej: Validación de formularios" required>
                    </div>
                    <div class="form-group">
                        <label>Objetivo:</label>
                        <textarea id="newCaseObjective" rows="3" 
                                placeholder="Describe qué se va a probar en este caso..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Prerequisitos/Requisitos:</label>
                        <textarea id="newCasePrerequisites" rows="2" 
                                placeholder="Condiciones previas, configuraciones necesarias, datos requeridos..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Variables de Entrada Iniciales:</label>
                        <input type="text" id="newCaseVariables" 
                               placeholder="Variable 1, Variable 2, Variable 3..." 
                               value="Variable 1, Variable 2">
                        <small>Separadas por comas. Se pueden modificar después.</small>
                    </div>
                    <div class="controls">
                        <button type="submit" class="btn btn-success">📁 Crear Caso</button>
                        <button type="button" class="btn" onclick="closeNewCaseModal()">❌ Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Agregar event listener al formulario
        document.getElementById('newCaseForm').addEventListener('submit', handleNewCaseSubmit);
    }
    
    // Limpiar formulario
    document.getElementById('newCaseNumber').value = '';
    document.getElementById('newCaseTitle').value = '';
    document.getElementById('newCaseObjective').value = '';
    document.getElementById('newCasePrerequisites').value = '';
    document.getElementById('newCaseVariables').value = 'Variable 1, Variable 2';
    
    // Mostrar modal
    modal.style.display = 'block';
    
    // Focus en título
    setTimeout(() => {
        document.getElementById('newCaseTitle').focus();
    }, 100);
}

/**
 * Abre modal para editar caso existente
 */
function openEditCaseModal(caseObj) {
    // Crear modal si no existe
    let modal = document.getElementById('editCaseModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editCaseModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>⚙️ Editar Caso de Prueba</h2>
                    <span class="close" onclick="closeEditCaseModal()">&times;</span>
                </div>
                <form id="editCaseForm">
                    <input type="hidden" id="editCaseId">
                    <div class="form-group">
                        <label>N° del Caso: *</label>
                        <input type="text" id="editCaseNumber" required>
                    </div>
                    <div class="form-group">
                        <label>Título del Caso: *</label>
                        <input type="text" id="editCaseTitle" required>
                    </div>
                    <div class="form-group">
                        <label>Objetivo:</label>
                        <textarea id="editCaseObjective" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Prerequisitos/Requisitos:</label>
                        <textarea id="editCasePrerequisites" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Variables de Entrada:</label>
                        <input type="text" id="editCaseVariables">
                        <small>Separadas por comas.</small>
                    </div>
                    <div class="controls">
                        <button type="submit" class="btn btn-success">💾 Guardar Cambios</button>
                        <button type="button" class="btn" onclick="closeEditCaseModal()">❌ Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Agregar event listener al formulario
        document.getElementById('editCaseForm').addEventListener('submit', handleEditCaseSubmit);
    }
    
    // Llenar formulario con datos del caso
    document.getElementById('editCaseId').value = caseObj.id;
    document.getElementById('editCaseNumber').value = caseObj.caseNumber || '';
    document.getElementById('editCaseTitle').value = caseObj.title || '';
    document.getElementById('editCaseObjective').value = caseObj.objective || '';
    document.getElementById('editCasePrerequisites').value = caseObj.prerequisites || '';
    document.getElementById('editCaseVariables').value = (caseObj.inputVariableNames || []).join(', ');
    
    // Mostrar modal
    modal.style.display = 'block';
    
    // Focus en número
    setTimeout(() => {
        document.getElementById('editCaseNumber').focus();
    }, 100);
}

/**
 * Cierra modal de editar caso
 */
function closeEditCaseModal() {
    const modal = document.getElementById('editCaseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Maneja envío del formulario de editar caso
 */
function handleEditCaseSubmit(e) {
    e.preventDefault();
    
    const caseId = document.getElementById('editCaseId').value;
    const caseNumber = document.getElementById('editCaseNumber').value.trim();
    const title = document.getElementById('editCaseTitle').value.trim();
    const objective = document.getElementById('editCaseObjective').value.trim();
    const prerequisites = document.getElementById('editCasePrerequisites').value.trim();
    const variablesText = document.getElementById('editCaseVariables').value.trim();
    
    if (!caseNumber) {
        alert('⚠️ El N° del Caso es obligatorio');
        document.getElementById('editCaseNumber').focus();
        return;
    }
    
    if (!title) {
        alert('⚠️ El título del caso es obligatorio');
        document.getElementById('editCaseTitle').focus();
        return;
    }
    
    // Encontrar el caso a editar
    const caseObj = currentRequirement.cases.find(c => c.id === caseId);
    if (!caseObj) {
        alert('❌ Error: Caso no encontrado');
        return;
    }
    
    // Procesar variables
    const variables = variablesText ? 
        variablesText.split(',').map(v => v.trim()).filter(v => v) : 
        ['Variable 1', 'Variable 2'];
    
    // Actualizar caso
    caseObj.caseNumber = caseNumber;
    caseObj.title = title;
    caseObj.objective = objective;
    caseObj.prerequisites = prerequisites || 'A completar por tester';
    caseObj.inputVariableNames = variables;
    caseObj.updatedAt = new Date().toISOString();
    
    // Si estamos editando el caso activo, actualizar variables globales
    if (currentCaseId === caseId) {
        inputVariableNames = variables;
    }
    
    // Guardar cambios
    saveMulticaseData();
    
    // Actualizar UI
    updateMulticaseUI();
    
    // Cerrar modal
    closeEditCaseModal();
    
    alert(`✅ Caso "${caseNumber}: ${title}" actualizado exitosamente`);
}

/**
 * Maneja envío del formulario de nuevo caso
 */
function handleNewCaseSubmit(e) {
    e.preventDefault();
    
    const caseNumber = document.getElementById('newCaseNumber').value.trim();
    const title = document.getElementById('newCaseTitle').value.trim();
    const objective = document.getElementById('newCaseObjective').value.trim();
    const prerequisites = document.getElementById('newCasePrerequisites').value.trim();
    const variablesText = document.getElementById('newCaseVariables').value.trim();
    
    if (!caseNumber) {
        alert('⚠️ El N° del Caso es obligatorio');
        document.getElementById('newCaseNumber').focus();
        return;
    }
    
    if (!title) {
        alert('⚠️ El título del caso es obligatorio');
        document.getElementById('newCaseTitle').focus();
        return;
    }
    
    // Procesar variables
    const variables = variablesText ? 
        variablesText.split(',').map(v => v.trim()).filter(v => v) : 
        ['Variable 1', 'Variable 2'];
    
    // Crear nuevo caso
    const newCase = addNewCase(title, objective, caseNumber);
    if (newCase) {
        // Configurar campos adicionales del nuevo caso
        newCase.inputVariableNames = variables;
        newCase.prerequisites = prerequisites || 'A completar por tester';
        
        // Cambiar al nuevo caso
        switchToCaseUI(newCase.id);
        
        // Actualizar UI
        updateMulticaseUI();
        
        // Cerrar modal
        closeNewCaseModal();
        
        alert(`✅ Caso "${caseNumber}: ${title}" creado exitosamente`);
    }
}

// ===============================================
// FUNCIONES PRINCIPALES DE UI
// ===============================================

/**
 * Actualiza toda la UI multicaso
 */
function updateMulticaseUI() {
    if (!isMulticaseMode()) return;
    
    createRequirementHeader(); // 🆕 Actualiza info completa incluyendo "N° Caso Actual"
    createCaseNavigation();
    updateCurrentCaseContent();
    
    // 🆕 Actualizar estadísticas si existe la función
    if (typeof updateStats === 'function') {
        updateStats();
    }
}

/**
 * Inicializa la UI multicaso
 */
function initializeMulticaseUI() {
    console.log('🎨 Inicializando UI multicaso...');
    
    if (!isMulticaseMode()) {
        console.log('⚠️ Modo multicaso no activo');
        return;
    }
    
    // Crear componentes principales
    updateMulticaseUI();
    
    // Configurar event listeners adicionales
    setupMulticaseEventListeners();
    
    console.log('✅ UI multicaso inicializada');
}

/**
 * Configura event listeners específicos del modo multicaso
 */
function setupMulticaseEventListeners() {
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modals = ['newCaseModal', 'editCaseModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// ===============================================
// FUNCIONES TEMPORALES PARA BOTONES DEL HEADER
// ===============================================

/**
 * Abre reportes a nivel requerimiento
 */
function openRequirementReports() {
    alert('🚧 Reportes consolidados - Próximamente en Fase 5');
}

/**
 * Abre configuración a nivel requerimiento
 */
function openRequirementConfig() {
    alert('🚧 Configuración de requerimiento - Próximamente en Fase 3');
}

/**
 * Abre guardar/cargar a nivel requerimiento
 */
function openRequirementSaveLoad() {
    alert('🚧 Guardar/Cargar completo - Próximamente en Fase 4');
}

// ===============================================
// FUNCIÓN FALTANTE - CERRAR MODAL
// ===============================================

function closeNewCaseModal() {
    const modal = document.getElementById('newCaseModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Limpiar formulario
        const form = document.getElementById('newCaseForm');
        if (form) {
            form.reset();
        }
        
        console.log('✅ Modal de nuevo caso cerrado');
    }
}

// ===============================================
// EXPOSICIÓN GLOBAL
// ===============================================

// Exponer funciones principales
window.initializeMulticaseUI = initializeMulticaseUI;
window.updateMulticaseUI = updateMulticaseUI;
window.createRequirementHeader = createRequirementHeader;
window.createCaseNavigation = createCaseNavigation;
window.switchToCaseUI = switchToCaseUI;
window.deleteCaseUI = deleteCaseUI;
window.editCaseUI = editCaseUI;
window.openNewCaseModal = openNewCaseModal;
window.closeNewCaseModal = closeNewCaseModal;
window.openEditCaseModal = openEditCaseModal;
window.closeEditCaseModal = closeEditCaseModal;
window.extractCaseNumber = extractCaseNumber;
window.getFirstExecutionDate = getFirstExecutionDate;

// ===============================================
// AUTO-INICIALIZACIÓN
// ===============================================

// Inicializar UI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un momento para que se carguen otros scripts
    setTimeout(() => {
        if (isMulticaseMode()) {
            initializeMulticaseUI();
        }
    }, 500);
});

console.log('✅ multicase-ui.js cargado - Interfaz multicaso preparada');