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
        const activeCase = testCases.find(tc => tc.id === activeTimerId);
        const newCase = testCases.find(tc => tc.id === id);

        if (!confirm(`⏱️ Ya tienes un cronómetro activo en el Escenario ${activeCase?.scenarioNumber} - Ciclo ${activeCase?.cycleNumber}.
        \n¿Detenerlo y cambiar al Escenario ${newCase?.scenarioNumber} - Ciclo ${newCase?.cycleNumber}?`)) {
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
    // Convertir horas existentes a minutos para cálculo interno
    rowTimerAccum = (parseFloat(testCase.testTime) || 0) * 60;
    rowTimerStartTime = Date.now();

    showTimerBar(testCase);
    updateAllTimerButtons();

    rowTimerInterval = setInterval(updateTimerDisplay, 1000); // Cada segundo es suficiente

    console.log(`⏱️ Cronómetro iniciado: Escenario ${testCase.scenarioNumber}, tiempo acumulado: ${testCase.testTime || 0} horas`);
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

    const display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = formatTimeDisplay(total);
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
        console.log('⏱️ Cronómetro reanudado');
    } else {
        // Pausar
        timerPaused = true;
        pausedTime = Date.now() - rowTimerStartTime;
        pauseBtn.innerHTML = '▶️ Reanudar';
        pauseBtn.className = 'btn btn-success btn-small';
        console.log('⏸️ Cronómetro pausado');
    }
}

// Función detener cronómetro (guarda en horas)
function stopRowTimer() {
    if (activeTimerId === null) return;

    clearInterval(rowTimerInterval);

    // Guardar tiempo final EN HORAS
    const testCase = testCases.find(tc => tc.id === activeTimerId);
    if (testCase) {
        const elapsed = timerPaused ? pausedTime / 60000 : (Date.now() - rowTimerStartTime) / 60000;
        let totalMinutes = rowTimerAccum + elapsed;

        // Convertir a horas y guardar con 2 decimales
        let totalHours = totalMinutes / 60;
        testCase.testTime = Math.round(totalHours * 100) / 100;

        console.log(`⏹️ Cronómetro detenido: ${totalHours.toFixed(2)} horas total`);
    }

    // RESET COMPLETO
    const oldTimerId = activeTimerId;
    activeTimerId = null;
    timerPaused = false;
    pausedTime = 0;

    // Ocultar barra y actualizar botones
    document.getElementById('timerBar').style.display = 'none';
    updateAllTimerButtons();

    saveToStorage();
    renderTestCases();
    updateStats();
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
                btn.className = 'btn btn-danger btn-small';
            } else {
                btn.textContent = '⏱️';
                btn.title = 'Iniciar cronómetro';
                btn.className = 'btn btn-info btn-small';
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
        const newTimeHours = Math.max(0, parseFloat(value) || 0);
        testCase.testTime = newTimeHours;

        // ACTUALIZACIÓN INMEDIATA
        saveToStorage();
        renderTestCases();
        updateStats();

        console.log(`⏱️ Tiempo actualizado manualmente: Escenario ${testCase.scenarioNumber} → ${newTimeHours} horas`);
    }
}

// Función simplificada para formatear tiempo en hh:mm
function formatTimeDisplay(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


// ===============================================
// FUNCIONES PARA ESTADÍSTICAS SIMPLIFICADAS
// ===============================================

// Obtener tiempo total en horas (solo una función simple)
function getTotalTimeHours() {
    return testCases.reduce((total, tc) => {
        return total + (parseFloat(tc.testTime) || 0);
    }, 0);
}

// Obtener estadísticas simplificadas
function getTimeStatistics() {
    const casesWithTime = testCases.filter(tc => (tc.testTime || 0) > 0);
    const totalHours = getTotalTimeHours();
    
    return {
        casesWithTime: casesWithTime.length,
        totalCases: testCases.length,
        totalHours: totalHours,
        averageTimePerCase: casesWithTime.length > 0 ? totalHours / casesWithTime.length : 0
    };
}

// ===============================================
// EXPOSICIÓN DE FUNCIONES GLOBALES
// ===============================================

// Hacer las funciones disponibles globalmente
window.toggleRowTimer = toggleRowTimer;
window.stopRowTimer = stopRowTimer;
window.pauseTimer = pauseTimer;
window.getTotalTimeHours = getTotalTimeHours;
window.getTimeStatistics = getTimeStatistics;
window.formatTimeDisplay = formatTimeDisplay;

console.log('✅ timers.js cargado - Sistema simplificado con horas y cronómetro hh:mm');