// ===============================================
// DRAGDROP.JS - Sistema completo de Drag & Drop
// ===============================================

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
// 4. ELEMENTOS VISUALES DE DRAG
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
// AUTO-SCROLL DURANTE DRAG & DROP
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
    // ✅ MANTENER zones intacto
    if (!autoScrollState.zones) {
        autoScrollState.zones = { top: 50, bottom: 50 };
    }
}

// ===============================================
// INTEGRACIÓN Y MEJORAS DEL SISTEMA DRAG & DROP
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
// FUNCIÓN PARA MOSTRAR ESTADÍSTICAS DE DRAG
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
// RENUMERACIÓN INTELIGENTE
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
// TOOLBAR DE REORDENAMIENTO
// ===============================================

// Función para crear/actualizar toolbar de reordenamiento
/*function createReorderingToolbar() {
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
}*/

// ===============================================
// INICIALIZACIÓN DE INTEGRACIÓN
// ===============================================

// Función de inicialización completa
/*function initializeDragDropIntegration() {
    // Crear toolbar de reordenamiento
    createReorderingToolbar();

    // Actualizar estado inicial de handles
    setTimeout(() => {
        updateDragHandlesState();
    }, 500);

    console.log('🔧 Integración de Drag & Drop inicializada');
}*/

// Inicializar cuando el DOM esté listo
/*document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initializeDragDropIntegration, 1000);
});*/

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎯 Sistema de Drag & Drop para escenarios inicializado');

    // Asegurar que el sistema esté limpio
    cleanupDragState();
    undoAvailable = false;
});

console.log('📋 dragdrop.js cargado - Sistema completo de Drag & Drop');