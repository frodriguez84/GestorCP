// ===============================================
// SCRIPT-CORE.JS - Variables globales + Inicialización
// ===============================================

// Variables globales
let testCases = [];
let currentEditingId = null;
let filteredCases = [];

// Variables para el cronómetro
let timerInterval = null;
let timerStartTime = null;
let activeTimerId = null;
let rowTimerInterval = null;
let rowTimerStartTime = null;
let rowTimerAccum = 0;

// Variables globales para nombres de variables
let inputVariableNames = JSON.parse(localStorage.getItem('inputVariableNames') || '[]');

// Variables globales (agregar)
let timerPaused = false;
let pausedTime = 0;

// Variables globales para selección múltiple
let selectedCases = new Set(); // IDs de casos seleccionados

// Variable global para almacenar información del requerimiento
let requirementInfo = {
    number: '',
    name: '',
    description: '',
    caso: '',
    titleCase: '',
    tester: '',
    startDate: ''
};

// Variable para el estado de undo
let undoAvailable = false;

// Variables globales para drag & drop
let dragState = {
    isDragging: false,
    draggedScenarioNumber: null,
    draggedScenarioBlock: [],
    draggedElement: null,
    dragOffset: { x: 0, y: 0 },
    ghostElement: null,
    dropZoneElement: null,
    originalOrder: [], // Para undo
    canDrag: true
};

// Variables para auto-scroll
let autoScrollState = {
    isActive: false,
    direction: null, // 'up' o 'down'
    speed: 0,
    interval: null,
    container: null,
    zones: {
        top: 50,    // Zona de auto-scroll superior (50px desde el borde)
        bottom: 50  // Zona de auto-scroll inferior (50px desde el borde)
    }
};

// ===============================================
// FUNCIONES DE PERSISTENCIA
// ===============================================

// Funciones de persistencia
window.saveToStorage = function () {
    const data = JSON.stringify(testCases, null, 2);
    localStorage.setItem('testCases', data);
}

window.loadFromStorage = function () {
    const data = localStorage.getItem('testCases');
    if (data) {
        try {
            testCases = JSON.parse(data);

            // Migrar datos antiguos
            testCases = testCases.map(testCase => {
                // Eliminar expectedResult si existe (campo eliminado)
                if ('expectedResult' in testCase) {
                    delete testCase.expectedResult;
                }

                // Convertir inputVariables de string a array
                if (testCase.inputVariables && typeof testCase.inputVariables === 'string') {
                    const variables = [];
                    if (testCase.inputVariables.trim()) {
                        const parts = testCase.inputVariables.split(/[\n,;]/).filter(p => p.trim());
                        parts.forEach((part, index) => {
                            const colonIndex = part.indexOf(':');
                            if (colonIndex > 0) {
                                variables.push({
                                    name: part.substring(0, colonIndex).trim(),
                                    value: part.substring(colonIndex + 1).trim()
                                });
                            } else {
                                variables.push({
                                    name: `Variable ${index + 1}`,
                                    value: part.trim()
                                });
                            }
                        });
                    }
                    testCase.inputVariables = variables;
                }

                // Asegurar que inputVariables sea siempre un array
                if (!Array.isArray(testCase.inputVariables)) {
                    testCase.inputVariables = [];
                }

                return testCase;
            });

            // Guardar datos migrados
            saveToStorage();

        } catch (e) {
            console.error('Error al cargar datos:', e);
            testCases = [];
        }
    }
}

// ===============================================
// INICIALIZACIÓN Y EVENT LISTENERS PRINCIPALES
// ===============================================

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Cargar datos al iniciar
    loadFromStorage();
    renderTestCases();
    updateStats();
    updateFilters();

    // Event listeners para botones
    document.getElementById('btnAddCase').addEventListener('click', openAddModal);
    document.getElementById('btnLoadCases').addEventListener('click', loadTestCases);
    document.getElementById('btnSaveCases').addEventListener('click', saveTestCases);
    document.getElementById('btnExportExcel').addEventListener('click', exportToExcel);
    document.getElementById('btnImportExcel').addEventListener('click', importFromExcel);
    document.getElementById('btnClearAll').addEventListener('click', clearAllData);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('btnCancelModal').addEventListener('click', closeModal);

    // Event listeners para el modal de evidencias
    document.getElementById('closeEvidenceModalBtn').addEventListener('click', function () {
        document.getElementById('evidenceViewModal').style.display = 'none';
    });

    // Funciones del cronómetro
    window.startTimer = function () {
        timerStartTime = Date.now();
        document.getElementById('btnStartTimer').style.display = 'none';
        document.getElementById('btnStopTimer').style.display = 'inline-block';

        timerInterval = setInterval(function () {
            const elapsed = Date.now() - timerStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            document.getElementById('timerDisplay').textContent =
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 100);
    };

    window.stopTimer = function () {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const elapsed = Date.now() - timerStartTime;
        const minutes = elapsed / 60000;
        document.getElementById('testTime').value = Math.round(minutes * 2) / 2; // Redondear a 0.5

        document.getElementById('btnStartTimer').style.display = 'inline-block';
        document.getElementById('btnStopTimer').style.display = 'none';
        document.getElementById('timerDisplay').textContent = '✓ Tiempo registrado';
    };

    // Event listeners para filtros
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('testerFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFromFilter').addEventListener('change', applyFilters);
    document.getElementById('dateToFilter').addEventListener('change', applyFilters);

    // Event listener para carga de evidencias
    document.getElementById('evidenceInput').addEventListener('change', handleEvidenceUpload);

    // Event listeners para edición masiva
    const closeBulkEditBtn = document.getElementById('closeBulkEditBtn');
    if (closeBulkEditBtn) {
        closeBulkEditBtn.addEventListener('click', closeBulkEditModal);
    }

    const btnCancelBulkEdit = document.getElementById('btnCancelBulkEdit');
    if (btnCancelBulkEdit) {
        btnCancelBulkEdit.addEventListener('click', closeBulkEditModal);
    }

    // Cerrar modal al hacer clic fuera
    const bulkEditModal = document.getElementById('bulkEditModal');
    if (bulkEditModal) {
        bulkEditModal.addEventListener('click', function (e) {
            if (e.target === bulkEditModal) {
                closeBulkEditModal();
            }
        });
    }

    // Auto-guardar cada 30 segundos
    setInterval(saveToStorage, 30000);
});

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('testCaseModal');
    const evidenceModal = document.getElementById('evidenceViewModal');
    if (event.target === modal) {
        closeModal();
    } else if (event.target === evidenceModal) {
        evidenceModal.style.display = 'none';
    }
};

// Atajos de teclado
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                openAddModal();
                break;
            case 's':
                e.preventDefault();
                saveTestCases();
                break;
            case 'o':
                e.preventDefault();
                loadTestCases();
                break;
        }
    }
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Event listener para Ctrl+Z (undo drag)
document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && undoAvailable) {
        event.preventDefault();
        undoLastDragMove();
    }
});

// ===============================================
// CONFIGURACIÓN DE TEMA (MODO OSCURO)
// ===============================================

// Referencias al switch y al label
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

// Cargar el tema guardado en localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
    themeLabel.textContent = 'Modo Oscuro';
}

// Alternar entre modo claro y oscuro
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('dark-mode');
        themeLabel.textContent = 'Modo Oscuro';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        themeLabel.textContent = 'Modo Claro';
        localStorage.setItem('theme', 'light');
    }
});

console.log('✅ Script-core.js cargado - Variables globales e inicialización');