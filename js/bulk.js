// ===============================================
// BULK.JS - Selección múltiple y edición masiva
// ===============================================

// ===============================================
// SELECCIÓN MÚLTIPLE - FUNCIONES PRINCIPALES
// ===============================================

// Función para alternar selección de todos los casos
window.toggleSelectAll = function () {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;

    if (isChecked) {
        // Seleccionar todos los casos visibles (filtrados)
        filteredCases.forEach(tc => selectedCases.add(tc.id));
    } else {
        // Deseleccionar todos
        selectedCases.clear();
    }

    updateBulkToolbar();
    renderTestCases(); // Re-renderizar para actualizar checkboxes
}

// Función para alternar selección de un caso individual
window.toggleCaseSelection = function (id) {
    if (selectedCases.has(id)) {
        selectedCases.delete(id);
    } else {
        selectedCases.add(id);
    }

    updateSelectAllCheckbox();
    updateBulkToolbar();
    updateRowSelection(id);
}

// Función para actualizar el estado del checkbox "Select All"
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) return;

    const visibleIds = filteredCases.map(tc => tc.id);
    const selectedVisibleCount = visibleIds.filter(id => selectedCases.has(id)).length;

    if (selectedVisibleCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedVisibleCount === visibleIds.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true; // Estado "parcialmente seleccionado"
    }
}

// Función para actualizar el estilo visual de una fila seleccionada
function updateRowSelection(id) {
    const row = document.querySelector(`tr[data-case-id="${id}"]`);
    if (!row) return;

    if (selectedCases.has(id)) {
        row.classList.add('row-selected');
    } else {
        row.classList.remove('row-selected');
    }
}

// ===============================================
// TOOLBAR DE ACCIONES MASIVAS
// ===============================================

// Función para mostrar/ocultar toolbar de acciones masivas
function updateBulkToolbar() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    const counter = document.getElementById('selectedCounter');

    if (!toolbar || !counter) return;

    const selectedCount = selectedCases.size;

    if (selectedCount > 0) {
        toolbar.style.display = 'flex';
        counter.textContent = `${selectedCount} caso${selectedCount > 1 ? 's' : ''} seleccionado${selectedCount > 1 ? 's' : ''}`;

        // 🔧 MEJORAR: Mostrar/ocultar botón de editar según cantidad
        const editButton = toolbar.querySelector('button[onclick="openBulkEditModal()"]');
        if (editButton) {
            if (selectedCount >= 2) {
                editButton.style.display = 'inline-flex';
                editButton.title = `Editar campos comunes de ${selectedCount} casos seleccionados`;
            } else {
                editButton.style.display = 'none'; // Ocultar para 1 solo caso
            }
        }
    } else {
        toolbar.style.display = 'none';
    }
}

// Función para deseleccionar todos los casos
window.clearSelection = function () {
    selectedCases.clear();
    updateSelectAllCheckbox();
    updateBulkToolbar();
    renderTestCases();
}

// ===============================================
// ELIMINACIÓN MASIVA
// ===============================================

// Función para borrar casos seleccionados - CON LÓGICA MEJORADA
window.deleteBulkCases = function () {
    const selectedCount = selectedCases.size;
    if (selectedCount === 0) return;

    // Obtener información de casos a eliminar para mostrar detalle
    const casesToDelete = Array.from(selectedCases).map(id => testCases.find(tc => tc.id === id)).filter(tc => tc);

    // Agrupar por ciclo para mostrar info detallada
    const deletionSummary = {};
    casesToDelete.forEach(tc => {
        const cycle = tc.cycleNumber || '1';
        if (!deletionSummary[cycle]) deletionSummary[cycle] = [];
        deletionSummary[cycle].push(tc.scenarioNumber);
    });

    // Crear mensaje de confirmación detallado
    let summaryText = '';
    Object.keys(deletionSummary).forEach(cycle => {
        const scenarios = deletionSummary[cycle].sort((a, b) => parseInt(a) - parseInt(b));
        summaryText += `\nCiclo ${cycle}: Escenarios ${scenarios.join(', ')}`;
    });

    const message = `⚠️ ¿Estás seguro de que deseas eliminar ${selectedCount} escenarios${selectedCount > 1 ? 's' : ''}?${summaryText}\n\n📌 IMPORTANTE: Solo se renumerarán los escenarios del Ciclo 1.\nLos ciclos 2+ mantendrán sus números originales.\n\nEsta acción no se puede deshacer.`;

    if (!confirm(message)) return;

    // Eliminar casos seleccionados
    testCases = testCases.filter(tc => !selectedCases.has(tc.id));

    // Aplicar renumeración inteligente
    smartRenumberAfterDeletion();

    // Limpiar selección
    selectedCases.clear();

    // Actualizar interfaz
    saveToStorage();
    renderTestCases();
    updateStats();
    updateFilters();
    updateBulkToolbar();

    alert(`✅ ${selectedCount} escenario${selectedCount > 1 ? 's' : ''} eliminado${selectedCount > 1 ? 's' : ''} correctamente\n\n🔢 Ciclo 1 renumerado secuencialmente\n📌 Ciclos 2+ mantuvieron sus números originales`);
}

// ===============================================
// OCULTACIÓN MASIVA
// ===============================================

// Función para ocultar casos seleccionados
window.hideBulkCases = function () {
    const selectedCount = selectedCases.size;
    if (selectedCount === 0) return;

    const message = `👁️‍🗨️ ¿Deseas ocultar ${selectedCount} escenario${selectedCount > 1 ? 's' : ''} seleccionado${selectedCount > 1 ? 's' : ''}?\n\nLos escenarios ocultos no aparecerán en la vista principal pero se mantendrán guardados.\nPodrás mostrarlos nuevamente desde los filtros.`;

    if (!confirm(message)) return;

    // Marcar casos seleccionados como ocultos
    testCases.forEach(tc => {
        if (selectedCases.has(tc.id)) {
            tc.hidden = true; // NUEVA propiedad - no rompe nada existente
        }
    });

    // Limpiar selección
    selectedCases.clear();

    // Actualizar interfaz (usar funciones existentes)
    saveToStorage();
    applyFilters(); // Usar función existente que ya maneja filteredCases
    updateStats(); // Función existente
    updateBulkToolbar(); // Función existente

    alert(`✅ ${selectedCount} escenario${selectedCount > 1 ? 's' : ''} ocultado${selectedCount > 1 ? 's' : ''} correctamente\n\n💡 Usa el filtro "Mostrar ocultos" para verlos nuevamente`);
}

// ===============================================
// MODAL DE EDICIÓN MASIVA
// ===============================================

// Función para abrir el modal de edición masiva
window.openBulkEditModal = function () {
    const selectedCount = selectedCases.size;

    if (selectedCount === 0) {
        alert('❌ No hay escenarios seleccionados para editar');
        return;
    }

    if (selectedCount < 2) {
        alert('💡 Para editar un solo escenario, usa el botón "Editar" individual.\nEsta función es para editar múltiples escenarios a la vez.');
        return;
    }

    // Actualizar título del modal
    document.getElementById('bulkEditCount').textContent = selectedCount;

    // Limpiar formulario
    document.getElementById('bulkEditForm').reset();

    // Renderizar variables dinámicas
    renderBulkVariablesInputs();

    // Mostrar modal
    document.getElementById('bulkEditModal').style.display = 'block';

    // Focus en primer campo
    setTimeout(() => {
        document.getElementById('bulkDescription').focus();
    }, 100);

    console.log(`📝 Modal de edición masiva abierto para ${selectedCount} casos`);
};

// Función para cerrar el modal de edición masiva
window.closeBulkEditModal = function () {
    document.getElementById('bulkEditModal').style.display = 'none';
};

// ===============================================
// RENDERIZADO DE VARIABLES EN EDICIÓN MASIVA
// ===============================================

// Función para renderizar inputs de variables en edición masiva
function renderBulkVariablesInputs() {
    const container = document.getElementById('bulkVariablesContainer');

    if (inputVariableNames.length === 0) {
        container.innerHTML = '<p class="no-variables-message">No hay variables configuradas</p>';
        return;
    }

    container.innerHTML = inputVariableNames.map(varName => `
        <div class="step-item">
            <label style="min-width:120px;">${varName}:</label>
            <input type="text" name="bulk_var_${varName}" placeholder="Dejar vacío para no cambiar" style="flex:1;">
        </div>
    `).join('');
}

// ===============================================
// APLICACIÓN DE EDICIÓN MASIVA
// ===============================================

// Función principal para aplicar edición masiva
window.applyBulkEdit = function (formData) {
    const selectedArray = Array.from(selectedCases);
    let updatedCount = 0;
    const changes = {};
    const updatedCaseIds = [];

    // Determinar qué campos cambiar (solo los no vacíos)
    if (formData.description.trim()) {
        changes.description = formData.description.trim();
    }

    if (formData.obtainedResult.trim()) {
        changes.obtainedResult = formData.obtainedResult.trim();
    }

    if (formData.status) {
        changes.status = formData.status;

        // Auto-asignar fecha si el status es OK o NO y no hay fecha
        if (formData.status === 'OK' || formData.status === 'NO') {
            if (!formData.executionDate) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                changes.executionDate = `${yyyy}-${mm}-${dd}`;
            }
        }
    }

    if (formData.executionDate) {
        changes.executionDate = formData.executionDate;
    }

    if (formData.observations.trim()) {
        changes.observations = formData.observations.trim();
    }

    if (formData.errorNumber.trim()) {
        changes.errorNumber = formData.errorNumber.trim();
    }

    if (formData.tester.trim()) {
        changes.tester = formData.tester.trim();
    }

    // Variables de entrada
    const variableChanges = {};
    inputVariableNames.forEach(varName => {
        const value = formData.variables[varName];
        if (value && value.trim()) {
            variableChanges[varName] = value.trim();
        }
    });

    // Aplicar cambios a cada caso seleccionado
    selectedArray.forEach(caseId => {
        const testCase = testCases.find(tc => tc.id === caseId);
        if (!testCase) return;

        let hasChanges = false;

        // Aplicar cambios de campos simples
        Object.keys(changes).forEach(field => {
            if (testCase[field] !== changes[field]) {
                testCase[field] = changes[field];
                hasChanges = true;
            }
        });

        // Aplicar cambios de variables
        if (Object.keys(variableChanges).length > 0) {
            if (!testCase.inputVariables) {
                testCase.inputVariables = [];
            }

            Object.keys(variableChanges).forEach(varName => {
                const existingVar = testCase.inputVariables.find(v => v.name === varName);
                if (existingVar) {
                    if (existingVar.value !== variableChanges[varName]) {
                        existingVar.value = variableChanges[varName];
                        hasChanges = true;
                    }
                } else {
                    testCase.inputVariables.push({
                        name: varName,
                        value: variableChanges[varName]
                    });
                    hasChanges = true;
                }
            });
        }

        if (hasChanges) {
            updatedCount++;
            updatedCaseIds.push(caseId);
        }
    });

    // Guardar cambios y actualizar interfaz
    saveToStorage();
    renderTestCases();
    updateStats();
    closeBulkEditModal();

    // HIGHLIGHT: Resaltar casos actualizados
    if (updatedCaseIds.length > 0) {
        setTimeout(() => {
            highlightUpdatedCases(updatedCaseIds);
        }, 100);
    }

    // Crear resumen de cambios
    const changesSummary = [];
    if (changes.description) changesSummary.push('✏️ Descripción');
    if (changes.obtainedResult) changesSummary.push('🎯 Resultado Esperado');
    if (changes.status) changesSummary.push(`📊 Estado → ${changes.status}`);
    if (changes.executionDate) changesSummary.push('📅 Fecha de Ejecución');
    if (changes.observations) changesSummary.push('📝 Observaciones');
    if (changes.errorNumber) changesSummary.push('🐛 N° Error/Bug');
    if (changes.tester) changesSummary.push(`👤 Tester → ${changes.tester}`);
    if (Object.keys(variableChanges).length > 0) {
        changesSummary.push(`🔧 Variables: ${Object.keys(variableChanges).join(', ')}`);
    }

    // Mostrar resultado
    if (updatedCount > 0) {
        alert(`✅ Edición masiva completada exitosamente\n\n` +
            `📊 ${updatedCount} de ${selectedArray.length} escenarios actualizados\n\n` +
            `🔧 Campos modificados:\n${changesSummary.join('\n')}\n\n` +
            `💡 Los casos actualizados están resaltados temporalmente.`);
    } else {
        alert('ℹ️ No se realizaron cambios.\nTodos los campos estaban vacíos o los valores eran idénticos.');
    }

    console.log(`📝 Edición masiva completada: ${updatedCount}/${selectedArray.length} escenarios actualizados`);
};

// ===============================================
// FUNCIÓN ADICIONAL: Marcar casos actualizados visualmente
// ===============================================

function highlightUpdatedCases(caseIds) {
    // Agregar clase de animación a casos actualizados
    caseIds.forEach(caseId => {
        const row = document.querySelector(`tr[data-case-id="${caseId}"]`);
        if (row) {
            row.classList.add('case-recently-updated');

            // Remover la clase después de la animación
            setTimeout(() => {
                row.classList.remove('case-recently-updated');
            }, 2000);
        }
    });
}

// ===============================================
// EVENT LISTENER PARA FORMULARIO DE EDICIÓN MASIVA
// ===============================================

// Manejar envío del formulario de edición masiva
document.addEventListener('DOMContentLoaded', function () {
    const bulkEditForm = document.getElementById('bulkEditForm');
    if (bulkEditForm) {
        bulkEditForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const selectedCount = selectedCases.size;
            if (selectedCount === 0) {
                alert('❌ No hay casos seleccionados');
                closeBulkEditModal();
                return;
            }

            // Recopilar datos del formulario
            const formData = {
                description: document.getElementById('bulkDescription').value,
                obtainedResult: document.getElementById('bulkExpectedResult').value,
                status: document.getElementById('bulkStatus').value,
                executionDate: document.getElementById('bulkExecutionDate').value,
                observations: document.getElementById('bulkObservations').value,
                errorNumber: document.getElementById('bulkErrorNumber').value,
                tester: document.getElementById('bulkTester').value,
                variables: {}
            };

            // Recopilar variables
            inputVariableNames.forEach(varName => {
                const input = document.querySelector(`input[name="bulk_var_${varName}"]`);
                if (input) {
                    formData.variables[varName] = input.value;
                }
            });

            // Verificar que al menos un campo tenga contenido
            const hasAnyContent =
                formData.description.trim() ||
                formData.obtainedResult.trim() ||
                formData.status ||
                formData.executionDate ||
                formData.observations.trim() ||
                formData.errorNumber.trim() ||
                formData.tester.trim() ||
                Object.values(formData.variables).some(v => v && v.trim());

            if (!hasAnyContent) {
                alert('⚠️ Debes completar al menos un campo para aplicar cambios.\n\nLos campos vacíos no modificarán los casos existentes.');
                return;
            }

            // Confirmar acción
            const confirmMessage = `📝 ¿Confirmas aplicar los cambios a ${selectedCount} escenarios seleccionados?\n\n` +
                `⚠️ Esta acción no se puede deshacer.\n` +
                `💡 Solo se modificarán los campos que completaste.`;

            if (confirm(confirmMessage)) {
                applyBulkEdit(formData);
            }
        });
    }
});

// Exponer función updateBulkToolbar globalmente
window.updateBulkToolbar = updateBulkToolbar;

console.log('✅ bulk.js cargado - Selección múltiple y edición masiva');