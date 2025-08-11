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

// Mostrar modal de configuración
document.getElementById('btnConfigVars').onclick = function () {
    renderVarsList();
    document.getElementById('configVarsModal').style.display = 'block';
};
document.getElementById('closeConfigVarsBtn').onclick = function () {
    document.getElementById('configVarsModal').style.display = 'none';
};
document.getElementById('btnCancelConfigVars').onclick = function () {
    document.getElementById('configVarsModal').style.display = 'none';
};

// Renderizar lista de variables en el modal
function renderVarsList() {
    const varsList = document.getElementById('varsList');

    // Guardar los valores actuales de los inputs
    const currentValues = Array.from(varsList.querySelectorAll('input')).map(input => input.value);

    varsList.innerHTML = '';
    inputVariableNames.forEach((name, idx) => {
        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerHTML = `
            <input type="text" value="${name || currentValues[idx] || ''}" style="flex:1;" placeholder="Nombre de variable">
            <button type="button" class="step-remove" onclick="removeVarName(${idx})">✕</button>
        `;
        varsList.appendChild(div);
    });
}
window.removeVarName = function (idx) {
    inputVariableNames.splice(idx, 1);
    renderVarsList();
};

// Agregar variable
document.getElementById('btnAddVarName').onclick = function () {
    inputVariableNames.push('');
    renderVarsList();
};

// Guardar configuración
document.getElementById('configVarsForm').onsubmit = function (e) {
    e.preventDefault();
    // Tomar valores de inputs
    const inputs = document.querySelectorAll('#varsList input');
    inputVariableNames = Array.from(inputs).map(inp => inp.value.trim()).filter(v => v);
    localStorage.setItem('inputVariableNames', JSON.stringify(inputVariableNames));
    // Actualizar estructura de casos existentes
    testCases.forEach(tc => {
        tc.inputVariables = inputVariableNames.map(name => {
            // Si ya existe, mantener valor, si no, dejar vacío
            const found = (tc.inputVariables || []).find(v => v.name === name);
            return { name, value: found ? found.value : '' };
        });
    });

    saveToStorage();
    renderTestCases();
    document.getElementById('configVarsModal').style.display = 'none';
    alert('✅ Configuración de variables actualizada');
};

// Fucion para ampliar las evidencias
window.zoomEvidenceImage = function (src, alt) {
    const modal = document.getElementById('imageZoomModal');
    const img = document.getElementById('zoomedImage');
    img.src = src;
    img.alt = alt || '';
    modal.style.display = 'block';
};

document.getElementById('closeImageZoomBtn').onclick = function () {
    document.getElementById('imageZoomModal').style.display = 'none';
};

// Funcion para actualizar la fecha al cambiar el resultado obtenido
window.updateStatusAndDate = function (id, value) {
    const testCase = testCases.find(tc => tc.id === id);
    if (testCase) {
        testCase.status = value;

        // Si no hay fecha y el status es OK o NO, poner la fecha de hoy
        if (!testCase.executionDate && (value === 'OK' || value === 'NO')) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            testCase.executionDate = `${dd}-${mm}-${yyyy}`;
        }

        // Actualización inmediata de estadísticas
        saveToStorage();

        // Actualizar estadísticas inmediatamente (función existente)
        if (typeof updateStatsWithHidden === 'function') {
            updateStatsWithHidden(); // Si tienes casos ocultos
        } else {
            updateStats(); // Función básica
        }

        // Actualizar filtros si es necesario (para mantener consistency)
        applyFilters();

        console.log(`✅ Estado actualizado: Escenario ${testCase.scenarioNumber} → ${value}`);
    }
}

// Variables globales (agregar)
let timerPaused = false;
let pausedTime = 0;

// Funcion iniciar cronometro en filas
function toggleRowTimer(id) {
    if (activeTimerId === id) {
        // Si es el mismo cronómetro → DETENER (no pausar)
        stopRowTimer();
        return;
    }

    if (activeTimerId !== null) {
        // Si hay otro activo → Confirmar cambio
        if (!confirm(`⏱️ Ya tienes un cronómetro activo en el Escenario ${getScenarioNumber(activeTimerId)} - Ciclo ${getCicleNumber(activeTimerId)}.
        \n¿Detenerlo y cambiar al Escenario ${getScenarioNumber(id)} - Ciclo ${getCicleNumber(activeTimerId)}?`)) {
            return;
        }
        stopRowTimer();
    }

    // Iniciar NUEVO cronómetro (siempre desde cero)
    startNewTimer(id);
}

function startNewTimer(id) {
    activeTimerId = id;
    timerPaused = false;
    pausedTime = 0;

    const testCase = testCases.find(tc => tc.id === id);
    rowTimerAccum = parseFloat(testCase.testTime) || 0;
    rowTimerStartTime = Date.now();

    showTimerBar(testCase);
    updateAllTimerButtons(); // ← NUEVA función

    rowTimerInterval = setInterval(updateTimerDisplay, 500);
}

function showTimerBar(testCase) {
    const timerBar = document.getElementById('timerBar');
    const scenarioEl = document.getElementById('timerScenario');
    const descriptionEl = document.getElementById('timerDescription');
    const pauseBtn = document.getElementById('pauseBtn');

    scenarioEl.textContent = `Escenario ${testCase.scenarioNumber}`;
    descriptionEl.textContent = testCase.description.substring(0, 80) + (testCase.description.length > 80 ? '...' : '');

    // RESETEAR botón de pausa cuando se muestra
    pauseBtn.innerHTML = '⏸️ Pausar';
    pauseBtn.className = 'btn btn-warning btn-small';

    timerBar.style.display = 'block';
}

function updateTimerDisplay() {
    if (!activeTimerId || timerPaused) return;

    const elapsed = (Date.now() - rowTimerStartTime) / 60000;
    const total = rowTimerAccum + elapsed;
    const minutes = Math.floor(total);
    const seconds = Math.floor((total - minutes) * 60);

    const display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function pauseTimer() {
    if (!activeTimerId) return;

    const pauseBtn = document.getElementById('pauseBtn');

    if (timerPaused) {
        // Reanudar
        timerPaused = false;
        rowTimerStartTime = Date.now() - pausedTime;
        pauseBtn.innerHTML = '⏸️ Pausar';
        pauseBtn.className = 'btn btn-warning btn-small';
    } else {
        // Pausar
        timerPaused = true;
        pausedTime = Date.now() - rowTimerStartTime;
        pauseBtn.innerHTML = '▶️ Reanudar';
        pauseBtn.className = 'btn btn-success btn-small';
    }
}

// Funcion detener cronometro en filas
function stopRowTimer() {
    if (activeTimerId === null) return;

    clearInterval(rowTimerInterval);

    // Guardar tiempo final
    const testCase = testCases.find(tc => tc.id === activeTimerId);
    if (testCase) {
        const elapsed = timerPaused ? pausedTime / 60000 : (Date.now() - rowTimerStartTime) / 60000;
        let total = (parseFloat(testCase.testTime) || 0) + elapsed;
        testCase.testTime = Math.trunc(total);
    }

    // RESET COMPLETO
    const oldTimerId = activeTimerId;
    activeTimerId = null;
    timerPaused = false;
    pausedTime = 0;

    // Ocultar barra y actualizar botones
    document.getElementById('timerBar').style.display = 'none';
    updateAllTimerButtons(); // ← NUEVA función

    saveToStorage();
    renderTestCases();
}

function getScenarioNumber(id) {
    const testCase = testCases.find(tc => tc.id === id);
    return testCase ? testCase.scenarioNumber : '?';
}

function getCicleNumber(id) {
    const testCase = testCases.find(tc => tc.id === id);
    return testCase ? testCase.cycleNumber : '?';
}

function updateAllTimerButtons() {
    // Actualizar todos los botones de cronómetro en la tabla
    testCases.forEach(tc => {
        const btn = document.getElementById(`timerBtn-${tc.id}`);
        if (btn) {
            if (activeTimerId === tc.id) {
                btn.textContent = '⏹️';
                btn.title = 'Detener cronómetro';
            } else {
                btn.textContent = '⏱️';
                btn.title = 'Iniciar cronómetro';
            }
        }
    });
}

// Funcion para actualizar tiempo manualmente
window.updateManualTime = function (id, value) {
    const testCase = testCases.find(tc => tc.id === id);
    if (testCase) {
        testCase.testTime = Math.max(0, Math.trunc(Number(value)) || 0);

        // ACTUALIZACIÓN INMEDIATA
        saveToStorage();

        // No necesita updateStats porque el tiempo no afecta las estadísticas principales
        // Pero sí necesita re-renderizar para mantener consistency
        renderTestCases();

        console.log(`⏱️ Tiempo actualizado: Escenario ${testCase.scenarioNumber} → ${testCase.testTime} min`);
    }
}

window.toggleRowTimer = toggleRowTimer;
window.stopRowTimer = stopRowTimer;

function renderFixedVariablesInputs(values = {}) {
    const container = document.getElementById('fixedVariablesContainer');
    container.innerHTML = inputVariableNames.map(varName => `
        <div class="step-item">
            <label style="min-width:100px;">${varName}:</label>
            <input type="text" name="var_${varName}" value="${values[varName] || ''}" style="flex:1;">
        </div>
    `).join('');
}

// Funciones principales - Las adjuntamos al objeto window para hacerlas globales
window.openAddModal = function () {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Nuevo Caso de Prueba';
    document.getElementById('testCaseForm').reset();

    document.getElementById('fixedVariablesContainer').innerHTML = '';
    document.getElementById('evidenceContainer').innerHTML = '';

    renderFixedVariablesInputs();

    // Sugerir Ciclo = 1
    document.getElementById('cycleNumber').value = '1';

    // Sugerir N° Escenario = último + 1
    let lastScenario = 0;
    if (testCases.length > 0) {
        // Buscar el mayor número de escenario existente
        lastScenario = Math.max(...testCases.map(tc => parseInt(tc.scenarioNumber) || 0));
    }
    document.getElementById('scenarioNumber').value = (lastScenario + 1).toString();

    // Resetear cronómetro
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }


    document.getElementById('testCaseModal').style.display = 'block';
}

window.openEditModal = function (id) {
    currentEditingId = id;
    const testCase = testCases.find(tc => tc.id === id);
    if (!testCase) return;

    document.getElementById('modalTitle').textContent = 'Editar Caso de Prueba';

    // Llenar formulario
    document.getElementById('scenarioNumber').value = testCase.scenarioNumber || '';
    document.getElementById('cycleNumber').value = testCase.cycleNumber || '';
    document.getElementById('description').value = testCase.description || '';
    document.getElementById('obtainedResult').value = testCase.obtainedResult || '';
    document.getElementById('status').value = testCase.status || '';
    document.getElementById('executionDate').value = testCase.executionDate || '';
    document.getElementById('observations').value = testCase.observations || '';
    document.getElementById('errorNumber').value = testCase.errorNumber || '';
    document.getElementById('tester').value = testCase.tester || '';


    // Resetear cronómetro
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    const values = {};
    if (testCase.inputVariables) {
        testCase.inputVariables.forEach(v => values[v.name] = v.value);
    }
    renderFixedVariablesInputs(values);



    // Cargar evidencias
    document.getElementById('evidenceContainer').innerHTML = '';
    if (testCase.evidence) {
        testCase.evidence.forEach(evidence => {
            addEvidenceToContainer(evidence.name, evidence.data);
        });
    }


    document.getElementById('testCaseModal').style.display = 'block';
}

window.closeModal = function () {
    document.getElementById('testCaseModal').style.display = 'none';
    // Detener cronómetro si está activo
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}



window.handleEvidenceUpload = function () {
    const input = document.getElementById('evidenceInput');
    const files = Array.from(input.files);

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                addEvidenceToContainer(file.name, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    input.value = '';  // Limpiar input
}

window.addEvidenceToContainer = function (name, dataUrl) {
    const container = document.getElementById('evidenceContainer');
    const evidenceDiv = document.createElement('div');
    evidenceDiv.className = 'evidence-item';

    evidenceDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${dataUrl}" class="evidence-preview" alt="${name}">
                    <span>${name}</span>
                </div>
                <button type="button" class="btn-danger btn-small" onclick="this.parentElement.remove()">🗑️</button>
            `;

    container.appendChild(evidenceDiv);
}

// ==================================
// FUNCIONALIDAD DUPLICAR CASOS - VERSIÓN MEJORADA
// ==================================

// Función auxiliar para insertar caso en la posición correcta según numeración
function insertCaseInCorrectPosition(newCase) {
    // Encontrar la posición donde insertar basándose en el número de escenario
    const newScenarioNumber = parseInt(newCase.scenarioNumber);
    let insertIndex = testCases.length; // Por defecto al final

    for (let i = 0; i < testCases.length; i++) {
        const currentScenarioNumber = parseInt(testCases[i].scenarioNumber);
        if (currentScenarioNumber > newScenarioNumber) {
            insertIndex = i;
            break;
        }
    }

    // Insertar en la posición correcta
    testCases.splice(insertIndex, 0, newCase);
}

// Función auxiliar para renumerar escenarios posteriores - MEJORADA
function renumberScenariosAfter(newScenarioNumber, originalScenarioNumber, excludeId = null) {
    // Solo renumerar si el nuevo número es diferente al original
    if (newScenarioNumber === originalScenarioNumber) return;

    // Obtener todos los escenarios que necesitan renumeración
    const scenariosToRenumber = testCases.filter(tc => {
        const tcScenario = parseInt(tc.scenarioNumber);
        // Excluir el caso que estamos insertando para evitar conflictos
        if (excludeId && tc.id === excludeId) return false;
        return tcScenario >= newScenarioNumber;
    });

    // Ordenar por número de escenario (descendente para evitar conflictos)
    scenariosToRenumber.sort((a, b) => parseInt(b.scenarioNumber) - parseInt(a.scenarioNumber));

    // Renumerar cada escenario
    scenariosToRenumber.forEach(tc => {
        const currentNumber = parseInt(tc.scenarioNumber);
        tc.scenarioNumber = (currentNumber + 1).toString();
    });
}

// Función para detectar si un escenario es el último
function isLastScenario(scenarioNumber) {
    const allNumbers = testCases.map(tc => parseInt(tc.scenarioNumber) || 0);
    const maxNumber = Math.max(...allNumbers);
    return parseInt(scenarioNumber) === maxNumber;
}

// 1. FUNCIÓN PRINCIPAL - duplicateTestCase MEJORADA
window.duplicateTestCase = function (id) {
    const originalCase = testCases.find(tc => tc.id === id);
    if (!originalCase) {
        alert('❌ No se pudo encontrar el caso a duplicar');
        return;
    }

    // Crear una copia profunda del caso original
    const duplicatedCase = JSON.parse(JSON.stringify(originalCase));

    // Asignar nuevo ID único
    duplicatedCase.id = Date.now();

    // Resetear algunos campos para que el usuario los configure
    duplicatedCase.status = ''; // Resetear estado a Pendiente
    duplicatedCase.executionDate = ''; // Limpiar fecha
    duplicatedCase.testTime = 0; // Resetear tiempo
    duplicatedCase.observations = ''; // Limpiar observaciones
    duplicatedCase.errorNumber = ''; // Limpiar número de error

    // LÓGICA MEJORADA: Detectar si es el último escenario
    const originalScenarioNumber = parseInt(originalCase.scenarioNumber) || 0;
    const isLast = isLastScenario(originalCase.scenarioNumber);

    if (isLast) {
        // CASO 1: Es el último escenario → Crear siguiente + Ciclo 1
        duplicatedCase.scenarioNumber = (originalScenarioNumber + 1).toString();
        duplicatedCase.cycleNumber = '1';

        // Agregar al final (ya es la posición correcta)
        testCases.push(duplicatedCase);
        saveToStorage();
        renderTestCases();
        updateStats();
        updateFilters();

        alert(`✅ Escenario ${duplicatedCase.scenarioNumber} (Ciclo 1) creado automáticamente`);
        return;
    }

    // CASO 2: NO es el último → Abrir modal para editar
    // Configurar el modal como edición con los datos duplicados
    currentEditingId = duplicatedCase.id;
    // Guardar datos originales para comparación posterior
    window.originalScenarioForDuplication = originalScenarioNumber;
    window.duplicatedCaseTemp = duplicatedCase; // Guardar temporalmente sin agregar a la lista

    document.getElementById('modalTitle').textContent = '📋 Duplicar Caso de Prueba';

    // Llenar el formulario con los datos duplicados
    document.getElementById('cycleNumber').value = duplicatedCase.cycleNumber || '';
    document.getElementById('scenarioNumber').value = duplicatedCase.scenarioNumber || '';
    document.getElementById('description').value = duplicatedCase.description || '';
    document.getElementById('obtainedResult').value = duplicatedCase.obtainedResult || '';
    document.getElementById('status').value = duplicatedCase.status || '';
    document.getElementById('executionDate').value = duplicatedCase.executionDate || '';
    document.getElementById('observations').value = duplicatedCase.observations || '';
    document.getElementById('errorNumber').value = duplicatedCase.errorNumber || '';
    document.getElementById('tester').value = duplicatedCase.tester || '';

    // Cargar variables de entrada
    const values = {};
    if (duplicatedCase.inputVariables) {
        duplicatedCase.inputVariables.forEach(v => values[v.name] = v.value);
    }
    renderFixedVariablesInputs(values);

    // Cargar evidencias duplicadas
    document.getElementById('evidenceContainer').innerHTML = '';
    if (duplicatedCase.evidence && duplicatedCase.evidence.length > 0) {
        duplicatedCase.evidence.forEach(evidence => {
            addEvidenceToContainer(evidence.name, evidence.data);
        });
    }

    // NO agregar a testCases aún - solo guardar temporalmente

    // Abrir el modal
    document.getElementById('testCaseModal').style.display = 'block';

    // Enfocar el campo de número de escenario para fácil edición
    setTimeout(() => {
        document.getElementById('scenarioNumber').focus();
        document.getElementById('scenarioNumber').select();
    }, 100);
}


window.deleteTestCase = function (id) {
    if (confirm('¿Estás seguro de que deseas eliminar este escenario de prueba?')) {
        const deletedCase = testCases.find(tc => tc.id === id);
        if (!deletedCase) return;

        // Eliminar el caso
        testCases = testCases.filter(tc => tc.id !== id);

        // Aplicar renumeración inteligente
        smartRenumberAfterDeletion();

        // Guardar cambios y actualizar la tabla
        saveToStorage();
        renderTestCases();
        updateStats();
        updateFilters();

        const cycle = deletedCase.cycleNumber || '1';
        if (cycle === '1') {
            alert('✅ Escenario eliminado y Ciclo 1 renumerado correctamente');
        } else {
            alert(`✅ Escenario eliminado (Ciclo ${cycle} mantiene numeración original)`);
        }
    }
};

window.viewEvidence = function (id) {
    const testCase = testCases.find(tc => tc.id === id);
    if (!testCase || !testCase.evidence || testCase.evidence.length === 0) {
        alert('Este escenario no tiene evidencias adjuntas');
        return;
    }

    const container = document.getElementById('evidenceViewContainer');
    container.innerHTML = '';

    testCase.evidence.forEach((evidence, index) => {
        const imgDiv = document.createElement('div');
        imgDiv.style.marginBottom = '20px';
        imgDiv.innerHTML = `
                    <h3 style="margin-bottom: 10px;">Evidencia ${index + 1}: ${evidence.name}</h3>
                    <img src="${evidence.data}" 
                        style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px; cursor: zoom-in;" 
                        alt="${evidence.name}"
                        onclick="zoomEvidenceImage('${evidence.data.replace(/'/g, "\\'")}', '${evidence.name.replace(/'/g, "\\'")}')">
                `;
        container.appendChild(imgDiv);
    });

    document.getElementById('evidenceViewModal').style.display = 'block';
}

window.renderTestCases = function () {
    const tbody = document.getElementById('testCasesBody');
    const emptyState = document.getElementById('emptyState');

    // --- ACTUALIZAR THEAD DINÁMICAMENTE ---
    const theadRow = document.querySelector('#testCasesTable thead tr');

    // Verificar si ya existe la columna de checkbox
    if (!theadRow.querySelector('.checkbox-column')) {
        // Crear columna de checkbox
        const checkboxTh = document.createElement('th');
        checkboxTh.className = 'checkbox-column';
        checkboxTh.innerHTML = `
            <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()" title="Seleccionar todos">
        `;
        theadRow.insertBefore(checkboxTh, theadRow.firstChild);
    }

    // 🆕 NUEVA COLUMNA DE DRAG HANDLE
    if (!theadRow.querySelector('.drag-handle-column')) {
        const dragHandleTh = document.createElement('th');
        dragHandleTh.className = 'drag-handle-column';
        dragHandleTh.innerHTML = `⋮⋮`;
        dragHandleTh.title = 'Reordenar escenarios';
        // Insertar después del checkbox (posición 1)
        theadRow.insertBefore(dragHandleTh, theadRow.children[1]);
    }

    // Elimina cualquier th de variables anterior (entre Descripción y Resultado Esperado)
    // Ajustar índices por la nueva columna drag handle
    while (theadRow.children[5] && theadRow.children[5].id === "varsThPlaceholder") {
        theadRow.removeChild(theadRow.children[5]);
    }

    // Elimina cualquier th de variables anterior
    while (theadRow.children[5] && theadRow.children[5].textContent !== "Resultado Esperado") {
        theadRow.removeChild(theadRow.children[5]);
    }

    // Inserta las columnas de variables configuradas
    // Ahora en posición 5 (después de checkbox, drag handle, ciclo, escenario, descripción)
    inputVariableNames.forEach(varName => {
        const th = document.createElement('th');
        th.textContent = varName;
        th.style.minWidth = '150px';
        th.style.maxWidth = '150px';
        th.classList.add('variable-column');
        theadRow.insertBefore(th, theadRow.querySelector('.col-resultado-esperado'));
    });
    // --- FIN ACTUALIZAR THEAD ---

    if (filteredCases.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        updateBulkToolbar();
        return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = filteredCases.map(testCase => {
        const statusClass = testCase.status === 'OK' ? 'status-ok' :
            testCase.status === 'NO' ? 'status-no' :
                (!testCase.status || testCase.status === '' || testCase.status === 'Pendiente') ? 'status-pending' : '';

        const evidenceCount = testCase.evidence ? testCase.evidence.length : 0;
        const isSelected = selectedCases.has(testCase.id);

        return `
            <tr class="${statusClass} ${isSelected ? 'row-selected' : ''}" data-case-id="${testCase.id}">
                <!-- Checkbox de selección -->
                <td class="checkbox-column">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleCaseSelection(${testCase.id})" 
                           title="Seleccionar caso">
                </td>
                
                <!-- 🆕 NUEVA COLUMNA DE DRAG HANDLE -->
                <td class="drag-handle-column">
                    <div class="drag-handle" 
                         onmousedown="startScenarioDrag(${testCase.id}, event)"
                         title="Arrastar para reordenar Escenario ${testCase.scenarioNumber}">
                        ⋮⋮
                    </div>
                </td>
                
                <!-- Resto de columnas existentes -->
                <td class="col-ciclo">${testCase.cycleNumber || ''}</td>
                <td class="col-escenario">${testCase.scenarioNumber || ''}</td>
                <td class="col-descripcion">${testCase.description || ''}</td>
                
                <!-- Variables dinámicas -->
                ${inputVariableNames.map(varName => {
            const found = (testCase.inputVariables || []).find(v => v.name === varName);
            return `<td class="variable-column" style="min-width: 150px; max-width: 150px;">${found ? found.value : ''}</td>`;
        }).join('')}
        
                <td class="col-resultado-esperado">${testCase.obtainedResult || ''}</td>
                <td>
                    <select onchange="updateStatusAndDate(${testCase.id}, this.value)" style="padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                        <option value="">Pendiente</option>
                        <option value="OK" ${testCase.status === 'OK' ? 'selected' : ''}>OK</option>
                        <option value="NO" ${testCase.status === 'NO' ? 'selected' : ''}>NO</option>
                    </select>
                </td>
                <td class="col-fecha-ejecucion">${testCase.executionDate || ''}</td>
                <td class="col-observaciones">${testCase.observations || ''}</td>
                <td class="col-error">${testCase.errorNumber || ''}</td>
                <td class="col-tester">${testCase.tester || ''}</td>
                <td>
                    <input type="number" min="0" value="${testCase.testTime ? Math.trunc(testCase.testTime) : 0}" 
                        style="width: 60px; text-align: right;" 
                        onchange="updateManualTime(${testCase.id}, this.value)">
                </td>
                
                <td class="col-evidencias">${evidenceCount > 0 ?
                `<a href="#" onclick="viewEvidence(${testCase.id}); return false;" style="color: #3498db; text-decoration: underline; cursor: pointer;">📎 ${evidenceCount} archivos</a>` :
                'Sin evidencias'}</td>
                
                <td class="action-buttons">
                    <button class="btn btn-info btn-small" onclick="openEditModal(${testCase.id})" title="Editar Escenario">✏️</button>
                    <button class="btn btn-success btn-small" onclick="duplicateTestCase(${testCase.id})" title="Duplicar Escenario">📋</button>
                    <button class="btn btn-danger btn-small" onclick="deleteTestCase(${testCase.id})" title="Borrar Escenario">🗑️</button>
                    <button class="btn btn-info btn-small" onclick="toggleRowTimer(${testCase.id})" id="timerBtn-${testCase.id}" title="Cronometrar Tiempo">${activeTimerId === testCase.id ? '⏹️' : '⏱️'}</button>
                    
                </td>
            </tr>
        `;
    }).join('');

    // Actualizar checkbox "Select All"
    updateSelectAllCheckbox();

    // Reinicializar drag scroll (mantener funcionalidad existente)
    reinitializeDragScroll();
}



window.applyFilters = function () {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const testerFilter = document.getElementById('testerFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;

    filteredCases = testCases.filter(testCase => {
        const matchesSearch = !search ||
            (testCase.description && testCase.description.toLowerCase().includes(search)) ||
            (testCase.tester && testCase.tester.toLowerCase().includes(search)) ||
            (testCase.scenarioNumber && testCase.scenarioNumber.toLowerCase().includes(search)) ||
            (testCase.observations && testCase.observations.toLowerCase().includes(search));

        const matchesTester = !testerFilter || testCase.tester === testerFilter;
        const matchesStatus = !statusFilter || testCase.status === statusFilter;

        let matchesDateRange = true;
        if (dateFrom || dateTo) {
            const testDate = testCase.executionDate ? new Date(testCase.executionDate) : null;
            if (testDate) {
                if (dateFrom) {
                    matchesDateRange = matchesDateRange && testDate >= new Date(dateFrom);
                }
                if (dateTo) {
                    matchesDateRange = matchesDateRange && testDate <= new Date(dateTo + 'T23:59:59');
                }
            }
        }

        return matchesSearch && matchesTester && matchesStatus && matchesDateRange;
    });

    renderTestCases();
    updateStats();
}

window.updateFilters = function () {
    // Actualizar filtro de testers
    const testerFilter = document.getElementById('testerFilter');
    const currentTester = testerFilter.value;
    const testers = [...new Set(testCases.map(tc => tc.tester).filter(t => t))];

    testerFilter.innerHTML = '<option value="">Todos</option>';
    testers.forEach(tester => {
        const option = document.createElement('option');
        option.value = tester;
        option.textContent = tester;
        if (tester === currentTester) option.selected = true;
        testerFilter.appendChild(option);
    });

    // Aplicar filtros iniciales
    filteredCases = [...testCases];
    applyFilters();
}

window.updateStats = function () {
    const total = filteredCases.length;
    const okCases = filteredCases.filter(tc => tc.status === 'OK').length;
    const noCases = filteredCases.filter(tc => tc.status === 'NO').length;
    const successRate = total > 0 ? Math.round((okCases / total) * 100) : 0;

    document.getElementById('totalCases').textContent = total;
    document.getElementById('okCases').textContent = okCases;
    document.getElementById('noCases').textContent = noCases;
    document.getElementById('successRate').textContent = successRate + '%';
}

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

//======================================
// FUNCION PARA GUARDAR ESCENARIOS EN JSON
//======================================
window.saveTestCases = function () {
    // Crear objeto completo con toda la información
    const exportData = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        testCases: testCases,
        requirementInfo: requirementInfo,
        inputVariableNames: inputVariableNames
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casos_prueba_completo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

//======================================================
// FUNCION PARA CARGAR ESCENARIOS DESDE UN ARCHIVO JSON
//======================================================

window.loadTestCases = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);

                    // DETECTAR FORMATO Y PREPARAR RESUMEN
                    let casesCount = 0;
                    let hasRequirementInfo = false;
                    let variablesCount = 0;
                    let formatType = '';

                    if (Array.isArray(data)) {
                        // ===== FORMATO ANTIGUO - Solo casos =====
                        formatType = 'antiguo';
                        casesCount = data.length;
                    } else if (data && typeof data === 'object' && data.testCases) {
                        // ===== FORMATO NUEVO - Objeto completo =====
                        formatType = 'nuevo';
                        casesCount = data.testCases ? data.testCases.length : 0;

                        // Verificar info del requerimiento
                        if (data.requirementInfo && typeof data.requirementInfo === 'object') {
                            hasRequirementInfo = Object.values(data.requirementInfo).some(v => v && v.trim && v.trim());
                        }

                        // Verificar variables
                        if (data.inputVariableNames && Array.isArray(data.inputVariableNames)) {
                            variablesCount = data.inputVariableNames.length;
                        }

                        // 🔧 NUEVA LÓGICA: Si no hay variables globales, intentar extraer de casos
                        if (variablesCount === 0 && data.testCases && data.testCases.length > 0) {
                            const extractedVariables = [];

                            // Buscar en el primer caso que tenga variables
                            for (const testCase of data.testCases) {
                                if (testCase.inputVariables && Array.isArray(testCase.inputVariables) && testCase.inputVariables.length > 0) {
                                    testCase.inputVariables.forEach(variable => {
                                        if (variable.name && !extractedVariables.includes(variable.name)) {
                                            extractedVariables.push(variable.name);
                                        }
                                    });
                                    break; // Con el primer caso es suficiente
                                }
                            }

                            if (extractedVariables.length > 0) {
                                variablesCount = extractedVariables.length;
                                console.log('🔧 Variables detectadas en casos:', extractedVariables);
                            }
                        }
                    } else {
                        alert('Formato de archivo inválido.\nDebe ser un archivo JSON válido con casos de prueba.');
                        return;
                    }

                    // CREAR MENSAJE DE CONFIRMACIÓN ÚNICA
                    let confirmMessage = `🔄 ¿Deseas cargar los datos del archivo JSON?\n\nEsto reemplazará:\n`;
                    confirmMessage += `• ${casesCount} escenario${casesCount !== 1 ? 's' : ''}\n`;

                    if (hasRequirementInfo) {
                        confirmMessage += `• Información del requerimiento\n`;
                    }

                    if (variablesCount > 0) {
                        confirmMessage += `• ${variablesCount} variable${variablesCount !== 1 ? 's' : ''} configurada${variablesCount !== 1 ? 's' : ''}\n`;
                    }

                    confirmMessage += `\n📂 Formato: ${formatType}\n\n`;
                    confirmMessage += `Aceptar = Cargar todo\nCancelar = Cancelar importación`;

                    // CONFIRMACIÓN ÚNICA
                    if (!confirm(confirmMessage)) {
                        console.log('❌ Importación cancelada por el usuario');
                        return;
                    }

                    // ===== IMPORTAR TODO AUTOMÁTICAMENTE =====
                    let importResults = [];

                    if (Array.isArray(data)) {
                        // FORMATO ANTIGUO - Solo casos
                        testCases = data;
                        importResults.push(`✅ ${data.length} escenarios cargados`);

                    } else {
                        // FORMATO NUEVO - Objeto completo

                        // 1. CARGAR CASOS
                        if (data.testCases && Array.isArray(data.testCases)) {
                            testCases = data.testCases;
                            importResults.push(`✅ ${data.testCases.length} escenarios cargados`);
                        }

                        // 2. CARGAR INFO DEL REQUERIMIENTO (automático)
                        if (hasRequirementInfo) {
                            requirementInfo = { ...data.requirementInfo };
                            localStorage.setItem('requirementInfo', JSON.stringify(requirementInfo));
                            updateRequirementDisplay();
                            importResults.push('✅ Información del requerimiento cargada');
                        }

                        // 3. CARGAR VARIABLES (automático) - VERSIÓN MEJORADA
                        if (data.inputVariableNames && Array.isArray(data.inputVariableNames) && data.inputVariableNames.length > 0) {
                            // Variables desde inputVariableNames (normal)
                            inputVariableNames = [...data.inputVariableNames];
                            localStorage.setItem('inputVariableNames', JSON.stringify(inputVariableNames));
                            importResults.push(`✅ ${data.inputVariableNames.length} variable${data.inputVariableNames.length !== 1 ? 's' : ''} cargada${data.inputVariableNames.length !== 1 ? 's' : ''}`);

                        } else if (testCases.length > 0) {
                            // ===== NUEVA LÓGICA: Extraer variables de los casos =====
                            const extractedVariables = [];

                            // Buscar en el primer caso que tenga variables
                            for (const testCase of testCases) {
                                if (testCase.inputVariables && Array.isArray(testCase.inputVariables) && testCase.inputVariables.length > 0) {
                                    testCase.inputVariables.forEach(variable => {
                                        if (variable.name && !extractedVariables.includes(variable.name)) {
                                            extractedVariables.push(variable.name);
                                        }
                                    });
                                    break; // Con el primer caso que tenga variables es suficiente
                                }
                            }

                            if (extractedVariables.length > 0) {
                                inputVariableNames = extractedVariables;
                                localStorage.setItem('inputVariableNames', JSON.stringify(inputVariableNames));
                                importResults.push(`✅ ${extractedVariables.length} variable${extractedVariables.length !== 1 ? 's' : ''} extraída${extractedVariables.length !== 1 ? 's' : ''} de los casos`);
                                console.log('🔧 Variables extraídas automáticamente:', extractedVariables);
                            }
                        }

                        // 4. ACTUALIZAR ESTRUCTURA DE CASOS con las variables (nueva o extraída)
                        if (inputVariableNames.length > 0) {
                            testCases.forEach(tc => {
                                tc.inputVariables = inputVariableNames.map(name => {
                                    const found = (tc.inputVariables || []).find(v => v.name === name);
                                    return { name, value: found ? found.value : '' };
                                });
                            });
                        }
                    }

                    // GUARDAR Y ACTUALIZAR INTERFAZ
                    saveToStorage();
                    renderTestCases();
                    updateStats();
                    updateFilters();

                    // MOSTRAR RESULTADO
                    const successMessage = '🎉 IMPORTACIÓN COMPLETADA:\n\n' + importResults.join('\n');
                    alert(successMessage);

                    console.log('✅ Importación exitosa:', importResults);

                } catch (error) {
                    console.error('Error al leer archivo JSON:', error);
                    alert('Error al leer el archivo: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}
/**
 * Exportar a Excel utilizando ExcelJS
 */
//==============================
//      EXPORTAR A EXCEL
//==============================
async function exportToExcel() {
    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();

    // ===== HOJA 1: INFORMACIÓN DEL REQUERIMIENTO =====
    const reqSheet = workbook.addWorksheet("Información del Requerimiento");

    // Título principal
    const titleRow = reqSheet.addRow(["INFORMACIÓN DEL REQUERIMIENTO"]);
    titleRow.eachCell(cell => {
        cell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "667EEA" } };
        cell.alignment = { horizontal: "center" };
    });
    reqSheet.mergeCells('A1:D1');

    // Fila vacía
    reqSheet.addRow([]);

    // Datos del requerimiento
    const reqInfo = getRequirementInfoForExport();

    if (reqInfo.hasInfo) {
        reqSheet.addRow(["N° Requerimiento:", reqInfo.data.number || ""]);
        reqSheet.addRow(["Nombre:", reqInfo.data.name || ""]);
        reqSheet.addRow(["Descripción:", reqInfo.data.description || ""]);
        reqSheet.addRow(["N° Caso:", reqInfo.data.caso || ""]);
        reqSheet.addRow(["Titulo Caso:", reqInfo.data.titleCase || ""]);
        reqSheet.addRow(["Tester Principal:", reqInfo.data.tester || ""]);
        reqSheet.addRow(["Fecha de Inicio:", reqInfo.data.startDate || ""]);
    } else {
        reqSheet.addRow(["No hay información del requerimiento configurada"]);
    }

    // Formatear columnas
    reqSheet.getColumn(1).width = 20;
    reqSheet.getColumn(2).width = 50;

    // Aplicar formato a las filas de datos
    for (let row = 3; row <= 8; row++) {
        const rowObj = reqSheet.getRow(row);
        rowObj.getCell(1).font = { bold: true };
        rowObj.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } };
    }

    // ===== HOJA 2: ESCENARIOS DE PRUEBA =====
    const sheet = workbook.addWorksheet("Escenarios de Prueba");

    // 1. Agregar encabezados
    const headers = [
        "Ciclo",
        "N° Escenario",
        "Descripción",
        ...inputVariableNames, // Variables dinámicas
        "Resultado Esperado",
        "Resultado Obtenido",
        "Fecha Ejecución",
        "Observaciones",
        "N° Error/Bug",
        "Tester",
        "Tiempo (min)",
        "Evidencias"
    ];
    sheet.addRow(headers).eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "667EEA" } };
        cell.alignment = { horizontal: "center" };
    });

    // 2. Agregar los datos de los escenarios
    testCases.forEach(tc => {
        const row = [
            tc.cycleNumber,
            tc.scenarioNumber,
            tc.description,
            ...inputVariableNames.map(varName => {
                const variable = (tc.inputVariables || []).find(v => v.name === varName);
                return variable ? variable.value : "";
            }),
            tc.obtainedResult,
            tc.status,
            tc.executionDate,
            tc.observations,
            tc.errorNumber,
            tc.tester,
            tc.testTime || 0,
            tc.evidence ? `${tc.evidence.length} archivos` : "Sin evidencias"
        ];
        sheet.addRow(row);
    });

    // 3. Agregar las evidencias al final agrupadas por ciclo
    // Agregar filas vacías después de la tabla principal
    for (let i = 0; i < 5; i++) {
        sheet.addRow([]);
    }

    // Filtrar solo los escenarios que tienen evidencias
    const scenariosWithEvidence = testCases.filter(tc => tc.evidence && tc.evidence.length > 0);

    // Agrupar escenarios por ciclo
    const scenariosByCycle = {};
    scenariosWithEvidence.forEach(tc => {
        if (!scenariosByCycle[tc.cycleNumber]) {
            scenariosByCycle[tc.cycleNumber] = [];
        }
        scenariosByCycle[tc.cycleNumber].push(tc);
    });

    // Obtener los números de ciclo y ordenarlos
    const cycleNumbers = Object.keys(scenariosByCycle).map(Number).sort((a, b) => a - b);

    cycleNumbers.forEach((cycleNumber, cycleIndex) => {
        // 1. Agregar línea amarilla para el ciclo
        const cycleRowData = new Array(40).fill("");
        cycleRowData[0] = `CICLO ${cycleNumber}`; // Solo texto en la primera celda

        const cycleRow = sheet.addRow(cycleRowData);

        // Aplicar formato amarillo con texto negro a todas las celdas (columnas 1-40)
        for (let col = 1; col <= 40; col++) {
            const cell = cycleRow.getCell(col);
            cell.font = { bold: true, color: { argb: "000000" } }; // Texto negro
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } }; // Fondo amarillo
            cell.alignment = { horizontal: "center" };
        }

        // 2. Procesar todos los escenarios de este ciclo
        const scenariosInCycle = scenariosByCycle[cycleNumber];

        scenariosInCycle.forEach((tc, scenarioIndex) => {
            // 2.1. Crear la línea negra para identificar el escenario
            const titleRowData = new Array(40).fill("");
            titleRowData[0] = `Escenario ${tc.scenarioNumber}`; // Solo texto en la primera celda

            const titleRow = sheet.addRow(titleRowData);

            // Aplicar formato negro con texto blanco a todas las celdas de la línea negra (columnas 1-40)
            for (let col = 1; col <= 40; col++) {
                const cell = titleRow.getCell(col);
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Texto blanco
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "000000" } }; // Fondo negro
                cell.alignment = { horizontal: "center" };
            }

            // 2.2. Agregar las imágenes de las evidencias
            tc.evidence.forEach((evidence, evidenceIndex) => {
                // Obtener la fila actual donde colocar la imagen
                const currentRowNumber = sheet.lastRow.number;

                // Incrustar la imagen en la celda
                const imageId = workbook.addImage({
                    base64: evidence.data,
                    extension: "png"
                });

                // Colocar la imagen en la fila actual
                sheet.addImage(imageId, {
                    tl: { col: 0, row: currentRowNumber },
                    ext: { width: 300, height: 150 }
                });

                // Agregar 10 filas vacías después de cada imagen
                for (let i = 0; i < 10; i++) {
                    sheet.addRow([]);
                }
            });

            // 2.3. Al finalizar las imágenes de este escenario, agregar 20 filas vacías adicionales
            // (solo si no es el último escenario del ciclo)
            if (scenarioIndex < scenariosInCycle.length - 1) {
                for (let i = 0; i < 20; i++) {
                    sheet.addRow([]);
                }
            }
        });

        // 3. Al finalizar todos los escenarios del ciclo, agregar 30 filas vacías antes del siguiente ciclo
        // (solo si no es el último ciclo)
        if (cycleIndex < cycleNumbers.length - 1) {
            for (let i = 0; i < 30; i++) {
                sheet.addRow([]);
            }
        }
    });

    // 4. Ajustar anchos de columna para mejor visualización
    sheet.columns.forEach(column => {
        column.width = 15; // Ancho estándar
    });

    // 5. Exportar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString('es-ES', { hour12: false });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = 'Casos de Prueba ' + horaFormateada + '.xlsx';
    link.click();
    URL.revokeObjectURL(url);
}

//==============================
//      IMPORTAR DESDE EXCEL
//==============================
// Función principal para importar Excel
window.importFromExcel = function () {
    // Crear input file invisible
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        // Mostrar loading
        showImportProgress('📂 Leyendo archivo Excel...');

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                processExcelFile(e.target.result, file.name);
            } catch (error) {
                console.error('Error al leer Excel:', error);
                alert('❌ Error al leer el archivo Excel:\n' + error.message);
                hideImportProgress();
            }
        };
        reader.readAsArrayBuffer(file);
    };

    input.click();
};

// Función para procesar el archivo Excel
async function processExcelFile(arrayBuffer, fileName) {
    try {
        showImportProgress('🔍 Analizando estructura del Excel...');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        if (workbook.worksheets.length === 0) {
            throw new Error('El archivo Excel no contiene hojas de trabajo');
        }

        console.log(`📊 Workbook cargado: ${workbook.worksheets.length} hojas encontradas`);
        workbook.worksheets.forEach((sheet, index) => {
            console.log(`Hoja ${index + 1}: "${sheet.name}"`);
        });

        showImportProgress('📋 Leyendo información del requerimiento...');

        // 1. LEER INFORMACIÓN DEL REQUERIMIENTO
        let requirementData = null;

        // Buscar hoja de requerimiento (primera hoja o por nombre)
        const reqSheet = workbook.worksheets.find(sheet =>
            sheet.name.toLowerCase().includes('requerimiento') ||
            sheet.name.toLowerCase().includes('información') ||
            sheet.name.toLowerCase().includes('info')
        ) || workbook.worksheets[0];

        console.log(`📋 Procesando hoja de requerimiento: "${reqSheet.name}"`);
        requirementData = parseRequirementInfoFixed(reqSheet);

        showImportProgress('📊 Procesando datos de casos...');

        // 2. BUSCAR HOJA DE ESCENARIOS
        let scenariosSheet = null;

        // Buscar hoja de escenarios (última hoja o por nombre)
        scenariosSheet = workbook.worksheets.find(sheet =>
            sheet.name.toLowerCase().includes('escenario') ||
            sheet.name.toLowerCase().includes('prueba') ||
            sheet.name.toLowerCase().includes('casos')
        ) || workbook.worksheets[workbook.worksheets.length - 1];

        console.log(`📊 Procesando hoja de escenarios: "${scenariosSheet.name}"`);

        // 3. PARSEAR TABLA PRINCIPAL DE CASOS
        const importedData = parseMainTable(scenariosSheet);

        if (importedData.cases.length === 0) {
            throw new Error('No se encontraron casos válidos en el Excel');
        }

        showImportProgress('🖼️ Extrayendo evidencias específicas por escenario...');

        // 4. PARSEAR EVIDENCIAS CON DISTRIBUCIÓN CORRECTA
        const evidences = await parseEvidencesCorrectDistribution(scenariosSheet, workbook);

        showImportProgress('🔗 Asociando evidencias con casos...');

        // 5. ASOCIAR EVIDENCIAS CON CASOS
        associateEvidencesWithCases(importedData.cases, evidences);

        // 6. LOGS DE DEBUG
        const totalEvidences = importedData.cases.reduce((total, tc) =>
            total + (tc.evidence ? tc.evidence.length : 0), 0);

        console.log('📊 RESUMEN DE IMPORTACIÓN:');
        console.log(`- Casos: ${importedData.cases.length}`);
        console.log(`- Variables: ${importedData.variableNames.join(', ')}`);
        console.log(`- Evidencias totales: ${totalEvidences}`);
        console.log(`- Info requerimiento: ${requirementData ? 'SÍ' : 'NO'}`);

        // Log de casos con evidencias
        importedData.cases.forEach(tc => {
            if (tc.evidence && tc.evidence.length > 0) {
                console.log(`  🖼️ Ciclo ${tc.cycleNumber}, Escenario ${tc.scenarioNumber}: ${tc.evidence.length} imagen(es)`);
            }
        });

        showImportProgress('💾 Preparando datos para importar...');

        // 7. CONFIRMAR IMPORTACIÓN
        const confirmMessage = `📋 IMPORTACIÓN DETECTADA:\n\n` +
            `📂 Archivo: ${fileName}\n` +
            `📊 ${importedData.cases.length} casos encontrados\n` +
            `🎯 Variables: ${importedData.variableNames.join(', ')}\n` +
            `🖼️ ${totalEvidences} imágenes encontradas\n` +
            `📋 ${requirementData ? 'Info del requerimiento: SÍ' : 'Info del requerimiento: NO'}\n\n` +
            `⚠️ ESTO REEMPLAZARÁ TODOS LOS DATOS ACTUALES\n\n` +
            `¿Confirmar importación?`;

        if (!confirm(confirmMessage)) {
            hideImportProgress();
            return;
        }

        // 8. APLICAR DATOS IMPORTADOS
        applyImportedDataComplete(importedData, requirementData);

        hideImportProgress();

        // 9. MENSAJE DE ÉXITO
        alert(`✅ IMPORTACIÓN EXITOSA\n\n` +
            `📊 ${importedData.cases.length} casos importados\n` +
            `🎯 Variables: ${importedData.variableNames.join(', ')}\n` +
            `🖼️ ${totalEvidences} imágenes distribuidas correctamente\n` +
            `📋 ${requirementData ? 'Info del requerimiento importada' : 'Sin info del requerimiento'}\n\n` +
            `¡Importación completada!`);

        console.log('✅ Importación completada exitosamente');

    } catch (error) {
        console.error('Error en processExcelFile:', error);
        hideImportProgress();
        alert('❌ Error al procesar el archivo Excel:\n\n' + error.message);
    }
}

// Función para mostrar progreso de importación
function showImportProgress(message) {
    let progressModal = document.getElementById('importProgressModal');

    if (!progressModal) {
        progressModal = document.createElement('div');
        progressModal.id = 'importProgressModal';
        progressModal.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    min-width: 300px;
                ">
                    <div style="
                        width: 40px; height: 40px;
                        border: 4px solid #667eea;
                        border-top: 4px solid transparent;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px auto;
                    "></div>
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Importando Excel</h3>
                    <p id="importProgressText" style="margin: 0; color: #7f8c8d;">Iniciando...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(progressModal);
    }

    const textElement = document.getElementById('importProgressText');
    if (textElement) {
        textElement.textContent = message;
    }

    console.log('📋 Import Progress:', message);
}

// Función para ocultar progreso
function hideImportProgress() {
    const progressModal = document.getElementById('importProgressModal');
    if (progressModal) {
        progressModal.remove();
    }
}

// Función para parsear la tabla principal de casos
function parseMainTable(sheet) {
    console.log('📊 Parseando tabla principal...');

    // Encontrar la fila de headers
    let headerRow = null;
    let headerRowIndex = 1;

    for (let row = 1; row <= 10; row++) {
        const firstCell = sheet.getCell(row, 1).value;
        if (firstCell && (firstCell.toString().toLowerCase().includes('ciclo') ||
            firstCell.toString().toLowerCase() === 'ciclo')) {
            headerRow = sheet.getRow(row);
            headerRowIndex = row;
            break;
        }
    }

    if (!headerRow) {
        throw new Error('No se encontró la fila de encabezados. Busque una fila que comience con "Ciclo"');
    }

    // Extraer nombres de columnas
    const columnNames = [];
    for (let col = 1; col <= 50; col++) {
        const cellValue = headerRow.getCell(col).value;
        if (cellValue && cellValue.toString().trim()) {
            columnNames.push({
                index: col,
                name: cellValue.toString().trim()
            });
        } else if (col > 15) {
            break; // Parar después de 15 columnas vacías
        }
    }

    console.log('📋 Columnas detectadas:', columnNames.map(c => c.name));

    // Identificar índices de columnas importantes
    const columnIndexes = {
        ciclo: findColumnIndex(columnNames, ['ciclo']),
        escenario: findColumnIndex(columnNames, ['escenario', 'n° escenario', 'numero escenario']),
        descripcion: findColumnIndex(columnNames, ['descripcion', 'descripción']),
        resultadoEsperado: findColumnIndex(columnNames, ['resultado esperado', 'esperado']),
        resultadoObtenido: findColumnIndex(columnNames, ['resultado obtenido', 'obtenido']),
        fechaEjecucion: findColumnIndex(columnNames, ['fecha ejecucion', 'fecha ejecución', 'fecha']),
        observaciones: findColumnIndex(columnNames, ['observaciones', 'observacion']),
        error: findColumnIndex(columnNames, ['error', 'bug', 'n° error']),
        tester: findColumnIndex(columnNames, ['tester', 'probador']),
        tiempo: findColumnIndex(columnNames, ['tiempo', 'min', 'minutos']),
        evidencias: findColumnIndex(columnNames, ['evidencias', 'evidencia', 'archivos'])
    };

    // Detectar variables dinámicas (entre Descripción y Resultado Esperado)
    const variableNames = [];
    const descIndex = columnIndexes.descripcion;
    const expectedIndex = columnIndexes.resultadoEsperado;

    if (descIndex && expectedIndex && expectedIndex > descIndex + 1) {
        for (let i = descIndex + 1; i < expectedIndex; i++) {
            const varColumn = columnNames.find(col => col.index === i);
            if (varColumn) {
                variableNames.push(varColumn.name);
            }
        }
    }

    console.log('🔧 Variables dinámicas detectadas:', variableNames);

    // Leer datos de casos
    const cases = [];
    let currentRow = headerRowIndex + 1;

    while (currentRow <= sheet.rowCount) {
        const row = sheet.getRow(currentRow);

        // Verificar si la fila tiene datos de caso
        const cicloValue = row.getCell(columnIndexes.ciclo || 1).value;
        if (!cicloValue || cicloValue.toString().trim() === '') {
            break;
        }

        // Verificar si llegamos a las evidencias
        const firstCellValue = row.getCell(1).value;
        if (firstCellValue && firstCellValue.toString().toUpperCase().includes('CICLO')) {
            break;
        }

        // Crear caso
        const testCase = {
            id: Date.now() + Math.random(),
            cycleNumber: getCellValue(row, columnIndexes.ciclo),
            scenarioNumber: getCellValue(row, columnIndexes.escenario),
            description: getCellValue(row, columnIndexes.descripcion),
            obtainedResult: getCellValue(row, columnIndexes.resultadoEsperado),
            status: getCellValue(row, columnIndexes.resultadoObtenido),
            executionDate: getCellValue(row, columnIndexes.fechaEjecucion),
            observations: getCellValue(row, columnIndexes.observaciones),
            errorNumber: getCellValue(row, columnIndexes.error),
            tester: getCellValue(row, columnIndexes.tester),
            testTime: parseFloat(getCellValue(row, columnIndexes.tiempo)) || 0,
            inputVariables: [],
            evidence: []
        };

        // Agregar variables dinámicas
        variableNames.forEach((varName, index) => {
            const varIndex = columnIndexes.descripcion + 1 + index;
            const varValue = getCellValue(row, varIndex);
            testCase.inputVariables.push({
                name: varName,
                value: varValue || ''
            });
        });

        cases.push(testCase);
        currentRow++;
    }

    console.log(`✅ ${cases.length} casos parseados correctamente`);

    return {
        cases: cases,
        variableNames: variableNames
    };
}

// Función para parsear evidencias del Excel
async function parseEvidencesCorrectDistribution(sheet, workbook) {
    console.log('🖼️ Distribuyendo evidencias basado en columna "Evidencias" de la tabla...');

    const evidences = [];

    try {
        // 1. EXTRAER TODAS LAS IMÁGENES
        const allImages = await extractAllImagesWithPositions(workbook);
        console.log(`📸 Total de imágenes extraídas: ${allImages.length}`);

        if (allImages.length === 0) {
            console.log('❌ No se encontraron imágenes en el workbook');
            return evidences;
        }

        // 2. OBTENER INFORMACIÓN DE EVIDENCIAS DE LA TABLA PRINCIPAL
        const evidenceInfo = await getEvidenceInfoFromTable(sheet);
        console.log('📊 Información de evidencias por caso:', evidenceInfo);

        // 3. DISTRIBUIR IMÁGENES SEGÚN LA INFORMACIÓN DE LA TABLA
        let imageIndex = 0;

        evidenceInfo.forEach(caseInfo => {
            if (caseInfo.evidenceCount > 0 && imageIndex < allImages.length) {
                const caseImages = [];

                // Tomar las siguientes N imágenes para este caso
                for (let i = 0; i < caseInfo.evidenceCount && imageIndex < allImages.length; i++) {
                    caseImages.push(allImages[imageIndex]);
                    imageIndex++;
                }

                evidences.push({
                    cycle: caseInfo.cycle,
                    scenario: caseInfo.scenario,
                    images: caseImages
                });

                console.log(`✅ Ciclo ${caseInfo.cycle}, Escenario ${caseInfo.scenario}: ${caseImages.length} imagen(es) asignada(s) (esperadas: ${caseInfo.evidenceCount})`);
            }
        });

        // 4. VERIFICAR DISTRIBUCIÓN
        const totalAssigned = evidences.reduce((total, ev) => total + ev.images.length, 0);
        console.log(`📊 Distribución completada: ${totalAssigned}/${allImages.length} imágenes asignadas`);

        if (imageIndex < allImages.length) {
            console.warn(`⚠️ Quedaron ${allImages.length - imageIndex} imágenes sin asignar`);
        }

    } catch (error) {
        console.error('Error al parsear evidencias:', error);
    }

    return evidences;
}

// Función para asociar evidencias con casos
function associateEvidencesWithCases(cases, evidences) {
    console.log('🔗 Asociando evidencias con casos (versión mejorada)...');

    evidences.forEach(evidenceGroup => {
        const { cycle, scenario, images } = evidenceGroup;

        // Buscar el caso que corresponde a este ciclo y escenario
        const matchingCase = cases.find(tc =>
            tc.cycleNumber && tc.scenarioNumber &&
            tc.cycleNumber.toString().trim() === cycle.toString().trim() &&
            tc.scenarioNumber.toString().trim() === scenario.toString().trim()
        );

        if (matchingCase) {
            matchingCase.evidence = images;
            console.log(`✅ ${images.length} evidencia(s) asociada(s) al Ciclo ${cycle}, Escenario ${scenario}`);
        } else {
            console.warn(`⚠️ No se encontró caso para Ciclo ${cycle}, Escenario ${scenario}`);
            console.log('Casos disponibles:', cases.map(tc => `${tc.cycleNumber}-${tc.scenarioNumber}`));
        }
    });

    // Estadísticas finales
    const casesWithEvidence = cases.filter(tc => tc.evidence && tc.evidence.length > 0);
    const totalEvidences = cases.reduce((total, tc) => total + (tc.evidence ? tc.evidence.length : 0), 0);

    console.log(`📊 Asociación completada: ${casesWithEvidence.length} casos con evidencias, ${totalEvidences} evidencias totales`);

    // Log detallado para debug
    casesWithEvidence.forEach(tc => {
        console.log(`🖼️ Caso ${tc.cycleNumber}-${tc.scenarioNumber}: ${tc.evidence.length} evidencia(s)`);
    });
}

// Función para aplicar datos importados
function applyImportedDataComplete(importedData, requirementData) {
    console.log('💾 Aplicando datos importados completos...');

    try {
        // 1. APLICAR INFORMACIÓN DEL REQUERIMIENTO - CORREGIDO
        if (requirementData) {
            // Actualizar la variable global (SIN window)
            requirementInfo = { ...requirementData };

            // Guardar en localStorage
            localStorage.setItem('requirementInfo', JSON.stringify(requirementData));

            // Llamar directamente updateRequirementDisplay (sin verificación)
            updateRequirementDisplay();

            console.log('✅ Información del requerimiento aplicada:', requirementData);
        }

        // 2. ACTUALIZAR VARIABLES DINÁMICAS GLOBALES
        inputVariableNames = [...importedData.variableNames];
        localStorage.setItem('inputVariableNames', JSON.stringify(inputVariableNames));

        // 3. REEMPLAZAR TODOS LOS CASOS
        testCases = importedData.cases;
        saveToStorage();

        // 4. ACTUALIZAR INTERFAZ
        renderTestCases();
        updateStats();
        updateFilters();

        // 5. FORZAR ACTUALIZACIÓN ADICIONAL DEL REQUERIMIENTO
        if (requirementData) {
            setTimeout(() => {
                updateRequirementDisplay();
                console.log('🔄 Segunda actualización del requerimiento forzada');
            }, 100);
        }

        // 6. MOSTRAR ESTADÍSTICAS DE EVIDENCIAS
        const casesWithEvidence = testCases.filter(tc => tc.evidence && tc.evidence.length > 0);
        const totalEvidences = testCases.reduce((total, tc) => total + (tc.evidence ? tc.evidence.length : 0), 0);

        console.log(`📊 Importación aplicada: ${testCases.length} casos, ${casesWithEvidence.length} con evidencias, ${totalEvidences} imágenes totales`);

        // 7. LOG DETALLADO PARA DEBUG
        testCases.forEach((tc, index) => {
            if (tc.evidence && tc.evidence.length > 0) {
                console.log(`🖼️ Caso ${tc.cycleNumber}-${tc.scenarioNumber}: ${tc.evidence.length} evidencias`);
            }
        });

        console.log('✅ Todos los datos aplicados correctamente');

    } catch (error) {
        console.error('Error al aplicar datos importados:', error);
        throw new Error('Error al aplicar los datos importados: ' + error.message);
    }
}

// Funciones auxiliares
function findColumnIndex(columnNames, searchTerms) {
    for (const term of searchTerms) {
        const found = columnNames.find(col =>
            col.name.toLowerCase().includes(term.toLowerCase())
        );
        if (found) return found.index;
    }
    return null;
}

function getCellValue(row, columnIndex) {
    if (!columnIndex) return '';
    const cell = row.getCell(columnIndex);
    if (!cell || !cell.value) return '';

    if (typeof cell.value === 'object' && cell.value.text) {
        return cell.value.text.toString().trim();
    }
    return cell.value.toString().trim();
}

//==============================
//      LIMPIAR TODOS LOS DATOS
//==============================

window.clearAllData = function () {
    if (confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los datos?\n\n• Escenarios de prueba\n• Información del requerimiento\n• Variables configuradas\n\nEsta acción no se puede deshacer.')) {
        if (confirm('🚨 CONFIRMACIÓN FINAL: Se eliminarán todos los datos. ¿Continuar?')) {
            // Limpiar casos de prueba
            testCases = [];
            filteredCases = [];
            localStorage.removeItem('testCases');

            // Limpiar información del requerimiento
            requirementInfo = {
                number: '',
                name: '',
                description: '',
                caso: '',
                titleCase: '',
                tester: '',
                startDate: ''
            };
            localStorage.removeItem('requirementInfo');

            // Limpiar variables configuradas (opcional)
            inputVariableNames = [];
            localStorage.removeItem('inputVariableNames');

            // Actualizar interfaz
            renderTestCases();
            updateStats();
            updateFilters();
            updateRequirementDisplay(); // ← NUEVA línea para actualizar la info del requerimiento

            alert('✅ Todos los datos han sido eliminados:\n\n• Escenarios de prueba\n• Información del requerimiento\n• Variables configuradas');
        }
    }
}

//==============================
// Event Listeners
//==============================
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

    // Manejo del formulario
    document.getElementById('testCaseForm').addEventListener('submit', function (e) {
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
    // Event listeners para edición masiva
    const closeBulkEditBtn = document.getElementById('closeBulkEditBtn');
    if (closeBulkEditBtn) {
        closeBulkEditBtn.addEventListener('click', closeBulkEditModal);
    }

    const btnCancelBulkEdit = document.getElementById('btnCancelBulkEdit');
    if (btnCancelBulkEdit) {
        btnCancelBulkEdit.addEventListener('click', closeBulkEditModal);
    }

    // Manejar envío del formulario de edición masiva
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

// ===============================================
// FUNCIONALIDAD DRAG SCROLL HORIZONTAL - CORREGIDA
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
// FUNCIONALIDAD DE SELECCIÓN MÚLTIPLE - CON LÓGICA MEJORADA
// ===============================================

// Variables para selección múltiple
let selectedCases = new Set(); // IDs de casos seleccionados

// Función para renumeración inteligente por ciclos
function smartRenumberAfterDeletion() {
    // Solo renumerar Ciclo 1 - mantener secuencia 1,2,3,4...
    const cycle1Cases = testCases.filter(tc => tc.cycleNumber === '1')
        .sort((a, b) => parseInt(a.scenarioNumber) - parseInt(b.scenarioNumber));

    cycle1Cases.forEach((tc, index) => {
        tc.scenarioNumber = (index + 1).toString();
    });

    // Ciclo 2+ mantienen sus números originales (no renumerar)
    console.log('✅ Renumeración inteligente completada - Solo Ciclo 1 renumerado');
}

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

// Función para deseleccionar todos los casos
window.clearSelection = function () {
    selectedCases.clear();
    updateSelectAllCheckbox();
    updateBulkToolbar();
    renderTestCases();
}

// ===============================================
// FUNCIONALIDAD OCULTAR FILAS - SOLO ADITIVA
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

// Función para mostrar/ocultar casos ocultos (toggle)
window.toggleShowHidden = function () {
    // Aplicar filtros existentes (que ahora incluirán la lógica de ocultos)
    applyFilters();
}

// Función para obtener contador de casos ocultos
function getHiddenCasesCount() {
    return testCases.filter(tc => tc.hidden === true).length;
}

// Función para mostrar todos los casos ocultos
window.showAllHiddenCases = function () {
    const hiddenCount = getHiddenCasesCount();
    if (hiddenCount === 0) {
        alert('No hay escenarios ocultos para mostrar');
        return;
    }

    const message = `👁️ ¿Deseas mostrar todos los ${hiddenCount} escenarios ocultos?\n\nVolverán a aparecer en la lista principal.`;

    if (!confirm(message)) return;

    // Quitar marca de oculto a todos los casos
    testCases.forEach(tc => {
        if (tc.hidden === true) {
            tc.hidden = false;
        }
    });

    // Actualizar interfaz
    saveToStorage();
    applyFilters();
    updateStats();

    alert(`✅ ${hiddenCount} escenarios mostrados correctamente`);
}

// EXTENSIÓN de la función updateStats existente - NO reemplazar, solo agregar al final
function updateStatsWithHidden() {
    // Llamar a la función updateStats original primero
    updateStats();

    // Agregar contador de ocultos
    const hiddenCount = getHiddenCasesCount();
    let hiddenStatsElement = document.getElementById('hiddenCases');

    if (hiddenCount > 0) {
        if (!hiddenStatsElement) {
            // Crear nueva tarjeta de stats para casos ocultos
            const statsContainer = document.getElementById('statsContainer');
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'stat-card stat-card-hidden';
            hiddenCard.id = 'hiddenCasesCard';
            hiddenCard.innerHTML = `
                <div class="stat-number" id="hiddenCases">${hiddenCount}</div>
                <div class="stat-label">Casos Ocultos</div>
            `;
            hiddenCard.onclick = showAllHiddenCases;
            hiddenCard.style.cursor = 'pointer';
            hiddenCard.title = 'Click para mostrar todos los escenarios ocultos';
            statsContainer.appendChild(hiddenCard);
        } else {
            hiddenStatsElement.textContent = hiddenCount;
        }
    } else {
        // Remover tarjeta si no hay casos ocultos
        const hiddenCard = document.getElementById('hiddenCasesCard');
        if (hiddenCard) {
            hiddenCard.remove();
        }
    }
}

// EXTENSIÓN de la función applyFilters existente - NO reemplazar
// Esta función debe agregarse AL FINAL de tu función applyFilters existente
function applyFiltersWithHidden() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const testerFilter = document.getElementById('testerFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;

    // NUEVA lógica para casos ocultos
    const showHidden = document.getElementById('showHiddenToggle') ?
        document.getElementById('showHiddenToggle').checked : false;

    filteredCases = testCases.filter(testCase => {
        // NUEVA condición: filtrar ocultos a menos que esté activado el toggle
        if (!showHidden && testCase.hidden === true) {
            return false;
        }

        // Resto de filtros existentes (MANTENER SIN CAMBIOS)
        const matchesSearch = !search ||
            (testCase.description && testCase.description.toLowerCase().includes(search)) ||
            (testCase.tester && testCase.tester.toLowerCase().includes(search)) ||
            (testCase.scenarioNumber && testCase.scenarioNumber.toLowerCase().includes(search)) ||
            (testCase.observations && testCase.observations.toLowerCase().includes(search));

        const matchesTester = !testerFilter || testCase.tester === testerFilter;
        const matchesStatus = !statusFilter ||
            (statusFilter === "Pendiente" ? (!testCase.status || testCase.status === "") : testCase.status === statusFilter);

        let matchesDateRange = true;
        if (dateFrom || dateTo) {
            const testDate = testCase.executionDate ? new Date(testCase.executionDate) : null;
            if (testDate) {
                if (dateFrom) {
                    matchesDateRange = matchesDateRange && testDate >= new Date(dateFrom);
                }
                if (dateTo) {
                    matchesDateRange = matchesDateRange && testDate <= new Date(dateTo + 'T23:59:59');
                }
            }
        }

        return matchesSearch && matchesTester && matchesStatus && matchesDateRange;
    });

    renderTestCases();
    updateStatsWithHidden(); // Usar la nueva función que incluye ocultos
}

// REEMPLAZAR tu función applyFilters existente con esta versión extendida
window.applyFilters = applyFiltersWithHidden;

// Inicialización adicional para casos existentes (migración segura)
function initializeHiddenFunctionality() {
    // Asegurar que casos existentes tengan la propiedad hidden
    testCases.forEach(tc => {
        if (tc.hidden === undefined) {
            tc.hidden = false; // Por defecto NO oculto
        }
    });

    // Actualizar stats con la nueva funcionalidad
    updateStatsWithHidden();
}

// Llamar inicialización cuando cargue la página
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initializeHiddenFunctionality, 1000); // Después de que todo se cargue
});

//BORRAR SI SE ACTUALIZA TODO BIEN
window.debugStats = function () {
    const total = filteredCases.length;
    const okCases = filteredCases.filter(tc => tc.status === 'OK').length;
    const noCases = filteredCases.filter(tc => tc.status === 'NO').length;
    const pendingCases = filteredCases.filter(tc => !tc.status || tc.status === '').length;

    console.log('📊 Estadísticas actuales:', {
        total: total,
        ok: okCases,
        no: noCases,
        pending: pendingCases,
        successRate: total > 0 ? Math.round((okCases / total) * 100) : 0
    });

    return { total, okCases, noCases, pendingCases };
}

// ===============================================
// FUNCIONALIDAD INFORMACIÓN DEL REQUERIMIENTO
// ===============================================

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

// Manejar envío del formulario
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

// Función para exportar información del requerimiento (para reportes)
window.getRequirementInfoForExport = function () {
    return {
        hasInfo: !!(requirementInfo.number || requirementInfo.name),
        data: requirementInfo,
        summary: requirementInfo.number && requirementInfo.name ?
            `${requirementInfo.number} - ${requirementInfo.name}` :
            'Información no configurada'
    };
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

//=======================================
// FUCIONES PARA EXPORTAR/IMPORTAR EXCEL
//=======================================
function parseRequirementInfoFixed(sheet) {
    console.log('📋 Parseando información del requerimiento (versión corregida)...');

    try {
        const requirement = {
            number: '',
            name: '',
            description: '',
            caso: '',
            titleCase: '',
            tester: '',
            startDate: ''
        };

        // Buscar en las primeras 15 filas con diferentes patrones
        for (let row = 1; row <= 15; row++) {
            const rowObj = sheet.getRow(row);

            for (let col = 1; col <= 5; col++) {
                const labelCell = rowObj.getCell(col);
                const valueCell = rowObj.getCell(col + 1);

                if (!labelCell.value) continue;

                const label = labelCell.value.toString().toLowerCase().trim();
                const value = valueCell.value ? valueCell.value.toString().trim() : '';

                console.log(`🔍 Fila ${row}, Col ${col}: "${label}" = "${value}"`);

                // Mapeo más flexible de campos
                if ((label.includes('requerimiento') || label.includes('req')) &&
                    (label.includes('n°') || label.includes('numero') || label.includes('número'))) {
                    requirement.number = value;
                    console.log(`✅ Número encontrado: "${value}"`);
                } else if (label.includes('nombre') && !label.includes('tester')) {
                    requirement.name = value;
                    console.log(`✅ Nombre encontrado: "${value}"`);
                } else if (label.includes('descripción') || label.includes('descripcion')) {
                    requirement.description = value;
                    console.log(`✅ Descripción encontrada: "${value}"`);
                } else if (label.includes('titulo caso') || label.includes('título caso')) {
                    requirement.titleCase = value;
                    console.log(`✅ Titulo caso encontrado: "${value}"`);
                } else if ((label.includes('n°') && label.includes('caso')) ||
                    (label.includes('numero') && label.includes('caso')) ||
                    (label.includes('número') && label.includes('caso'))) {
                    requirement.caso = value;
                    console.log(`✅ N° Caso encontrado: "${value}"`);
                } else if (label.includes('tester') || label.includes('probador')) {
                    requirement.tester = value;
                    console.log(`✅ Tester encontrado: "${value}"`);
                } else if (label.includes('fecha') && label.includes('inicio')) {
                    requirement.startDate = value;
                    console.log(`✅ Fecha encontrada: "${value}"`);
                }
            }
        }

        // Verificar si encontró datos
        const hasData = Object.values(requirement).some(v => v && v.trim());

        if (hasData) {
            console.log('✅ Información del requerimiento encontrada:', requirement);
            return requirement;
        } else {
            console.log('❌ No se encontró información del requerimiento');
            return null;
        }

    } catch (error) {
        console.error('Error al parsear información del requerimiento:', error);
        return null;
    }
}



// NUEVA FUNCIÓN: Extraer todas las imágenes del workbook
async function extractAllImagesFromWorkbook(workbook) {
    const images = [];

    try {
        console.log('🔍 Extrayendo todas las imágenes del workbook...');

        // Método 1: workbook.model.media
        if (workbook.model && workbook.model.media && workbook.model.media.length > 0) {
            console.log(`📸 Método 1: Encontradas ${workbook.model.media.length} imágenes en workbook.model.media`);

            for (let i = 0; i < workbook.model.media.length; i++) {
                try {
                    const media = workbook.model.media[i];
                    if (media && media.buffer) {
                        const uint8Array = new Uint8Array(media.buffer);
                        const binary = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
                        const base64 = btoa(binary);

                        const extension = media.extension || 'png';
                        const mimeType = `image/${extension}`;

                        images.push({
                            name: `Evidencia_${i + 1}.${extension}`,
                            data: `data:${mimeType};base64,${base64}`
                        });

                        console.log(`✅ Imagen ${i + 1} extraída: ${extension}`);
                    }
                } catch (imgError) {
                    console.warn(`⚠️ Error al procesar imagen ${i + 1}:`, imgError);
                }
            }
        }

        // Método 2: Buscar en worksheets
        if (images.length === 0) {
            console.log('🔍 Método 2: Buscando imágenes en worksheets...');

            workbook.worksheets.forEach((worksheet, sheetIndex) => {
                try {
                    // Intentar obtener imágenes del worksheet
                    const sheetImages = worksheet.getImages ? worksheet.getImages() : [];
                    console.log(`Hoja ${sheetIndex + 1} ("${worksheet.name}"): ${sheetImages.length} imágenes`);

                    sheetImages.forEach((img, imgIndex) => {
                        try {
                            if (img.imageId && workbook.model.media[img.imageId - 1]) {
                                const media = workbook.model.media[img.imageId - 1];
                                if (media && media.buffer) {
                                    const uint8Array = new Uint8Array(media.buffer);
                                    const binary = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
                                    const base64 = btoa(binary);

                                    const extension = media.extension || 'png';
                                    const mimeType = `image/${extension}`;

                                    images.push({
                                        name: `Evidencia_${images.length + 1}.${extension}`,
                                        data: `data:${mimeType};base64,${base64}`
                                    });

                                    console.log(`✅ Imagen de hoja ${sheetIndex + 1} extraída`);
                                }
                            }
                        } catch (imgError) {
                            console.warn(`Error al procesar imagen ${imgIndex + 1} de hoja ${sheetIndex + 1}:`, imgError);
                        }
                    });
                } catch (sheetError) {
                    console.warn(`Error al procesar imágenes de hoja ${sheetIndex + 1}:`, sheetError);
                }
            });
        }

        console.log(`📊 Total de imágenes extraídas: ${images.length}`);

    } catch (error) {
        console.error('Error en extractAllImagesFromWorkbook:', error);
    }

    return images;
}

async function getEvidenceInfoFromTable(sheet) {
    console.log('📋 Leyendo información de evidencias de la tabla principal...');

    const evidenceInfo = [];

    try {
        // 1. ENCONTRAR LA FILA DE HEADERS
        let headerRow = null;
        let headerRowIndex = 1;

        for (let row = 1; row <= 10; row++) {
            const firstCell = sheet.getCell(row, 1).value;
            if (firstCell && firstCell.toString().toLowerCase().includes('ciclo')) {
                headerRow = sheet.getRow(row);
                headerRowIndex = row;
                break;
            }
        }

        if (!headerRow) {
            throw new Error('No se encontró la fila de headers');
        }

        // 2. ENCONTRAR ÍNDICES DE COLUMNAS
        const columnNames = [];
        for (let col = 1; col <= 20; col++) {
            const cellValue = headerRow.getCell(col).value;
            if (cellValue && cellValue.toString().trim()) {
                columnNames.push({
                    index: col,
                    name: cellValue.toString().trim()
                });
            }
        }

        const cicloIndex = findColumnIndex(columnNames, ['ciclo']);
        const escenarioIndex = findColumnIndex(columnNames, ['escenario', 'n° escenario']);
        const evidenciasIndex = findColumnIndex(columnNames, ['evidencias', 'evidencia']);

        console.log(`📍 Índices: Ciclo=${cicloIndex}, Escenario=${escenarioIndex}, Evidencias=${evidenciasIndex}`);
        console.log('📋 Columnas encontradas:', columnNames.map(c => c.name));

        if (!cicloIndex || !escenarioIndex || !evidenciasIndex) {
            console.warn('⚠️ No se encontraron todas las columnas, usando distribución simple');
            return getSimpleEvidenceDistribution();
        }

        // 3. LEER DATOS DE CASOS
        let currentRow = headerRowIndex + 1;

        while (currentRow <= sheet.rowCount) {
            const row = sheet.getRow(currentRow);

            const cicloValue = getCellValue(row, cicloIndex);
            const escenarioValue = getCellValue(row, escenarioIndex);
            const evidenciasValue = getCellValue(row, evidenciasIndex);

            // Si no hay ciclo, hemos llegado al final de los datos
            if (!cicloValue || cicloValue.trim() === '') {
                break;
            }

            // Si llegamos a las líneas amarillas de evidencias, parar
            if (cicloValue.toString().toUpperCase().includes('CICLO')) {
                break;
            }

            // Parsear cantidad de evidencias
            let evidenceCount = 0;
            if (evidenciasValue) {
                const evidenceText = evidenciasValue.toString().toLowerCase();

                if (evidenceText.includes('sin evidencias') || evidenceText.includes('0 archivos')) {
                    evidenceCount = 0;
                } else {
                    // Buscar números en el texto: "3 archivos" → 3
                    const numberMatch = evidenceText.match(/(\d+)/);
                    if (numberMatch) {
                        evidenceCount = parseInt(numberMatch[1]);
                    }
                }
            }

            // Solo agregar casos que tienen evidencias
            if (evidenceCount > 0) {
                evidenceInfo.push({
                    cycle: cicloValue.toString().trim(),
                    scenario: escenarioValue.toString().trim(),
                    evidenceCount: evidenceCount,
                    row: currentRow
                });

                console.log(`📋 Caso encontrado: Ciclo ${cicloValue}, Escenario ${escenarioValue}, Evidencias: ${evidenceCount}`);
            }

            currentRow++;
        }

        console.log(`✅ ${evidenceInfo.length} casos con evidencias encontrados en la tabla`);

    } catch (error) {
        console.error('Error al leer información de evidencias de la tabla:', error);
        // Fallback a distribución simple
        return getSimpleEvidenceDistribution();
    }

    return evidenceInfo;
}

async function extractAllImagesWithPositions(workbook) {
    const images = [];

    try {
        console.log('🔍 Extrayendo todas las imágenes del workbook...');

        if (workbook.model && workbook.model.media && workbook.model.media.length > 0) {
            console.log(`📸 Encontradas ${workbook.model.media.length} imágenes en workbook.model.media`);

            for (let i = 0; i < workbook.model.media.length; i++) {
                try {
                    const media = workbook.model.media[i];
                    if (media && media.buffer) {
                        const uint8Array = new Uint8Array(media.buffer);
                        const binary = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
                        const base64 = btoa(binary);

                        const extension = media.extension || 'png';
                        const mimeType = `image/${extension}`;

                        images.push({
                            name: `Evidencia_${i + 1}.${extension}`,
                            data: `data:${mimeType};base64,${base64}`,
                            originalIndex: i
                        });

                        console.log(`✅ Imagen ${i + 1} extraída: ${extension}`);
                    }
                } catch (imgError) {
                    console.warn(`⚠️ Error al procesar imagen ${i + 1}:`, imgError);
                }
            }
        }

        console.log(`📊 Total de imágenes extraídas: ${images.length}`);

    } catch (error) {
        console.error('Error en extractAllImagesWithPositions:', error);
    }

    return images;
}

function getSimpleEvidenceDistribution() {
    console.log('📋 Usando distribución simple predeterminada...');

    // Tu ejemplo específico
    return [
        { cycle: '1', scenario: '4', evidenceCount: 1 },
        { cycle: '1', scenario: '5', evidenceCount: 1 },
        { cycle: '1', scenario: '8', evidenceCount: 1 },
        { cycle: '3', scenario: '1', evidenceCount: 1 },
        { cycle: '4', scenario: '4', evidenceCount: 1 }
    ];
}

// ===============================================
// SISTEMA DRAG & DROP PARA CASOS DE PRUEBA
// ===============================================

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

// ===============================================
// 1. INICIALIZACIÓN Y VALIDACIONES
// ===============================================

// Función para verificar si se puede hacer drag (sin filtros)
function canPerformDrag() {
    // Verificar si hay filtros activos
    const searchInput = document.getElementById('searchInput').value.trim();
    const testerFilter = document.getElementById('testerFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;
    const showHiddenToggle = document.getElementById('showHiddenToggle');
    const showHidden = showHiddenToggle ? showHiddenToggle.checked : false;

    const hasActiveFilters = searchInput || testerFilter || statusFilter ||
        dateFromFilter || dateToFilter || showHidden;

    if (hasActiveFilters) {
        showDragRestrictionMessage();
        return false;
    }

    // Verificar que estemos viendo todos los casos
    if (filteredCases.length !== testCases.length) {
        showDragRestrictionMessage();
        return false;
    }

    return true;
}

// Mostrar mensaje sutil de restricción
function showDragRestrictionMessage() {
    // Crear notificación sutil
    const notification = document.createElement('div');
    notification.className = 'drag-restriction-notification';
    notification.innerHTML = `
        <div class="drag-restriction-content">
            <span class="drag-restriction-icon">🚫</span>
            <span class="drag-restriction-text">Reordenamiento deshabilitado - Quita los filtros para poder reordenar escenarios</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ===============================================
// 2. DETECCIÓN DE BLOQUES DE ESCENARIOS
// ===============================================

// Obtener todos los casos que pertenecen al mismo escenario
function getScenarioBlock(caseId) {
    const targetCase = testCases.find(tc => tc.id === caseId);
    if (!targetCase) return [];

    const scenarioNumber = targetCase.scenarioNumber;

    // Obtener todos los casos con el mismo número de escenario
    const scenarioBlock = testCases.filter(tc => tc.scenarioNumber === scenarioNumber);

    // Ordenar por ciclo para mantener orden lógico
    scenarioBlock.sort((a, b) => {
        const cycleA = parseInt(a.cycleNumber) || 0;
        const cycleB = parseInt(b.cycleNumber) || 0;
        return cycleA - cycleB;
    });

    return scenarioBlock;
}

// ===============================================
// 3. EVENTOS DE DRAG & DROP
// ===============================================

// Iniciar drag
window.startScenarioDrag = function (caseId, event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('🚀 Iniciando drag para caso ID:', caseId);

    // Verificar si se puede hacer drag
    if (!canPerformDrag()) {
        console.log('❌ Drag no permitido (hay filtros activos)');
        return;
    }

    // Guardar estado original para undo
    dragState.originalOrder = [...testCases];

    // Obtener bloque de escenario
    const scenarioBlock = getScenarioBlock(caseId);
    if (scenarioBlock.length === 0) {
        console.log('❌ No se encontró bloque de escenario');
        return;
    }

    console.log('📋 Bloque encontrado:', scenarioBlock.map(tc => `${tc.cycleNumber}-${tc.scenarioNumber}`));

    // Configurar estado de drag
    dragState.isDragging = true;
    dragState.draggedScenarioNumber = scenarioBlock[0].scenarioNumber;
    dragState.draggedScenarioBlock = scenarioBlock;
    dragState.draggedElement = event.target.closest('tr');

    // Crear elemento fantasma
    createDragGhost(scenarioBlock);

    // Aplicar estilos de drag a todo el bloque
    highlightScenarioBlock(scenarioBlock, true);

    // Agregar event listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Cambiar cursor
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    console.log(`✅ Drag iniciado para Escenario ${dragState.draggedScenarioNumber} (${scenarioBlock.length} ciclo${scenarioBlock.length > 1 ? 's' : ''})`);
};

// Manejar movimiento del drag
function handleDragMove(event) {
    if (!dragState.isDragging) return;

    // Actualizar posición del ghost
    updateGhostPosition(event);

    // 🆕 DETECTAR Y MANEJAR AUTO-SCROLL
    const scrollInfo = detectAutoScrollZone(event);

    if (scrollInfo) {
        // Iniciar o actualizar auto-scroll
        startAutoScroll(scrollInfo);

        // Agregar clase visual al contenedor
        const container = document.querySelector('.table-container');
        if (container) {
            container.classList.add('auto-scrolling', `auto-scroll-${scrollInfo.direction}`);
        }
    } else {
        // Detener auto-scroll si no estamos en zona
        stopAutoScroll();

        // Remover clases visuales
        const container = document.querySelector('.table-container');
        if (container) {
            container.classList.remove('auto-scrolling', 'auto-scroll-up', 'auto-scroll-down');
        }
    }

    // Detectar zona de drop (con throttling para performance)
    if (!dragState.lastDropCheck || Date.now() - dragState.lastDropCheck > 100) {
        const dropTarget = findDropTarget(event);
        updateDropZones(dropTarget);
        dragState.lastDropCheck = Date.now();
        dragState.currentDropTarget = dropTarget;
    }
}


// Finalizar drag
function handleDragEnd(event) {
    console.log('🏁 Finalizando drag...');

    if (!dragState.isDragging) {
        console.log('❌ No hay drag activo');
        return;
    }

    // 🆕 DETENER AUTO-SCROLL
    stopAutoScroll();

    // Remover clases visuales de auto-scroll
    const container = document.querySelector('.table-container');
    if (container) {
        container.classList.remove('auto-scrolling', 'auto-scroll-up', 'auto-scroll-down');
    }

    // Usar el dropTarget que ya teníamos calculado, o calcularlo una vez más
    let dropTarget = dragState.currentDropTarget || findDropTarget(event);
    let moveSuccessful = false;

    console.log('🎯 Drop target final:', dropTarget ? `Escenario ${dropTarget.scenarioNumber}` : 'null');

    if (dropTarget) {
        console.log('✅ Objetivo válido encontrado, ejecutando movimiento...');

        // Realizar el movimiento
        moveSuccessful = performScenarioMove(dropTarget);

        if (moveSuccessful) {
            // Actualizar almacenamiento y vista
            saveToStorage();
            renderTestCases();
            updateStats();

            // Mostrar mensaje de éxito
            showDragSuccessMessage();

            console.log('🎉 Drag & Drop completado exitosamente');
        } else {
            console.log('❌ Fallo en el movimiento, restaurando estado original');
            alert('❌ Error al mover el escenario. Se restauró el estado original.');
        }
    } else {
        console.log('❌ No se encontró objetivo válido para el drop');
        showDropHelpMessage();
    }

    // Limpiar estado de drag
    cleanupDragState();

    // Limpiar referencias temporales
    dragState.currentDropTarget = null;
    dragState.lastDropCheck = null;

    // Remover event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    // Restaurar cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    console.log('🧹 Limpieza de drag completada');
}

// ===============================================
// NUEVO MENSAJE DE AYUDA
// ===============================================

// Mostrar mensaje de ayuda cuando el drop falla
function showDropHelpMessage() {
    const notification = document.createElement('div');
    notification.className = 'drag-help-notification';
    notification.innerHTML = `
        <div class="drag-help-content">
            <span class="drag-help-icon">💡</span>
            <span class="drag-help-text">Suelta sobre otro escenario para reordenar</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 2000);
}

// ===============================================
// LEMENTOS VISUALES DE DRAG
// ===============================================

// Crear elemento fantasma
function createDragGhost(scenarioBlock) {
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `
        <div class="drag-ghost-content">
            <span class="drag-ghost-icon">📋</span>
            <span class="drag-ghost-text">Moviendo Escenario ${scenarioBlock[0].scenarioNumber} (${scenarioBlock.length} ciclo${scenarioBlock.length > 1 ? 's' : ''})</span>
        </div>
    `;

    document.body.appendChild(ghost);
    dragState.ghostElement = ghost;
}

// Actualizar posición del ghost
function updateGhostPosition(event) {
    if (!dragState.ghostElement) return;

    const ghost = dragState.ghostElement;
    ghost.style.left = (event.clientX + 10) + 'px';
    ghost.style.top = (event.clientY + 10) + 'px';
}

// Resaltar bloque de escenario
function highlightScenarioBlock(scenarioBlock, highlight) {
    scenarioBlock.forEach(tc => {
        const row = document.querySelector(`tr[data-case-id="${tc.id}"]`);
        if (row) {
            if (highlight) {
                row.classList.add('scenario-block-dragging');
            } else {
                row.classList.remove('scenario-block-dragging');
            }
        }
    });
}

// ===============================================
// 5. DETECCIÓN DE ZONAS DE DROP
// ===============================================

// Encontrar objetivo de drop válido
function findDropTarget(event) {
    console.log(`🔍 Buscando drop target en coordenadas: ${event.clientX}, ${event.clientY}`);

    // Ocultar temporalmente el ghost para que no interfiera
    let ghostElement = dragState.ghostElement;
    if (ghostElement) {
        ghostElement.style.display = 'none';
    }

    try {
        // 1. MÚLTIPLES ESTRATEGIAS DE DETECCIÓN
        let elementBelow = null;
        let strategies = [
            () => document.elementFromPoint(event.clientX, event.clientY),
            () => document.elementFromPoint(event.clientX, event.clientY - 10),
            () => document.elementFromPoint(event.clientX, event.clientY + 10),
            () => document.elementFromPoint(event.clientX - 20, event.clientY),
        ];

        for (let i = 0; i < strategies.length; i++) {
            elementBelow = strategies[i]();
            console.log(`🔍 Estrategia ${i + 1}: ${elementBelow ? elementBelow.tagName + '.' + (elementBelow.className || 'no-class') : 'null'}`);

            if (elementBelow) {
                break;
            }
        }

        if (!elementBelow) {
            console.log('❌ No se encontró elemento en ninguna estrategia');
            return null;
        }

        // 2. BUSCAR LA FILA OBJETIVO
        let targetRow = null;

        let searchElements = [
            elementBelow,
            elementBelow.parentElement,
            elementBelow.parentElement?.parentElement,
            elementBelow.parentElement?.parentElement?.parentElement
        ].filter(Boolean);

        for (let element of searchElements) {
            targetRow = element.closest('tr[data-case-id]');
            if (targetRow) {
                console.log(`✅ Fila encontrada en nivel: ${element.tagName}`);
                break;
            }
        }

        if (!targetRow) {
            console.log('❌ No se encontró fila tr[data-case-id]');

            // ESTRATEGIA ALTERNATIVA: Buscar TODAS las filas y ver cuál está más cerca
            const allRows = document.querySelectorAll('tr[data-case-id]');
            let closestRow = null;
            let minDistance = Infinity;

            allRows.forEach(row => {
                const rect = row.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const distance = Math.abs(event.clientY - centerY);

                if (distance < minDistance && distance < 50) {
                    minDistance = distance;
                    closestRow = row;
                }
            });

            if (closestRow) {
                console.log(`✅ Fila más cercana encontrada (distancia: ${minDistance}px)`);
                targetRow = closestRow;
            } else {
                console.log('❌ No hay filas suficientemente cerca');
                return null;
            }
        }

        // 3. EXTRAER DATOS DEL CASO - 🔧 AQUÍ ESTABA EL BUG
        const caseIdString = targetRow.getAttribute('data-case-id');
        console.log(`🔍 Case ID string extraído: "${caseIdString}"`);

        // ✅ USAR parseFloat() en lugar de parseInt() para preservar decimales
        const caseId = parseFloat(caseIdString);
        console.log(`🔍 Case ID parseado: ${caseId}`);

        // VERIFICACIÓN ADICIONAL: Comparar string vs number
        console.log(`🔍 Comparación: "${caseIdString}" -> ${caseId}`);

        const targetCase = testCases.find(tc => tc.id === caseId);
        if (!targetCase) {
            console.log(`❌ No se encontró caso con ID ${caseId} en testCases`);

            // DEBUG ADICIONAL: Mostrar todos los IDs disponibles
            console.log('📋 IDs disponibles en testCases:');
            testCases.slice(0, 5).forEach((tc, index) => {
                console.log(`  ${index}: ${tc.id} (Escenario ${tc.scenarioNumber})`);
            });

            return null;
        }

        console.log(`🎯 Caso objetivo: Ciclo ${targetCase.cycleNumber}, Escenario ${targetCase.scenarioNumber}`);

        // 4. VALIDAR QUE NO ES EL MISMO ESCENARIO
        if (targetCase.scenarioNumber === dragState.draggedScenarioNumber) {
            console.log(`❌ Es el mismo escenario (${targetCase.scenarioNumber}), drop no válido`);
            return null;
        }

        console.log(`✅ Drop target válido: Escenario ${targetCase.scenarioNumber}`);

        return {
            caseId: caseId,
            scenarioNumber: targetCase.scenarioNumber,
            element: targetRow,
            targetCase: targetCase
        };

    } finally {
        // Restaurar ghost element
        if (ghostElement) {
            ghostElement.style.display = 'block';
        }
    }
}

// Actualizar zonas de drop
function updateDropZones(dropTarget) {
    console.log('🎨 Actualizando zonas de drop...');

    // Limpiar zonas anteriores
    document.querySelectorAll('.drop-zone-valid, .drop-zone-invalid, .drop-zone-highlight').forEach(el => {
        el.classList.remove('drop-zone-valid', 'drop-zone-invalid', 'drop-zone-highlight');
    });

    if (dropTarget) {
        console.log(`🎯 Marcando zona de drop para Escenario ${dropTarget.scenarioNumber}`);

        // Encontrar TODO el bloque del escenario objetivo
        const targetScenarioBlock = getScenarioBlock(dropTarget.caseId);

        // Marcar todo el bloque como zona de drop
        targetScenarioBlock.forEach(tc => {
            const row = document.querySelector(`tr[data-case-id="${tc.id}"]`);
            if (row) {
                row.classList.add('drop-zone-highlight');
            }
        });

        // Marcar específicamente la última fila como zona de drop válida
        const lastCaseInBlock = targetScenarioBlock[targetScenarioBlock.length - 1];
        const lastRow = document.querySelector(`tr[data-case-id="${lastCaseInBlock.id}"]`);

        if (lastRow) {
            lastRow.classList.add('drop-zone-valid');
            dragState.dropZoneElement = lastRow;
            console.log(`✅ Zona de drop válida marcada en fila ${lastCaseInBlock.id}`);
        }
    } else {
        console.log('❌ No hay drop target válido');
    }
}

// ===============================================
// 6. LÓGICA DE MOVIMIENTO
// ===============================================

// Realizar movimiento de escenario
function performScenarioMove(dropTarget) {
    console.log('🔄 Iniciando movimiento de escenario...');
    console.log('- Escenario arrastrado:', dragState.draggedScenarioNumber);
    console.log('- Escenario objetivo:', dropTarget.scenarioNumber);

    try {
        // 1. OBTENER BLOQUES
        const draggedBlock = [...dragState.draggedScenarioBlock];
        const targetScenarioBlock = getScenarioBlock(dropTarget.caseId);

        console.log('- Bloque arrastrado:', draggedBlock.map(tc => `${tc.cycleNumber}-${tc.scenarioNumber}`));
        console.log('- Bloque objetivo:', targetScenarioBlock.map(tc => `${tc.cycleNumber}-${tc.scenarioNumber}`));

        // 2. ENCONTRAR POSICIÓN DE INSERCIÓN
        // Buscar el último caso del escenario objetivo en el array principal
        const lastCaseInTargetBlock = targetScenarioBlock[targetScenarioBlock.length - 1];
        const targetIndex = testCases.findIndex(tc => tc.id === lastCaseInTargetBlock.id);

        if (targetIndex === -1) {
            throw new Error('No se encontró la posición objetivo');
        }

        console.log('- Posición de inserción:', targetIndex + 1);

        // 3. CREAR NUEVO ARRAY SIN EL BLOQUE ARRASTRADO
        const newTestCases = testCases.filter(tc =>
            !draggedBlock.some(draggedCase => draggedCase.id === tc.id)
        );

        console.log('- Array sin bloque arrastrado:', newTestCases.length, 'casos');

        // 4. RECALCULAR POSICIÓN DESPUÉS DE LA REMOCIÓN
        const adjustedTargetIndex = newTestCases.findIndex(tc => tc.id === lastCaseInTargetBlock.id);

        if (adjustedTargetIndex === -1) {
            throw new Error('No se encontró la posición ajustada');
        }

        const insertPosition = adjustedTargetIndex + 1;
        console.log('- Posición ajustada de inserción:', insertPosition);

        // 5. INSERTAR BLOQUE EN LA NUEVA POSICIÓN
        newTestCases.splice(insertPosition, 0, ...draggedBlock);

        console.log('- Array final:', newTestCases.length, 'casos');

        // 6. ACTUALIZAR ARRAY GLOBAL
        testCases = newTestCases;

        // 7. ACTUALIZAR CASOS FILTRADOS TAMBIÉN
        filteredCases = [...testCases];

        console.log('✅ Movimiento completado exitosamente');

        return true;

    } catch (error) {
        console.error('❌ Error en performScenarioMove:', error);

        // Restaurar estado original en caso de error
        testCases = [...dragState.originalOrder];
        filteredCases = [...testCases];

        return false;
    }
}

// ===============================================
// 7. SISTEMA DE UNDO
// ===============================================

// Variable para el estado de undo
let undoAvailable = false;

// Función de undo
window.undoLastDragMove = function () {
    if (!undoAvailable || !dragState.originalOrder.length) {
        console.log('❌ No hay movimiento para deshacer');
        return;
    }

    // Restaurar orden original
    testCases = [...dragState.originalOrder];

    // Limpiar estado de undo
    undoAvailable = false;
    dragState.originalOrder = [];

    // Actualizar vista
    saveToStorage();
    renderTestCases();

    // Mostrar mensaje
    showUndoMessage();

    console.log('↩️ Movimiento deshecho');
};

// Event listener para Ctrl+Z
document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && undoAvailable) {
        event.preventDefault();
        undoLastDragMove();
    }
});

// ===============================================
// 8. MENSAJES Y FEEDBACK
// ===============================================

// Mensaje de éxito
function showDragSuccessMessage() {
    undoAvailable = true;

    const notification = document.createElement('div');
    notification.className = 'drag-success-notification';
    notification.innerHTML = `
        <div class="drag-success-content">
            <span class="drag-success-icon">✅</span>
            <span class="drag-success-text">Escenario ${dragState.draggedScenarioNumber} reordenado correctamente</span>
             
        </div>
    `;
            //<button class="drag-undo-btn" onclick="undoLastDragMove()">↩️ Deshacer (Ctrl+Z)</button>
    document.body.appendChild(notification);

    // Remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Mensaje de undo
function showUndoMessage() {
    const notification = document.createElement('div');
    notification.className = 'drag-undo-notification';
    notification.innerHTML = `
        <div class="drag-undo-content">
            <span class="drag-undo-icon">↩️</span>
            <span class="drag-undo-text">Movimiento deshecho</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 2000);
}

// ===============================================
// 9. LIMPIEZA DE ESTADO
// ===============================================

// Limpiar todo el estado de drag
function cleanupDragState() {
    // Remover estilos de bloque
    if (dragState.draggedScenarioBlock.length > 0) {
        highlightScenarioBlock(dragState.draggedScenarioBlock, false);
    }

    // Remover zonas de drop
    document.querySelectorAll('.drop-zone-valid, .drop-zone-invalid').forEach(el => {
        el.classList.remove('drop-zone-valid', 'drop-zone-invalid');
    });

    // Remover ghost
    if (dragState.ghostElement) {
        dragState.ghostElement.remove();
        dragState.ghostElement = null;
    }

    // Resetear estado
    dragState.isDragging = false;
    dragState.draggedScenarioNumber = null;
    dragState.draggedScenarioBlock = [];
    dragState.draggedElement = null;
    dragState.dropZoneElement = null;
}

// ===============================================
// INTEGRACIÓN Y MEJORAS DEL SISTEMA DRAG & DROP
// ===============================================

// ===============================================
// 1. ACTUALIZACIÓN DE ESTILOS SEGÚN ESTADO DE FILTROS
// ===============================================

// Función para actualizar el estado visual de los handles según filtros
function updateDragHandlesState() {
    const canDrag = canPerformDrag();
    const handles = document.querySelectorAll('.drag-handle');

    handles.forEach(handle => {
        if (canDrag) {
            handle.classList.remove('drag-handle-disabled');
            handle.title = handle.title.replace(' (Deshabilitado - Quita los filtros)', '');
        } else {
            handle.classList.add('drag-handle-disabled');
            if (!handle.title.includes('Deshabilitado')) {
                handle.title += ' (Deshabilitado - Quita los filtros)';
            }
        }
    });
}

// ===============================================
// 2. MEJORA DE LA FUNCIÓN applyFilters
// ===============================================

// Extender la función applyFilters existente para actualizar handles
const originalApplyFilters = window.applyFilters;
window.applyFilters = function () {
    // Llamar a la función original
    originalApplyFilters();

    // Actualizar estado de handles de drag
    setTimeout(() => {
        updateDragHandlesState();
    }, 100);
}

// ===============================================
// 3. FUNCIÓN PARA MOSTRAR ESTADÍSTICAS DE DRAG
// ===============================================

// Función para mostrar información sobre reordenamiento
window.showDragInfo = function () {
    const scenarioGroups = {};

    // Agrupar casos por escenario
    testCases.forEach(tc => {
        const scenario = tc.scenarioNumber;
        if (!scenarioGroups[scenario]) {
            scenarioGroups[scenario] = [];
        }
        scenarioGroups[scenario].push(tc);
    });

    const scenarios = Object.keys(scenarioGroups).sort((a, b) => parseInt(a) - parseInt(b));
    let infoText = `📊 INFORMACIÓN DE REORDENAMIENTO:\n\n`;
    infoText += `Total de escenarios únicos: ${scenarios.length}\n`;
    infoText += `Total de casos de prueba: ${testCases.length}\n\n`;

    infoText += `🔢 DISTRIBUCIÓN POR ESCENARIO:\n`;
    scenarios.forEach(scenario => {
        const cases = scenarioGroups[scenario];
        const cycles = cases.map(c => c.cycleNumber).join(', ');
        infoText += `Escenario ${scenario}: ${cases.length} ciclo${cases.length > 1 ? 's' : ''} (${cycles})\n`;
    });

    infoText += `\n💡 CONSEJOS:\n`;
    infoText += `• Arrastra cualquier ciclo de un escenario para mover todo el bloque\n`;
    infoText += `• El reordenamiento no afecta la numeración original\n`;
    infoText += `• Usa Ctrl+Z para deshacer el último movimiento\n`;
    infoText += `• Quita los filtros para poder reordenar\n`;

    alert(infoText);
}

// ===============================================
// 4. BOTÓN DE RENUMERACIÓN INTELIGENTE
// ===============================================

// Función para renumerar solo Ciclo 1 secuencialmente
window.renumberCycle1 = function () {
    console.log('🔢 Iniciando renumeración inteligente...');

    // 1. OBTENER SOLO LOS CASOS DEL CICLO 1 para crear el mapeo
    const cycle1Cases = testCases.filter(tc => tc.cycleNumber === '1')
        .sort((a, b) => testCases.indexOf(a) - testCases.indexOf(b));

    if (cycle1Cases.length === 0) {
        alert('❌ No hay casos del Ciclo 1 para renumerar');
        return;
    }

    console.log('📋 Casos del Ciclo 1 encontrados:', cycle1Cases.length);
    cycle1Cases.forEach((tc, index) => {
        console.log(`  ${index}: Escenario ${tc.scenarioNumber} (posición actual en array)`);
    });

    // 2. CREAR MAPEO DE ESCENARIOS VIEJOS → NUEVOS
    const scenarioMapping = {};
    cycle1Cases.forEach((tc, index) => {
        const oldScenarioNumber = tc.scenarioNumber;
        const newScenarioNumber = (index + 1).toString();
        scenarioMapping[oldScenarioNumber] = newScenarioNumber;
    });

    console.log('🗂️ Mapeo de escenarios creado:');
    Object.keys(scenarioMapping).forEach(oldNum => {
        console.log(`  Escenario ${oldNum} → Escenario ${scenarioMapping[oldNum]}`);
    });

    // 3. VERIFICAR SI YA ESTÁ EN ORDEN SECUENCIAL
    const isAlreadySequential = cycle1Cases.every((tc, index) =>
        parseInt(tc.scenarioNumber) === (index + 1)
    );

    if (isAlreadySequential) {
        alert('✅ El Ciclo 1 ya está numerado secuencialmente (1, 2, 3...)');
        return;
    }

    // 4. MOSTRAR PREVIEW DEL CAMBIO
    let changePreview = '🔢 CAMBIOS QUE SE APLICARÁN:\n\n';
    changePreview += '📋 Ciclo 1:\n';
    cycle1Cases.forEach((tc, index) => {
        const oldNum = tc.scenarioNumber;
        const newNum = (index + 1).toString();
        if (oldNum !== newNum) {
            changePreview += `  Escenario ${oldNum} → ${newNum}\n`;
        }
    });

    // Verificar qué otros ciclos se verán afectados
    const affectedOtherCycles = testCases.filter(tc =>
        tc.cycleNumber !== '1' && scenarioMapping[tc.scenarioNumber]
    );

    if (affectedOtherCycles.length > 0) {
        changePreview += '\n📋 Otros ciclos afectados:\n';
        affectedOtherCycles.forEach(tc => {
            const oldNum = tc.scenarioNumber;
            const newNum = scenarioMapping[oldNum];
            changePreview += `  Ciclo ${tc.cycleNumber}, Escenario ${oldNum} → ${newNum}\n`;
        });
    }

    changePreview += `\n⚠️ Esta acción afectará ${cycle1Cases.length + affectedOtherCycles.length} casos de prueba.`;
    changePreview += `\n¿Continuar con la renumeración?`;

    if (!confirm(changePreview)) return;

    // 5. APLICAR LA RENUMERACIÓN A TODOS LOS CASOS
    let casesModified = 0;

    testCases.forEach(tc => {
        const oldScenarioNumber = tc.scenarioNumber;
        const newScenarioNumber = scenarioMapping[oldScenarioNumber];

        if (newScenarioNumber && newScenarioNumber !== oldScenarioNumber) {
            console.log(`🔄 Renumerando: Ciclo ${tc.cycleNumber}, Escenario ${oldScenarioNumber} → ${newScenarioNumber}`);
            tc.scenarioNumber = newScenarioNumber;
            casesModified++;
        }
    });

    // 6. ACTUALIZAR VISTA Y GUARDAR
    saveToStorage();
    renderTestCases();

    // 7. MENSAJE DE ÉXITO
    const successMessage = `✅ RENUMERACIÓN COMPLETADA\n\n` +
        `📊 ${casesModified} casos renumerados\n` +
        `🎯 Ciclo 1: ${cycle1Cases.length} casos (1, 2, 3...)\n` +
        `📋 Otros ciclos: ${affectedOtherCycles.length} casos actualizados\n\n` +
        `Todos los escenarios ahora están numerados secuencialmente.`;

    alert(successMessage);

    console.log(`✅ Renumeración completada: ${casesModified} casos modificados`);
}

// ===============================================
// 5. TOOLBAR DE REORDENAMIENTO
// ===============================================

// Función para crear/actualizar toolbar de reordenamiento
function createReorderingToolbar() {
    // Verificar si ya existe
    let toolbar = document.getElementById('reorderingToolbar');

    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = 'reorderingToolbar';
        toolbar.className = 'reordering-toolbar';
        toolbar.innerHTML = `
            <div class="reordering-toolbar-content">
                <div class="reordering-info">
                    <span class="reordering-icon">⋮⋮</span>
                    <span class="reordering-text">Reordenamiento de Escenarios</span>
                </div>
                <div class="reordering-actions">
                    <button class="btn btn-info btn-small" onclick="showDragInfo()" 
                            title="Información sobre reordenamiento">
                        ℹ️ Info
                    </button>
                    <button class="btn btn-warning btn-small" onclick="renumberCycle1()" 
                            title="Renumerar Ciclo 1 secuencialmente">
                        🔢 Renumerar Ciclos y Escenarios
                    </button>
                </div>
            </div>
        `;

        // Insertar después de los filtros
        const filters = document.querySelector('.filters');
        if (filters && filters.nextSibling) {
            filters.parentNode.insertBefore(toolbar, filters.nextSibling);
        }
    }

    return toolbar;
}

// ===============================================
// INICIALIZACIÓN DE INTEGRACIÓN
// ===============================================

// Función de inicialización completa
function initializeDragDropIntegration() {
    // Crear toolbar de reordenamiento
    createReorderingToolbar();

    // Actualizar estado inicial de handles
    setTimeout(() => {
        updateDragHandlesState();
    }, 500);

    console.log('🔧 Integración de Drag & Drop inicializada');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initializeDragDropIntegration, 1000);
});

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎯 Sistema de Drag & Drop para escenarios inicializado');

    // Asegurar que el sistema esté limpio
    cleanupDragState();
    undoAvailable = false;
});

console.log('📋 Sistema de Drag & Drop cargado correctamente');


// ===============================================
// AUTO-SCROLL DURANTE DRAG & DROP
// ===============================================

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
// 1. FUNCIÓN PARA DETECTAR ZONA DE AUTO-SCROLL
// ===============================================

// Detectar si el mouse está en zona de auto-scroll
function detectAutoScrollZone(event) {
    if (!dragState.isDragging) return null;

    // Obtener contenedor de la tabla
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return null;

    const rect = tableContainer.getBoundingClientRect();
    const mouseY = event.clientY;

    // Calcular posiciones de las zonas de auto-scroll
    const topZone = rect.top + autoScrollState.zones.top;
    const bottomZone = rect.bottom - autoScrollState.zones.bottom;

    // Verificar en qué zona está el mouse
    if (mouseY < topZone && mouseY > rect.top) {
        // Zona superior - scroll hacia arriba
        const distance = topZone - mouseY;
        const speed = Math.min(distance / autoScrollState.zones.top, 1); // 0-1
        return {
            direction: 'up',
            speed: speed * 10 + 2, // Velocidad entre 2-12 pixels por frame
            zone: 'top'
        };
    } else if (mouseY > bottomZone && mouseY < rect.bottom) {
        // Zona inferior - scroll hacia abajo
        const distance = mouseY - bottomZone;
        const speed = Math.min(distance / autoScrollState.zones.bottom, 1); // 0-1
        return {
            direction: 'down',
            speed: speed * 10 + 2, // Velocidad entre 2-12 pixels por frame
            zone: 'bottom'
        };
    }

    return null; // No está en ninguna zona de auto-scroll
}

// ===============================================
// 2. FUNCIÓN PARA INICIAR AUTO-SCROLL
// ===============================================

// Iniciar auto-scroll en la dirección especificada
function startAutoScroll(scrollInfo) {
    // Si ya hay auto-scroll activo con la misma dirección, solo actualizar velocidad
    if (autoScrollState.isActive && autoScrollState.direction === scrollInfo.direction) {
        autoScrollState.speed = scrollInfo.speed;
        return;
    }

    // Detener auto-scroll anterior si existe
    stopAutoScroll();

    // Configurar nuevo auto-scroll
    autoScrollState.isActive = true;
    autoScrollState.direction = scrollInfo.direction;
    autoScrollState.speed = scrollInfo.speed;
    autoScrollState.container = document.querySelector('.table-container');

    if (!autoScrollState.container) {
        console.warn('❌ No se encontró contenedor de tabla para auto-scroll');
        return;
    }

    console.log(`🔄 Iniciando auto-scroll ${scrollInfo.direction} a velocidad ${scrollInfo.speed.toFixed(1)}`);

    // Iniciar intervalo de scroll
    autoScrollState.interval = setInterval(() => {
        performAutoScroll();
    }, 16); // ~60 FPS para scroll suave
}

// ===============================================
// 3. FUNCIÓN PARA EJECUTAR AUTO-SCROLL
// ===============================================

// Ejecutar un frame de auto-scroll
function performAutoScroll() {
    if (!autoScrollState.isActive || !autoScrollState.container) {
        stopAutoScroll();
        return;
    }

    const container = autoScrollState.container;
    const currentScrollTop = container.scrollTop;
    const maxScrollTop = container.scrollHeight - container.clientHeight;

    // Calcular nueva posición de scroll
    let newScrollTop = currentScrollTop;

    if (autoScrollState.direction === 'up') {
        newScrollTop = Math.max(0, currentScrollTop - autoScrollState.speed);
    } else if (autoScrollState.direction === 'down') {
        newScrollTop = Math.min(maxScrollTop, currentScrollTop + autoScrollState.speed);
    }

    // Aplicar scroll si hay cambio
    if (newScrollTop !== currentScrollTop) {
        container.scrollTop = newScrollTop;

        // Debug ocasional (cada 30 frames aprox)
        if (Math.random() < 0.05) {
            console.log(`📜 Auto-scroll ${autoScrollState.direction}: ${currentScrollTop} → ${newScrollTop}`);
        }
    } else {
        // Si llegamos al límite, detener auto-scroll
        if ((autoScrollState.direction === 'up' && newScrollTop === 0) ||
            (autoScrollState.direction === 'down' && newScrollTop === maxScrollTop)) {
            console.log(`🛑 Auto-scroll detenido: llegó al límite ${autoScrollState.direction}`);
            stopAutoScroll();
        }
    }
}

// ===============================================
// 4. FUNCIÓN PARA DETENER AUTO-SCROLL
// ===============================================

// Detener auto-scroll
function stopAutoScroll() {
    if (autoScrollState.interval) {
        clearInterval(autoScrollState.interval);
        autoScrollState.interval = null;
    }

    if (autoScrollState.isActive) {
        console.log(`🛑 Auto-scroll ${autoScrollState.direction} detenido`);
    }

    autoScrollState.isActive = false;
    autoScrollState.direction = null;
    autoScrollState.speed = 0;
    autoScrollState.container = null;
}

