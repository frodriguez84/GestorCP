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
// FUNCIONES DE INICIALIZACIÓN
// ===============================================

function initializeApp() {
    console.log('🚀 Inicializando aplicación...');
    
    // Cargar datos
    loadFromStorage();
    
    // Configurar event listeners esenciales
    setupEssentialEventListeners();
    
    // Actualizar interfaz
    if (typeof updateFilters === 'function') {
        updateFilters();
    }
    
    if (typeof renderTestCases === 'function') {
        renderTestCases();
    }
    
    if (typeof updateRequirementDisplay === 'function') {
        updateRequirementDisplay();
    }
    
    console.log('✅ Aplicación inicializada correctamente');
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
    window.addEventListener('click', function(event) {
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
• Todos los casos de prueba
• Configuración de variables
• Información del requerimiento
• Historial y estadísticas

⚠️ Esta acción NO se puede deshacer.`;

    if (confirm(confirmMessage)) {
        // Limpiar variables
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

        // Detener cronómetro si está activo
        if (activeTimerId !== null && typeof stopRowTimer === 'function') {
            stopRowTimer();
        }

        // Limpiar localStorage
        localStorage.removeItem('testCases');
        localStorage.removeItem('inputVariableNames');
        localStorage.removeItem('requirementInfo');
        localStorage.removeItem('activeTab');

        // Actualizar interfaz
        if (typeof renderTestCases === 'function') renderTestCases();
        if (typeof updateStats === 'function') updateStats();
        if (typeof updateFilters === 'function') updateFilters();
        if (typeof updateRequirementDisplay === 'function') updateRequirementDisplay();

        alert('✅ Todos los datos han sido eliminados correctamente');
        console.log('🗑️ Todos los datos eliminados');
    }
}

// ===============================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ===============================================

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // Si el documento ya está cargado
    initializeApp();
}

console.log('✅ core.js cargado - Variables globales y funciones esenciales inicializadas');