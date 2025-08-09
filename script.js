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
        saveToStorage();
        renderTestCases();
    }
}

// Funcion para mover las filas
window.moveTestCaseUp = function (id) {
    const idx = testCases.findIndex(tc => tc.id === id);
    if (idx > 0) {
        [testCases[idx - 1], testCases[idx]] = [testCases[idx], testCases[idx - 1]];
        saveToStorage();
        // Mostrar todos los casos después de mover
        filteredCases = [...testCases];
        renderTestCases();
    }
}

window.moveTestCaseDown = function (id) {
    const idx = testCases.findIndex(tc => tc.id === id);
    if (idx < testCases.length - 1) {
        [testCases[idx], testCases[idx + 1]] = [testCases[idx + 1], testCases[idx]];
        saveToStorage();
        // Mostrar todos los casos después de mover
        filteredCases = [...testCases];
        renderTestCases();
    }
}

// Funcion iniciar cronometro en filas
function toggleRowTimer(id) {
    // Si el cronómetro ya está activo en este caso, lo detenemos
    if (activeTimerId === id) {
        stopRowTimer();
        return;
    }

    // Si hay otro cronómetro activo, lo detenemos primero
    if (activeTimerId !== null) {
        stopRowTimer();
    }

    // Iniciar cronómetro para este caso
    activeTimerId = id;
    const btn = document.getElementById(`timerBtn-${id}`);
    if (btn) btn.textContent = '⏹️';

    // Buscamos el caso y acumulamos el tiempo anterior
    const testCase = testCases.find(tc => tc.id === id);
    rowTimerAccum = parseFloat(testCase.testTime) || 0;
    rowTimerStartTime = Date.now();

    // Mostramos el tiempo corriendo en la celda (opcional)
    rowTimerInterval = setInterval(() => {
        const elapsed = (Date.now() - rowTimerStartTime) / 60000;
        const total = rowTimerAccum + elapsed;

        // Actualizar celda de tiempo
        const td = document.querySelector(`#testCasesBody tr td:nth-child(10):nth-of-type(1)[data-id="${id}"]`)
            || document.querySelector(`#testCasesBody tr[data-id="${id}"] td:nth-child(10)`);

        if (td) {
            const input = td.querySelector('input[type="number"]');
            if (input) input.value = Math.trunc(total);
        }
    }, 500);
}

// Funcion detener cronometro en filas
function stopRowTimer() {
    if (activeTimerId === null) return;
    clearInterval(rowTimerInterval);

    // Calculamos el tiempo total y lo sumamos (TRUNCAR minutos)
    const testCase = testCases.find(tc => tc.id === activeTimerId);
    if (testCase) {
        const elapsed = (Date.now() - rowTimerStartTime) / 60000;
        let total = (parseFloat(testCase.testTime) || 0) + elapsed;
        testCase.testTime = Math.trunc(total); // Truncar SIEMPRE hacia abajo
    }

    // Restaurar botón
    const btn = document.getElementById(`timerBtn-${activeTimerId}`);
    if (btn) btn.textContent = '⏱️';

    saveToStorage();
    renderTestCases();

    activeTimerId = null;
    rowTimerInterval = null;
    rowTimerStartTime = null;
    rowTimerAccum = 0;
}

// Funcion para actualizar tiempo manualmente
window.updateManualTime = function (id, value) {
    const testCase = testCases.find(tc => tc.id === id);
    if (testCase) {
        testCase.testTime = Math.max(0, Math.trunc(Number(value)) || 0);
        saveToStorage();
        renderTestCases();
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

    // Elimina cualquier th de variables anterior (entre Descripción y Resultado Esperado)
    while (theadRow.children[4] && theadRow.children[4].id === "varsThPlaceholder") {
        theadRow.removeChild(theadRow.children[4]);
    }

    // Elimina cualquier th de variables anterior
    while (theadRow.children[4] && theadRow.children[4].textContent !== "Resultado Esperado") {
        theadRow.removeChild(theadRow.children[4]);
    }

    // Inserta las columnas de variables configuradas
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
            testCase.status === 'NO' ? 'status-no' : '';

        const evidenceCount = testCase.evidence ? testCase.evidence.length : 0;
        const isSelected = selectedCases.has(testCase.id);

        return `
                    <tr class="${statusClass} ${isSelected ? 'row-selected' : ''}" data-case-id="${testCase.id}">
                        <td class="checkbox-column">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} 
                                   onchange="toggleCaseSelection(${testCase.id})" 
                                   title="Seleccionar caso">
                        </td>
                        <td class="col-ciclo">${testCase.cycleNumber || ''}</td>
                        <td class="col-escenario">${testCase.scenarioNumber || ''}</td>
                        <td class="col-descripcion">${testCase.description || ''}</td>
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
                            <button class="btn btn-info btn-small" onclick="toggleRowTimer(${testCase.id})" id="timerBtn-${testCase.id}" title="Cronometrar Tiempo">⏱️</button>
                            <button class="btn btn-small" onclick="moveTestCaseUp(${testCase.id})" ${filteredCases[0].id === testCase.id ? 'disabled' : ''} title="Subir registro">⬆️</button>
                            <button class="btn btn-small" onclick="moveTestCaseDown(${testCase.id})" ${filteredCases[filteredCases.length - 1].id === testCase.id ? 'disabled' : ''} title="Bajar registro">⬇️</button>
                        </td>
                    </tr>
                `;
    }).join('');

    // Actualizar checkbox "Select All"
    updateSelectAllCheckbox();

    // Reinicializar drag scroll
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

// Funciones de archivo
window.saveTestCases = function () {
    const data = JSON.stringify(testCases, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casos_prueba_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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
                    if (Array.isArray(data)) {
                        if (confirm('¿Deseas reemplazar todos los casos actuales o agregar los nuevos?\n\nOK = Reemplazar\nCancelar = Agregar')) {
                            testCases = data;
                        } else {
                            // Agregar nuevos casos con IDs únicos
                            const maxId = Math.max(...testCases.map(tc => tc.id), 0);
                            data.forEach((tc, index) => {
                                tc.id = maxId + index + 1;
                                testCases.push(tc);
                            });
                        }
                        saveToStorage();
                        renderTestCases();
                        updateStats();
                        updateFilters();
                        alert('Casos de prueba cargados exitosamente');
                    } else {
                        alert('Formato de archivo inválido');
                    }
                } catch (error) {
                    alert('Error al leer el archivo: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/*window.exportToExcel = function () {
    // Crear datos para exportar
    const headers = [
        'N° Escenario', 'Descripción', 'Variables Entrada',
        'Resultado Esperado', 'Resultado Obtenido', 'Fecha Ejecución', 'Observaciones',
        'N° Error/Bug', 'Tester', 'Tiempo (min)', 'Evidencias'
    ];

    const rows = filteredCases.map(tc => [
        tc.scenarioNumber || '',
        tc.description || '',
        tc.inputVariables && Array.isArray(tc.inputVariables) && tc.inputVariables.length > 0 ?
            tc.inputVariables.map(v => `${v.name}: ${v.value}`).join('; ') :
            'Sin variables',
        tc.obtainedResult || '',
        tc.status || '',
        tc.executionDate ? new Date(tc.executionDate).toLocaleString() : '',
        tc.observations || '',
        tc.errorNumber || '',
        tc.tester || '',
        tc.testTime || 0,
        tc.steps ? tc.steps.map(s => `${s.number}. ${s.description}`).join('; ') : '',
        tc.evidence ? `${tc.evidence.length} archivos` : 'Sin evidencias'
    ]);

    // Crear CSV
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `casos_prueba_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}*/

async function exportToExcel() {
    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
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
    //console.log(horaFormateada); // Ejemplo: 14:30:45
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = 'Casos de Prueba ' + horaFormateada + '.xlsx';
    //link.download = "Casos_de_Prueba.xlsx";
    link.click();
    URL.revokeObjectURL(url);
}

window.clearAllData = function () {
    if (confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los casos de prueba?\n\nEsta acción no se puede deshacer.')) {
        if (confirm('🚨 CONFIRMACIÓN FINAL: Se eliminarán todos los datos. ¿Continuar?')) {
            testCases = [];
            filteredCases = [];
            localStorage.removeItem('testCases');
            renderTestCases();
            updateStats();
            updateFilters();
            alert('✅ Todos los datos han sido eliminados');
        }
    }
}

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
            alert('✅ Caso duplicado y reordenado correctamente');
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

    const message = `⚠️ ¿Estás seguro de que deseas eliminar ${selectedCount} caso${selectedCount > 1 ? 's' : ''}?${summaryText}\n\n📌 IMPORTANTE: Solo se renumerarán los escenarios del Ciclo 1.\nLos ciclos 2+ mantendrán sus números originales.\n\nEsta acción no se puede deshacer.`;

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

    alert(`✅ ${selectedCount} caso${selectedCount > 1 ? 's' : ''} eliminado${selectedCount > 1 ? 's' : ''} correctamente\n\n🔢 Ciclo 1 renumerado secuencialmente\n📌 Ciclos 2+ mantuvieron sus números originales`);
}

// Función para deseleccionar todos los casos
window.clearSelection = function () {
    selectedCases.clear();
    updateSelectAllCheckbox();
    updateBulkToolbar();
    renderTestCases();
}