// ===============================================
// SCRIPT-CASES.JS - CRUD Casos + Filtros + Renderizado
// ===============================================

// ===============================================
// CONFIGURACIÓN DE VARIABLES DINÁMICAS
// ===============================================

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

// ===============================================
// FUNCIONES DE RENDERIZADO DE VARIABLES
// ===============================================

function renderFixedVariablesInputs(values = {}) {
    const container = document.getElementById('fixedVariablesContainer');
    container.innerHTML = inputVariableNames.map(varName => `
        <div class="step-item">
            <label style="min-width:100px;">${varName}:</label>
            <input type="text" name="var_${varName}" value="${values[varName] || ''}" style="flex:1;">
        </div>
    `).join('');
}

// ===============================================
// MODALES DE CASOS - ABRIR/CERRAR
// ===============================================

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
    document.getElementById('executionDate').value = formatDateForStorage(testCase.executionDate) || '';
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

// ===============================================
// GESTIÓN DE EVIDENCIAS
// ===============================================

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

// Función para ampliar las evidencias
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

// ===============================================
// DUPLICACIÓN DE CASOS - VERSIÓN COMPLETA
// ===============================================

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

// FUNCIÓN PRINCIPAL - duplicateTestCase MEJORADA
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

// ===============================================
// ELIMINACIÓN DE CASOS
// ===============================================

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

// ===============================================
// RENDERIZADO PRINCIPAL DE TABLA
// ===============================================

window.renderTestCases = function () {
    const tbody = document.getElementById('testCasesBody');
    const emptyState = document.getElementById('emptyState');

    // --- ACTUALIZAR THEAD DINÁMICAMENTE ---
    const theadRow = document.querySelector('#testCasesTable thead tr');

    // Verificar si ya existe la columna de checkbox
    if (!theadRow.querySelector('.checkbox-column')) {
        const checkboxTh = document.createElement('th');
        checkboxTh.className = 'checkbox-column';
        checkboxTh.innerHTML = `
            <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll()" title="Seleccionar todos">
        `;
        theadRow.insertBefore(checkboxTh, theadRow.firstChild);
    }

    // NUEVA COLUMNA DE DRAG HANDLE
    if (!theadRow.querySelector('.drag-handle-column')) {
        const dragHandleTh = document.createElement('th');
        dragHandleTh.className = 'drag-handle-column';
        dragHandleTh.innerHTML = `⋮⋮`;
        dragHandleTh.title = 'Reordenar escenarios';
        theadRow.insertBefore(dragHandleTh, theadRow.children[1]);
    }

    // Limpiar columnas de variables anteriores
    while (theadRow.children[5] && theadRow.children[5].id === "varsThPlaceholder") {
        theadRow.removeChild(theadRow.children[5]);
    }

    while (theadRow.children[5] && theadRow.children[5].textContent !== "Resultado Esperado") {
        theadRow.removeChild(theadRow.children[5]);
    }

    // Insertar columnas de variables configuradas
    inputVariableNames.forEach(varName => {
        const th = document.createElement('th');
        th.textContent = varName;
        th.style.minWidth = '150px';
        th.style.maxWidth = '150px';
        th.classList.add('variable-column');
        theadRow.insertBefore(th, theadRow.querySelector('.col-resultado-esperado'));
    });

    // 🆕 ACTUALIZAR HEADER DE TIEMPO simplificado
    const tiempoHeader = theadRow.querySelector('.col-tiempo');
    if (tiempoHeader) {
        tiempoHeader.textContent = 'Tiempo (hs)';
        tiempoHeader.style.minWidth = '100px';
        tiempoHeader.style.maxWidth = '100px';
        tiempoHeader.style.textAlign = 'center';
    }

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

        // 🆕 TIEMPO SIMPLIFICADO - Solo horas
        const timeHours = parseFloat(testCase.testTime) || 0;

        return `
            <tr class="${statusClass} ${isSelected ? 'row-selected' : ''}" data-case-id="${testCase.id}">
                <!-- Checkbox de selección -->
                <td class="checkbox-column">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} 
                           onchange="toggleCaseSelection(${testCase.id})" 
                           title="Seleccionar caso">
                </td>
                
                <!-- NUEVA COLUMNA DE DRAG HANDLE -->
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
               <td class="col-fecha-ejecucion">${formatDateForDisplay(testCase.executionDate) || ''}</td>
                <td class="col-observaciones">${testCase.observations || ''}</td>
                <td class="col-error">${testCase.errorNumber || ''}</td>
                <td class="col-tester">${testCase.tester || ''}</td>
                
                <!-- 🆕 COLUMNA DE TIEMPO SIMPLIFICADA -->
                <td class="col-tiempo" style="text-align: center;">
                    <input type="number" min="0" step="0.25" value="${timeHours.toFixed(2)}" 
                        style="width: 70px; text-align: center; font-weight: bold;" 
                        onchange="updateManualTime(${testCase.id}, this.value)"
                        title="Tiempo en horas (ej: 1.5 = 1 hora 30 min)">
                </td>
                
                <td class="col-evidencias">${evidenceCount > 0 ?
                `<a href="#" onclick="viewEvidence(${testCase.id}); return false;" style="color: #3498db; text-decoration: underline; cursor: pointer;">🔎 ${evidenceCount} archivos</a>` :
                'Sin evidencias'}</td>
                
                <td class="action-buttons">
                    <button class="btn btn-info btn-small" onclick="openEditModal(${testCase.id})" title="Editar Escenario">✏️</button>
                    <button class="btn btn-success btn-small" onclick="duplicateTestCase(${testCase.id})" title="Duplicar Escenario">📋</button>
                    <button class="btn btn-danger btn-small" onclick="deleteTestCase(${testCase.id})" title="Borrar Escenario">🗑️</button>
                    <button class="btn ${activeTimerId === testCase.id ? 'btn-danger' : 'btn-info'} btn-small" 
                            onclick="toggleRowTimer(${testCase.id})" 
                            id="timerBtn-${testCase.id}" 
                            title="${activeTimerId === testCase.id ? 'Detener cronómetro' : 'Iniciar cronómetro'}">
                        ${activeTimerId === testCase.id ? '⏹️' : '⏱️'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Actualizar checkbox "Select All"
    updateSelectAllCheckbox();

    // Reinicializar drag scroll (mantener funcionalidad existente)
    reinitializeDragScroll();
}

// ===============================================
// FILTROS Y BÚSQUEDA
// ===============================================

window.applyFilters = function () {
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

// ===============================================
// ESTADÍSTICAS
// ===============================================

window.updateStats = function () {
    const total = filteredCases.length;
    const okCases = filteredCases.filter(tc => tc.status === 'OK').length;
    const noCases = filteredCases.filter(tc => tc.status === 'NO').length;
    const successRate = total > 0 ? Math.round((okCases / total) * 100) : 0;

    // Stats básicas existentes
    document.getElementById('totalCases').textContent = total;
    document.getElementById('okCases').textContent = okCases;
    document.getElementById('noCases').textContent = noCases;
    document.getElementById('successRate').textContent = successRate + '%';

    // 🆕 AGREGAR SOLO UNA STAT DE TIEMPO TOTAL
    addTotalTimeStatsCard();
}

// Agregar solo una tarjeta de tiempo total
function addTotalTimeStatsCard() {
    const statsContainer = document.getElementById('statsContainer');

    // Verificar si ya existe la tarjeta de tiempo
    const existingTimeCard = document.getElementById('totalTimeCard');
    if (existingTimeCard) existingTimeCard.remove();

    // Limpiar tarjetas antiguas de cuantización si existen
    const oldQuantizedCard = document.getElementById('quantizedTimeCard');
    const oldTimeStatsCard = document.getElementById('timeStatsCard');
    if (oldQuantizedCard) oldQuantizedCard.remove();
    if (oldTimeStatsCard) oldTimeStatsCard.remove();

    // Obtener estadísticas de tiempo
    const timeStats = getTimeStatistics();

    if (timeStats.casesWithTime > 0) {
        // Tarjeta de tiempo total (única)
        const timeCard = document.createElement('div');
        timeCard.id = 'totalTimeCard';
        timeCard.className = 'stat-card';
        timeCard.innerHTML = `
            <div class="stat-number">${timeStats.totalHours.toFixed(1)}h</div>
            <div class="stat-label">Tiempo Total</div>
        `;
        timeCard.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        timeCard.title = `${timeStats.totalHours.toFixed(2)} horas en ${timeStats.casesWithTime} casos\nPromedio: ${timeStats.averageTimePerCase.toFixed(2)}h por caso\nClick para ver detalles`;
        timeCard.style.cursor = 'pointer';
        timeCard.onclick = () => showTimeInfo();

        // Agregar ícono
        timeCard.style.position = 'relative';
        timeCard.style.overflow = 'hidden';

        const icon = document.createElement('div');
        icon.innerHTML = '⏱️';
        icon.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 1.2em;
            opacity: 0.7;
        `;
        timeCard.appendChild(icon);

        statsContainer.appendChild(timeCard);
    }
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

// EXTENSIÓN de la función updateStats existente
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

// Función para mostrar/ocultar casos ocultos (toggle)
window.toggleShowHidden = function () {
    // Aplicar filtros existentes (que ahora incluirán la lógica de ocultos)
    applyFilters();
}

// ===============================================
// ACTUALIZACIÓN DE ESTADO Y FECHA
// ===============================================

// Función para formatear fecha yyyy-mm-dd a dd-mm-aaaa para mostrar
function formatDateForDisplay(dateString) {
    if (!dateString || dateString.trim() === '') return '';

    try {
        // Si ya está en formato dd-mm-aaaa, devolverlo tal como está
        if (dateString.includes('/') || (dateString.includes('-') && dateString.split('-')[0].length === 2)) {
            return dateString;
        }

        // Convertir de yyyy-mm-dd a dd-mm-aaaa
        if (dateString.includes('-') && dateString.length === 10) {
            const [year, month, day] = dateString.split('-');
            return `${day}-${month}-${year}`;
        }

        return dateString;
    } catch (e) {
        console.error('Error formateando fecha:', e);
        return dateString;
    }
}

// Función para convertir fecha dd-mm-aaaa a yyyy-mm-dd para guardar
function formatDateForStorage(dateString) {
    if (!dateString || dateString.trim() === '') return '';

    try {
        // Si ya está en formato yyyy-mm-dd, devolverlo tal como está
        if (dateString.includes('-') && dateString.length === 10 && dateString.split('-')[0].length === 4) {
            return dateString;
        }

        // Convertir de dd-mm-aaaa a yyyy-mm-dd
        if (dateString.includes('-') && dateString.split('-')[0].length === 2) {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}`;
        }

        return dateString;
    } catch (e) {
        console.error('Error convirtiendo fecha:', e);
        return dateString;
    }
}


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
            testCase.executionDate = `${yyyy}-${mm}-${dd}`;
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

// ===============================================
// FUNCIONES GLOBALES ADICIONALES - EXPOSICIÓN CRÍTICA
// ===============================================

// Exponer funciones globalmente (CRÍTICO para funcionalidad)
window.switchTab = switchTab;
window.updateDevButtons = updateDevButtons;
window.updateRequirementDisplay = updateRequirementDisplay;
window.reinitializeDragScroll = reinitializeDragScrollFunction;

// ✅ NUEVAS EXPOSICIONES CRÍTICAS PARA CRUD
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.deleteTestCase = deleteTestCase;
window.duplicateTestCase = duplicateTestCase;
window.viewEvidence = viewEvidence;
window.renderTestCases = renderTestCases;
window.applyFilters = applyFilters;
window.updateFilters = updateFilters;
window.updateStats = updateStats;
window.updateStatusAndDate = updateStatusAndDate;
window.handleEvidenceUpload = handleEvidenceUpload;
window.addEvidenceToContainer = addEvidenceToContainer;
window.zoomEvidenceImage = zoomEvidenceImage;
window.removeVarName = removeVarName;

// ✅ FUNCIONES CRÍTICAS PARA DUPLICACIÓN
window.insertCaseInCorrectPosition = insertCaseInCorrectPosition;
window.renumberScenariosAfter = renumberScenariosAfter;

// Debug function para desarrolladores
window.getTabsInfo = function () {
    console.log('📋 INFORMACIÓN DEL SISTEMA DE TABS:');
    console.log('Tab activo:', localStorage.getItem('activeTab'));
    console.log('Modo desarrollador:', isDeveloper());
    console.log('Tema actual:', localStorage.getItem('theme'));
    console.log('Tabs disponibles:', Array.from(document.querySelectorAll('.tab-btn')).map(btn => btn.getAttribute('data-tab')));
    console.log('Casos totales:', testCases.length);
    console.log('Timer activo:', activeTimerId);
}

// ✅ FUNCIÓN DEBUG PARA VERIFICAR ESTADO
window.debugAppState = function () {
    console.log('🔍 ESTADO DE LA APLICACIÓN:');
    console.log('testCases:', testCases.length);
    console.log('filteredCases:', filteredCases.length);
    console.log('inputVariableNames:', inputVariableNames);
    console.log('activeTimerId:', activeTimerId);
    console.log('currentEditingId:', currentEditingId);
    console.log('selectedCases:', selectedCases.size);
}

console.log('✅ cases.js renderizado simplificado - Solo horas y una estadística de tiempo');
console.log('🔗 Funciones CRUD expuestas globalmente para uso en HTML');