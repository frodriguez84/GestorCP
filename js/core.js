// ===============================================
// CORE.JS - Variables globales y funciones esenciales
// ===============================================

// ===============================================
// VARIABLES GLOBALES CRÍTICAS
// ===============================================

// Datos principales
let testCases = [];
let inputVariableNames = ['Variable 1', 'Variable 2']; // Variables por defecto
let filteredCases = [];
let requirementInfo = {
    number: '',
    name: '',
    description: '',
    caso: '',
    titleCase: '',
    tester: '',
    startDate: ''
};

// Control de formularios
let currentEditingId = null;

// Sistema de cronómetros
let activeTimerId = null;
let rowTimerInterval = null;
let rowTimerStartTime = 0;
let rowTimerAccum = 0;
let timerPaused = false;
let pausedTime = 0;
let timerInterval = null; // FALTABA - Para modal

// Sistema de selección múltiple
let selectedCases = new Set();

// ✅ NUEVAS VARIABLES PARA DRAG & DROP
let dragState = {
    isDragging: false,
    draggedCaseId: null,
    draggedElement: null,
    placeholder: null,
    startY: 0,
    startIndex: 0,
    draggedScenarioNumber: null,
    draggedScenarioBlock: [],
    dropZoneElement: null,
    ghostElement: null
};

// ✅ VARIABLE PARA AUTO-SCROLL EN DRAG & DROP
let autoScrollState = {
    interval: null,
    direction: null,
    speed: 0,
    zones: {
        top: 50,
        bottom: 50
    }
};

// ✅ VARIABLES PARA CONTENEDOR Y COORDENADAS
let containerBounds = null;
let scrollContainer = null;

// ===============================================
// FUNCIONES DE PERSISTENCIA
// ===============================================

function saveToStorage() {
    try {
        localStorage.setItem('testCases', JSON.stringify(testCases));
        localStorage.setItem('inputVariableNames', JSON.stringify(inputVariableNames));
        localStorage.setItem('requirementInfo', JSON.stringify(requirementInfo));
        console.log('✅ Datos guardados en localStorage');
    } catch (e) {
        console.error('❌ Error guardando en localStorage:', e);
        alert('Error al guardar datos. Espacio de almacenamiento lleno.');
    }
}

function loadFromStorage() {
    try {
        // Cargar casos de prueba
        const savedCases = localStorage.getItem('testCases');
        if (savedCases) {
            testCases = JSON.parse(savedCases);
        }

        // Cargar variables de entrada
        const savedVars = localStorage.getItem('inputVariableNames');
        if (savedVars) {
            inputVariableNames = JSON.parse(savedVars);
        }

        // Cargar información del requerimiento
        const savedReqInfo = localStorage.getItem('requirementInfo');
        if (savedReqInfo) {
            requirementInfo = JSON.parse(savedReqInfo);
        }

        // Asegurar que filteredCases esté inicializado
        filteredCases = [...testCases];

        console.log('✅ Datos cargados desde localStorage');
        console.log(`📊 ${testCases.length} casos cargados`);

    } catch (e) {
        console.error('❌ Error cargando desde localStorage:', e);
        // Inicializar con valores por defecto
        testCases = [];
        inputVariableNames = ['Variable 1', 'Variable 2'];
        filteredCases = [];
    }
}

// ===============================================
// FUNCIONES DE INICIALIZACIÓN - SOLO MULTICASO
// ===============================================

function initializeApp() {
    console.log('🚀 Inicializando aplicación en modo multicaso únicamente...');

    // 🎯 PASO 1: Cargar datos del sistema original SOLO PARA MIGRACIÓN
    loadFromStorage();

    // 🎯 PASO 2: Forzar activación inmediata del sistema multicaso
    const loaded = loadMulticaseData();

    if (!loaded) {
        // Si no hay datos multicaso, migrar automáticamente
        console.log('🔄 Migrando al sistema multicaso...');
        enableMulticaseMode();
    }

    // 🎯 PASO 3: Configurar event listeners esenciales SOLO para multicaso
    setupEssentialEventListeners();

    // 🎯 PASO 4: Ocultar interfaz original INMEDIATAMENTE
    hideOriginalInterface();

    // 🎯 PASO 5: Actualizar interfaz multicaso
    setTimeout(() => {
        if (typeof updateMulticaseUI === 'function') {
            updateMulticaseUI();
        }
        if (typeof renderTestCases === 'function') {
            renderTestCases();
        }
        if (typeof updateStats === 'function') {
            updateStats();
        }
        // 🎯 CRÍTICO: Actualizar filtros después de cargar datos
        if (typeof updateFilters === 'function') {
            updateFilters();
            console.log('✅ Filtros actualizados automáticamente después de inicialización');
        }
    }, 50);

    console.log('✅ Aplicación inicializada en modo multicaso únicamente');
}

// 🎯 FUNCIÓN PARA OCULTAR INTERFAZ ORIGINAL
function hideOriginalInterface() {
    // Ocultar card de información del requerimiento original
    const oldRequirementInfo = document.getElementById('requirementInfo');
    if (oldRequirementInfo) {
        oldRequirementInfo.style.display = 'none';
    }

    // Ocultar cualquier otro elemento de la interfaz original
    const elementsToHide = [
        '.requirement-card',
        '#currentCaseHeader'
    ];

    elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.id !== 'requirementHeader') { // No ocultar el header multicaso
                el.style.display = 'none';
            }
        });
    });

    console.log('✅ Interfaz original ocultada');
}

function setupEssentialEventListeners() {
    // Event listeners para filtros
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (typeof applyFilters === 'function') applyFilters();
        });
    }

    const testerFilter = document.getElementById('testerFilter');
    if (testerFilter) {
        testerFilter.addEventListener('change', () => {
            if (typeof applyFilters === 'function') applyFilters();
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            if (typeof applyFilters === 'function') applyFilters();
        });
    }

    const dateFromFilter = document.getElementById('dateFromFilter');
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', () => {
            if (typeof applyFilters === 'function') applyFilters();
        });
    }

    const dateToFilter = document.getElementById('dateToFilter');
    if (dateToFilter) {
        dateToFilter.addEventListener('change', () => {
            if (typeof applyFilters === 'function') applyFilters();
        });
    }

    // Event listeners para botones principales
    const btnAddCase = document.getElementById('btnAddCase');
    if (btnAddCase) {
        btnAddCase.addEventListener('click', () => {
            if (typeof openAddModal === 'function') openAddModal();
        });
    }

    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', clearAllData);
    }

    const btnNewRequirement = document.getElementById('btnNewRequirement');
    if (btnNewRequirement) {
        btnNewRequirement.addEventListener('click', () => {
            if (typeof openRequirementModal === 'function') {
                openRequirementModal();
            }
        });
    }

    // Event listeners para modales
    setupModalEventListeners();
}

function setupModalEventListeners() {
    // Modal principal de casos
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (typeof closeModal === 'function') closeModal();
        });
    }

    const btnCancelModal = document.getElementById('btnCancelModal');
    if (btnCancelModal) {
        btnCancelModal.addEventListener('click', () => {
            if (typeof closeModal === 'function') closeModal();
        });
    }

    // Event listener para subida de evidencias
    const evidenceInput = document.getElementById('evidenceInput');
    if (evidenceInput) {
        evidenceInput.addEventListener('change', () => {
            if (typeof handleEvidenceUpload === 'function') handleEvidenceUpload();
        });
    }

    // Modal de evidencias
    const closeEvidenceModalBtn = document.getElementById('closeEvidenceModalBtn');
    if (closeEvidenceModalBtn) {
        closeEvidenceModalBtn.addEventListener('click', () => {
            document.getElementById('evidenceViewModal').style.display = 'none';
        });
    }

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function (event) {
        const modals = ['testCaseModal', 'evidenceViewModal', 'configVarsModal', 'requirementModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// ===============================================
// FUNCIÓN PARA LIMPIAR TODOS LOS DATOS
// ===============================================

function clearAllData() {
    const confirmMessage = `⚠️ ¿Estás seguro de que deseas eliminar TODOS los datos?

Esto eliminará:
• El requerimiento activo
• Todos los casos y escenarios de prueba
• Configuración de variables
• Historial y estadísticas

⚠️ Esta acción NO se puede deshacer.`;

    if (confirm(confirmMessage)) {
        currentRequirement = null;
        currentCaseId = null;
        multicaseMode = false;
        // Limpiar variables del sistema original
        testCases = [];
        filteredCases = [];
        inputVariableNames = ['Variable 1', 'Variable 2'];
        requirementInfo = {
            number: '',
            name: '',
            description: '',
            caso: '',
            titleCase: '',
            tester: '',
            startDate: ''
        };
        selectedCases.clear();

        //  LIMPIAR TAMBIÉN SISTEMA MULTICASO
        localStorage.removeItem('currentRequirement');
        localStorage.removeItem('currentCaseId');
        localStorage.removeItem('multicaseMode');

        // Detener cronómetro si está activo
        if (activeTimerId !== null && typeof stopRowTimer === 'function') {
            stopRowTimer();
        }

        // Limpiar localStorage
        localStorage.removeItem('testCases');
        localStorage.removeItem('inputVariableNames');
        localStorage.removeItem('requirementInfo');
        localStorage.removeItem('activeTab');

        //  REINICIALIZAR SISTEMA MULTICASO
        /*if (typeof enableMulticaseMode === 'function') {
            enableMulticaseMode();
        }*/

        // Actualizar interfaz
        if (typeof renderTestCases === 'function') renderTestCases();
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateFilters === 'function') updateFilters();
        if (typeof updateMulticaseUI === 'function') updateMulticaseUI();

        // ✅ FORZAR OCULTAR HEADER:
        const header = document.getElementById('requirementHeader');
        if (header) header.style.display = 'none';

        // ✅ OCULTAR NAVEGACIÓN DE CASOS:
        const caseNavigation = document.getElementById('caseNavigation');
        if (caseNavigation) caseNavigation.style.display = 'none';

        // ✅ OCULTAR HEADER DEL CASO ACTUAL:
        const currentCaseHeader = document.getElementById('currentCaseHeader');
        if (currentCaseHeader) currentCaseHeader.style.display = 'none';

        updateRequirementButtons();

        alert('✅ Todos los datos han sido eliminados correctamente');
        console.log('🗑️ Todos los datos eliminados');
    }
}

// ===============================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA - SOLO MULTICASO
// ===============================================

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // Si el documento ya está cargado
    initializeApp();
}

console.log('✅ core.js cargado - Sistema multicaso único inicializado');