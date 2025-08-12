// ===============================================
// UI.JS - Modales, UI, Drag Scroll y Misceláneos
// ===============================================

// ===============================================
// INFORMACIÓN DEL REQUERIMIENTO - SISTEMA COMPLETO
// ===============================================

// Cargar información del requerimiento desde localStorage
function loadRequirementInfo() {
    const saved = localStorage.getItem('requirementInfo');
    if (saved) {
        try {
            requirementInfo = JSON.parse(saved);
        } catch (e) {
            console.error('Error al cargar información del requerimiento:', e);
            requirementInfo = {
                number: '',
                name: '',
                description: '',
                caso: '',
                titleCase: '',
                tester: '',
                startDate: ''
            };
        }
    }
    updateRequirementDisplay();
}

// Guardar información del requerimiento en localStorage
function saveRequirementInfo() {
    localStorage.setItem('requirementInfo', JSON.stringify(requirementInfo));
    console.log('✅ Información del requerimiento guardada');
}

// Actualizar la visualización de la información del requerimiento
function updateRequirementDisplay() {
    const card = document.querySelector('.requirement-card');
    const title = document.getElementById('requirementDisplayTitle');
    const subtitle = document.getElementById('requirementDisplaySubtitle');

    // Verificar si hay información configurada
    const hasInfo = requirementInfo.number || requirementInfo.name;

    if (hasInfo) {
        // Mostrar información configurada
        card.classList.remove('empty-state');

        title.textContent = requirementInfo.name || 'Requerimiento';
        subtitle.textContent = requirementInfo.number || 'N° no especificado';

        // Actualizar todos los campos
        updateFieldDisplay('displayReqNumber', requirementInfo.number);
        updateFieldDisplay('displayReqName', requirementInfo.name);
        updateFieldDisplay('displayReqDescription', requirementInfo.description);
        updateFieldDisplay('displayReqCase', requirementInfo.caso);
        updateFieldDisplay('displayReqTitleCase', requirementInfo.titleCase);
        updateFieldDisplay('displayReqTester', requirementInfo.tester);

        // USAR LA FUNCIÓN CORREGIDA para la fecha
        updateFieldDisplay('displayReqStartDate', formatDisplayDate(requirementInfo.startDate));

    } else {
        // Mostrar estado vacío
        card.classList.add('empty-state');
        title.textContent = 'Información del Requerimiento';
        subtitle.textContent = 'Click en editar para configurar información del requerimiento';

        // Limpiar todos los campos
        updateFieldDisplay('displayReqNumber', '');
        updateFieldDisplay('displayReqName', '');
        updateFieldDisplay('displayReqDescription', '');
        updateFieldDisplay('displayReqCase', '');
        updateFieldDisplay('displayReqTitleCase', '');
        updateFieldDisplay('displayReqTester', '');
        updateFieldDisplay('displayReqStartDate', '');
    }
}

// Helper para actualizar campos individuales
function updateFieldDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (value && value.trim() !== '') {
            element.textContent = value;
            element.classList.remove('empty');
        } else {
            element.textContent = '-';
            element.classList.add('empty');
        }
    }
}

// Formatear fecha para visualización
function formatDisplayDate(dateString) {
    if (!dateString) return '';

    try {
        // 🔧 MÉTODO 1: Dividir la fecha y crear con componentes locales
        if (dateString.includes('-') && dateString.length === 10) {
            // Formato "YYYY-MM-DD" del input type="date"
            const [year, month, day] = dateString.split('-').map(Number);

            // Crear fecha local (el mes va de 0-11, por eso restamos 1)
            const date = new Date(year, month - 1, day);

            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        // 🔧 MÉTODO 2: Para otros formatos, usar interpretación local
        const date = new Date(dateString.replace(/-/g, '/'));

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

    } catch (e) {
        console.error('Error al formatear fecha:', e);
        return dateString; // Retornar original si hay error
    }
}

// Función para convertir fecha de input a Date object LOCAL
function parseLocalDate(dateString) {
    if (!dateString) return null;

    try {
        if (dateString.includes('-') && dateString.length === 10) {
            // Input format: "YYYY-MM-DD"
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day); // Local date
        }

        // Otros formatos - usar reemplazo de guiones
        return new Date(dateString.replace(/-/g, '/'));

    } catch (e) {
        console.error('Error parsing date:', e);
        return null;
    }
}

// Función para convertir Date object a formato input (YYYY-MM-DD)
function formatDateForInput(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Abrir modal de edición
window.openRequirementModal = function () {
    // Llenar formulario con datos actuales
    document.getElementById('reqNumber').value = requirementInfo.number || '';
    document.getElementById('reqName').value = requirementInfo.name || '';
    document.getElementById('reqDescription').value = requirementInfo.description || '';
    document.getElementById('reqCase').value = requirementInfo.caso || '';
    document.getElementById('reqTitleCase').value = requirementInfo.titleCase || '';
    document.getElementById('reqTester').value = requirementInfo.tester || '';
    document.getElementById('reqStartDate').value = requirementInfo.startDate || '';

    // Mostrar modal
    document.getElementById('requirementModal').style.display = 'block';

    // Focus en primer campo
    setTimeout(() => {
        document.getElementById('reqNumber').focus();
    }, 100);
}

// Cerrar modal de edición
window.closeRequirementModal = function () {
    document.getElementById('requirementModal').style.display = 'none';
}

// Limpiar toda la información del requerimiento
window.clearRequirementInfo = function () {
    if (confirm('⚠️ ¿Estás seguro de que deseas eliminar toda la información del requerimiento?\n\nEsta acción no se puede deshacer.')) {
        requirementInfo = {
            number: '',
            name: '',
            description: '',
            caso: '',
            titleCase: '',
            tester: '',
            startDate: ''
        };

        saveRequirementInfo();
        updateRequirementDisplay();
        closeRequirementModal();

        alert('✅ Información del requerimiento eliminada correctamente');
    }
}

// Auto-sugerir tester basado en casos existentes
function suggestTesterFromCases() {
    if (testCases && testCases.length > 0) {
        // Obtener el tester más frecuente
        const testerCounts = {};
        testCases.forEach(tc => {
            if (tc.tester && tc.tester.trim()) {
                testerCounts[tc.tester] = (testerCounts[tc.tester] || 0) + 1;
            }
        });

        const mostFrequentTester = Object.keys(testerCounts).reduce((a, b) =>
            testerCounts[a] > testerCounts[b] ? a : b, ''
        );

        if (mostFrequentTester && !requirementInfo.tester) {
            const testerInput = document.getElementById('reqTester');
            if (testerInput) {
                testerInput.placeholder = `Sugerido: ${mostFrequentTester}`;
            }
        }
    }
}

// Llamar sugerencia cuando se abre el modal
const originalOpenModal = window.openRequirementModal;
window.openRequirementModal = function () {
    originalOpenModal();
    suggestTesterFromCases();
}

// ===============================================
// DRAG SCROLL HORIZONTAL - SISTEMA COMPLETO
// ===============================================

// Variables para el drag scroll
let isDragging = false;
let startX = 0;
let scrollLeft = 0;
let tableContainer = null;

// Función para inicializar el drag scroll
function initializeDragScroll() {
    tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    // Limpiar eventos previos para evitar duplicados
    tableContainer.removeEventListener('contextmenu', preventContext);
    tableContainer.removeEventListener('mousedown', handleMouseDown);
    tableContainer.removeEventListener('mousemove', handleMouseMove);
    tableContainer.removeEventListener('mouseup', handleMouseUp);
    tableContainer.removeEventListener('mouseleave', handleMouseLeave);

    // Agregar eventos
    tableContainer.addEventListener('contextmenu', preventContext);
    tableContainer.addEventListener('mousedown', handleMouseDown);
    tableContainer.addEventListener('mousemove', handleMouseMove);
    tableContainer.addEventListener('mouseup', handleMouseUp);
    tableContainer.addEventListener('mouseleave', handleMouseLeave);
}

// Prevenir menú contextual durante drag
function preventContext(e) {
    e.preventDefault();  // ✅ Siempre bloqueado
    return false;
}

// Manejar mousedown (BOTÓN DERECHO)
function handleMouseDown(e) {
    // BOTÓN DERECHO = button 2
    if (e.button !== 2) return;

    e.preventDefault();
    isDragging = true;
    startX = e.pageX - tableContainer.offsetLeft;
    scrollLeft = tableContainer.scrollLeft;

    // Cambiar cursor y estilo
    tableContainer.style.cursor = 'grabbing';
    tableContainer.style.userSelect = 'none';
    tableContainer.classList.add('dragging');

    console.log('Drag iniciado'); // Debug
}

// Manejar mousemove
function handleMouseMove(e) {
    if (!isDragging) return;

    e.preventDefault();
    const x = e.pageX - tableContainer.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainer.scrollLeft = scrollLeft - walk;
}

// Manejar mouseup (CUALQUIER BOTÓN)
function handleMouseUp(e) {
    if (!isDragging) return;
    stopDragging();
}

// Manejar mouseleave
function handleMouseLeave() {
    if (isDragging) {
        stopDragging();
    }
}

// Función para detener el dragging
function stopDragging() {
    if (!isDragging) return;

    console.log('Drag terminado'); // Debug
    isDragging = false;

    // RESTAURAR cursor a FLECHA NORMAL
    tableContainer.style.cursor = 'default';
    tableContainer.style.userSelect = '';
    tableContainer.classList.remove('dragging');
}

// Función para reinicializar (simplificada)
function reinitializeDragScrollFunction() {
    setTimeout(() => {
        initializeDragScroll();
    }, 100);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initializeDragScroll, 500);
});

// Hacer la función global para poder llamarla desde renderTestCases
window.reinitializeDragScroll = reinitializeDragScrollFunction;

// ===============================================
// MANEJO DEL FORMULARIO PRINCIPAL DE CASOS
// ===============================================

// Event listener para el formulario principal de casos
document.addEventListener('DOMContentLoaded', function () {
    // Manejar envío del formulario
    const testCaseForm = document.getElementById('testCaseForm');
    if (testCaseForm) {
        testCaseForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Formulario enviado'); // Debug

            // Validaciones básicas
            const scenarioNumber = document.getElementById('scenarioNumber').value.trim();
            const cycleNumber = document.getElementById('cycleNumber').value.trim();
            const description = document.getElementById('description').value.trim();
            const tester = document.getElementById('tester').value.trim();

            if (!scenarioNumber) {
                alert('❌ El N° de Escenario es obligatorio');
                return;
            }

            if (!cycleNumber) {
                alert('❌ El N° de Ciclo es obligatorio');
                return;
            }

            if (!description) {
                alert('❌ La Descripción es obligatoria');
                return;
            }

            if (!tester) {
                alert('❌ El Nombre del Tester es obligatorio');
                return;
            }

            const inputVariables = [];

            inputVariableNames.forEach(varName => {
                const inputElement = document.querySelector(`#fixedVariablesContainer input[name="var_${varName}"]`);
                if (inputElement) {
                    inputVariables.push({
                        name: varName,
                        value: inputElement.value
                    });
                }
            });

            // ====== LÓGICA DE DUPLICACIÓN MEJORADA - COMPLETA ======
            if (window.originalScenarioForDuplication && currentEditingId && window.duplicatedCaseTemp) {
                const newScenarioNumber = parseInt(document.getElementById('scenarioNumber').value);
                const originalScenario = window.originalScenarioForDuplication;

                // Actualizar TODOS los datos del caso temporal con los del formulario
                window.duplicatedCaseTemp.scenarioNumber = document.getElementById('scenarioNumber').value;
                window.duplicatedCaseTemp.cycleNumber = document.getElementById('cycleNumber').value;
                window.duplicatedCaseTemp.description = document.getElementById('description').value;
                window.duplicatedCaseTemp.obtainedResult = document.getElementById('obtainedResult').value;
                window.duplicatedCaseTemp.status = document.getElementById('status').value;
                window.duplicatedCaseTemp.executionDate = document.getElementById('executionDate').value;
                window.duplicatedCaseTemp.observations = document.getElementById('observations').value;
                window.duplicatedCaseTemp.errorNumber = document.getElementById('errorNumber').value;
                window.duplicatedCaseTemp.tester = document.getElementById('tester').value;

                // Actualizar variables de entrada
                const inputVariables = [];
                inputVariableNames.forEach(varName => {
                    const inputElement = document.querySelector(`#fixedVariablesContainer input[name="var_${varName}"]`);
                    if (inputElement) {
                        inputVariables.push({
                            name: varName,
                            value: inputElement.value
                        });
                    }
                });
                window.duplicatedCaseTemp.inputVariables = inputVariables;

                // Actualizar evidencias
                const evidenceItems = document.querySelectorAll('#evidenceContainer .evidence-item');
                const evidence = [];
                evidenceItems.forEach(item => {
                    const img = item.querySelector('img');
                    const span = item.querySelector('span');
                    if (img && span) {
                        evidence.push({
                            name: span.textContent,
                            data: img.src
                        });
                    }
                });
                window.duplicatedCaseTemp.evidence = evidence;

                // Si cambió el número, renumerar escenarios posteriores
                if (newScenarioNumber !== originalScenario) {
                    renumberScenariosAfter(newScenarioNumber, originalScenario, window.duplicatedCaseTemp.id);
                }

                // Insertar en la posición correcta
                insertCaseInCorrectPosition(window.duplicatedCaseTemp);

                // Limpiar variables temporales
                window.originalScenarioForDuplication = null;
                window.duplicatedCaseTemp = null;

                // Salir temprano para evitar el procesamiento normal
                saveToStorage();
                renderTestCases();
                updateStats();
                updateFilters();
                closeModal();
                alert('✅ Escenario duplicado y reordenado correctamente');
                return;
            }
            // ====== FIN LÓGICA DE DUPLICACIÓN ======

            const formData = {
                id: currentEditingId || Date.now(),
                cycleNumber: cycleNumber,
                scenarioNumber: scenarioNumber,
                description: description,
                inputVariables: inputVariables,
                obtainedResult: document.getElementById('obtainedResult').value,
                status: document.getElementById('status').value,
                executionDate: document.getElementById('executionDate').value,
                observations: document.getElementById('observations').value,
                errorNumber: document.getElementById('errorNumber').value,
                tester: tester,
                testTime: 0,
                steps: [],
                evidence: []
            };

            console.log('Datos del formulario:', formData); // Debug

            // Recopilar evidencias
            const evidenceItems = document.querySelectorAll('#evidenceContainer .evidence-item');
            evidenceItems.forEach(item => {
                const img = item.querySelector('img');
                const span = item.querySelector('span');
                if (img && span) {
                    formData.evidence.push({
                        name: span.textContent,
                        data: img.src
                    });
                }
            });

            if (currentEditingId) {
                const index = testCases.findIndex(tc => tc.id === currentEditingId);
                if (index !== -1) {
                    testCases[index] = formData;
                }
            } else {
                testCases.push(formData);
            }

            saveToStorage();
            renderTestCases();
            updateStats();
            updateFilters();
            closeModal();

            // Mostrar confirmación
            alert('✅ Caso de prueba guardado exitosamente');
        });
    }
});

// ===============================================
// EVENT LISTENERS PARA INFORMACIÓN DEL REQUERIMIENTO
// ===============================================

document.addEventListener('DOMContentLoaded', function () {
    // Event listener para el formulario
    const requirementForm = document.getElementById('requirementForm');
    if (requirementForm) {
        requirementForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validaciones básicas
            const number = document.getElementById('reqNumber').value.trim();
            const name = document.getElementById('reqName').value.trim();

            if (!number) {
                alert('❌ El N° de Requerimiento es obligatorio');
                document.getElementById('reqNumber').focus();
                return;
            }

            if (!name) {
                alert('❌ El Nombre del Requerimiento es obligatorio');
                document.getElementById('reqName').focus();
                return;
            }

            // Guardar información
            requirementInfo = {
                number: number,
                name: name,
                description: document.getElementById('reqDescription').value.trim(),
                caso: document.getElementById('reqCase').value.trim(),
                titleCase: document.getElementById('reqTitleCase').value.trim(),
                tester: document.getElementById('reqTester').value.trim(),
                startDate: document.getElementById('reqStartDate').value
            };

            saveRequirementInfo();
            updateRequirementDisplay();
            closeRequirementModal();

            alert('✅ Información del requerimiento guardada correctamente');
        });
    }

    // Event listener para cerrar modal
    const closeBtn = document.getElementById('closeRequirementModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRequirementModal);
    }

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('requirementModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeRequirementModal();
            }
        });
    }

    // Cargar información al inicializar
    loadRequirementInfo();
});

// ===============================================
// FUNCIONES GLOBALES ADICIONALES
// ===============================================

// Exponer updateRequirementDisplay globalmente para usar en import/export
window.updateRequirementDisplay = updateRequirementDisplay;

console.log('✅ ui.js cargado - Modales, UI, Drag Scroll y funciones auxiliares');