// ===============================================
// TIMERS.JS - Sistema de cronómetros completo
// ===============================================

// ===============================================
// CRONÓMETROS EN FILAS - SISTEMA PRINCIPAL
// ===============================================

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

// ===============================================
// EDICIÓN MANUAL DE TIEMPO
// ===============================================

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

// ===============================================
// EXPOSICIÓN DE FUNCIONES GLOBALES
// ===============================================

// Hacer las funciones disponibles globalmente
window.toggleRowTimer = toggleRowTimer;
window.stopRowTimer = stopRowTimer;
window.pauseTimer = pauseTimer;

console.log('✅ timers.js cargado - Sistema de cronómetros completo');