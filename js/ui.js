// ===============================================
// SISTEMA DE TABS - FUNCIONALIDAD COMPLETA
// ===============================================

/**
 * Función para cambiar de tab
 * @param {string} tabName - Nombre del tab a activar
 */
function switchTab(tabName) {
    // Remover clase activa de todos los tabs y contenidos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('tab-active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('tab-active'));

    // Activar el tab seleccionado
    const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeTabContent = document.getElementById(`tab-${tabName}`);

    if (activeTabBtn && activeTabContent) {
        activeTabBtn.classList.add('tab-active');
        activeTabContent.classList.add('tab-active');

        // Guardar tab activo en localStorage
        localStorage.setItem('activeTab', tabName);

        console.log(`📱 Tab cambiado a: ${tabName}`);

        // Ejecutar funciones específicas según el tab
        onTabChange(tabName);
    }
}

/**
 * Función ejecutada cuando cambia el tab
 * @param {string} tabName - Nombre del nuevo tab activo
 */
function onTabChange(tabName) {
    switch (tabName) {
        case 'gestion':
            // Foco en botón principal si es necesario
            break;
        case 'config':
            // Actualizar visibilidad de botones de desarrollador
            updateDevButtons();
            break;
    }
}

/**
 * Función para restaurar el tab activo desde localStorage
 */
function restoreActiveTab() {
    const savedTab = localStorage.getItem('activeTab') || 'gestion';
    switchTab(savedTab);
}

// ===============================================
// SISTEMA DE DESARROLLADOR
// ===============================================

/**
 * Función para detectar si es desarrollador
 * @returns {boolean} True si es desarrollador
 */
function isDeveloper() {
    // Método 1: Verificar localStorage (manual)
    const devMode = localStorage.getItem('devMode') === 'true';

    // Método 2: Verificar si está en localhost/desarrollo
    const isDev = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:' ||
        window.location.hostname.includes('192.168.');

    return devMode || isDev;
}

/**
 * Función para habilitar modo desarrollador (llamar desde consola)
 */
window.enableDevMode = function () {
    localStorage.setItem('devMode', 'true');
    updateDevButtons();
    console.log('🔓 Modo desarrollador habilitado');
    console.log('💡 Comandos disponibles:');
    console.log('  - disableDevMode() - Deshabilitar modo dev');
    console.log('  - clearAll() - Limpiar todos los datos');
    console.log('  - switchTab("nombre") - Cambiar tab programáticamente');
}

/**
 * Función para deshabilitar modo desarrollador
 */
window.disableDevMode = function () {
    localStorage.removeItem('devMode');
    updateDevButtons();
    console.log('🔒 Modo desarrollador deshabilitado');
}

/**
 * Actualizar visibilidad de botones de desarrollador
 */
function updateDevButtons() {
    const devButtons = document.querySelectorAll('.btn-dev-only');
    const showDevButtons = isDeveloper();

    devButtons.forEach(btn => {
        btn.style.display = showDevButtons ? 'inline-flex' : 'none';

        if (showDevButtons) {
            btn.title = btn.title.replace(' (Solo desarrolladores)', '') + ' (Solo desarrolladores)';
        }
    });

    if (showDevButtons) {
        console.log('👨‍💻 Botones de desarrollador visibles');
    }
}

/**
 * Función para forzar actualización (solo desarrolladores)
 */
function forceUpdate() {
    if (!isDeveloper()) {
        console.warn('⛔ Acceso denegado: Solo para desarrolladores');
        alert('🔒 Acceso denegado: Esta función es solo para desarrolladores');
        return;
    }

    const confirmMessage = `🔄 ¿Forzar actualización de la aplicación?

Esto hará:
• Recargar la página
• Limpiar cache del navegador
• Reiniciar service worker

⚠️ Se perderán datos no guardados`;

    if (confirm(confirmMessage)) {
        console.log('🔄 Iniciando actualización forzada...');

        // Limpiar cache del service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.unregister().then(() => {
                        console.log('🗑️ Service Worker eliminado');
                    });
                }
            });
        }

        // Limpiar cache del navegador
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                    console.log(`🗑️ Cache eliminado: ${name}`);
                });
            });
        }

        // Mostrar mensaje de carga
        document.body.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, #667eea, #764ba2);
                display: flex; align-items: center; justify-content: center;
                color: white; font-family: 'Segoe UI', sans-serif;
                flex-direction: column; gap: 20px;
            ">
                <div style="font-size: 3em;">🔄</div>
                <h2>Actualizando aplicación...</h2>
                <p>Por favor espere...</p>
            </div>
        `;

        // Recargar con cache limpio después de 1 segundo
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    }
}

// ===============================================
// SISTEMA DE TEMA (MEJORADO)
// ===============================================

/**
 * Función para inicializar el sistema de tema
 */
function initThemeSystem() {
    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');

    if (!themeToggle || !themeLabel) {
        console.warn('⚠️ Elementos de tema no encontrados');
        return;
    }

    // Cargar el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
        themeLabel.textContent = 'Modo Oscuro';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.checked = false;
        themeLabel.textContent = 'Modo Claro';
    }

    // Event listener para cambio de tema
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            themeLabel.textContent = 'Modo Oscuro';
            localStorage.setItem('theme', 'dark');
            console.log('🌙 Modo oscuro activado');
        } else {
            document.body.classList.remove('dark-mode');
            themeLabel.textContent = 'Modo Claro';
            localStorage.setItem('theme', 'light');
            console.log('☀️ Modo claro activado');
        }

        // Trigger evento personalizado para otros módulos
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeToggle.checked ? 'dark' : 'light' }
        }));
    });

    console.log('🎨 Sistema de tema inicializado:', savedTheme);
}

/**
 * Función para cambiar tema programáticamente
 * @param {string} theme - 'light' o 'dark'
 */
window.setTheme = function (theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    if (theme === 'dark') {
        themeToggle.checked = true;
    } else if (theme === 'light') {
        themeToggle.checked = false;
    }

    // Trigger el evento change
    themeToggle.dispatchEvent(new Event('change'));
}

// ===============================================
// UI.JS - FUNCIONALIDADES EXISTENTES
// ===============================================

// Variables para el drag scroll
let isDragging = false;
let startX = 0;
let scrollLeft = 0;
let tableContainer = null;

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

    if (!card || !title || !subtitle) return;

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
        if (dateString.includes('-') && dateString.length === 10) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);

            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        const date = new Date(dateString.replace(/-/g, '/'));

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

    } catch (e) {
        console.error('Error al formatear fecha:', e);
        return dateString;
    }
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

// ===============================================
// DRAG SCROLL HORIZONTAL - SISTEMA COMPLETO
// ===============================================

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
    e.preventDefault();
    return false;
}

// Manejar mousedown (BOTÓN DERECHO)
function handleMouseDown(e) {
    if (e.button !== 2) return;

    e.preventDefault();
    isDragging = true;
    startX = e.pageX - tableContainer.offsetLeft;
    scrollLeft = tableContainer.scrollLeft;

    tableContainer.style.cursor = 'grabbing';
    tableContainer.style.userSelect = 'none';
    tableContainer.classList.add('dragging');
}

// Manejar mousemove
function handleMouseMove(e) {
    if (!isDragging) return;

    e.preventDefault();
    const x = e.pageX - tableContainer.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainer.scrollLeft = scrollLeft - walk;
}

// Manejar mouseup
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

    isDragging = false;
    tableContainer.style.cursor = 'default';
    tableContainer.style.userSelect = '';
    tableContainer.classList.remove('dragging');
}

// Función para reinicializar
function reinitializeDragScrollFunction() {
    setTimeout(() => {
        initializeDragScroll();
    }, 100);
}

// ===============================================
// EVENT LISTENERS PRINCIPALES
// ===============================================

document.addEventListener('DOMContentLoaded', function () {
    // ===============================================
    // INICIALIZACIÓN SISTEMA DE TABS
    // ===============================================

    console.log('🚀 Inicializando sistema de tabs...');

    // Event listeners para cambio de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Restaurar tab activo
    setTimeout(() => {
        restoreActiveTab();
    }, 100);

    // ===============================================
    // INICIALIZACIÓN SISTEMA DE TEMA
    // ===============================================

    initThemeSystem();

    // ===============================================
    // INICIALIZACIÓN SISTEMA DE DESARROLLADOR
    // ===============================================

    // Event listener para botón de forzar actualización
    const btnForceUpdate = document.getElementById('btnForceUpdate');
    if (btnForceUpdate) {
        btnForceUpdate.addEventListener('click', forceUpdate);
    }

    // Actualizar visibilidad de botones de desarrollador
    updateDevButtons();

    // ===============================================
    // OTROS EVENT LISTENERS
    // ===============================================

    // Inicializar drag scroll
    setTimeout(initializeDragScroll, 500);

    // Cargar información del requerimiento
    loadRequirementInfo();

    // ===============================================
    // CRÍTICO: EVENT LISTENER PARA FORMULARIO PRINCIPAL DE CASOS
    // ===============================================

    const testCaseForm = document.getElementById('testCaseForm');
    if (testCaseForm) {
        testCaseForm.addEventListener('submit', function (e) {
            e.preventDefault();

            console.log('📝 Procesando formulario de caso de prueba...');

            // Obtener valores del formulario
            const cycleNumber = document.getElementById('cycleNumber').value.trim();
            const scenarioNumber = document.getElementById('scenarioNumber').value.trim();
            const description = document.getElementById('description').value.trim();
            const obtainedResult = document.getElementById('obtainedResult').value.trim();
            const status = document.getElementById('status').value;
            const executionDate = document.getElementById('executionDate').value;
            const observations = document.getElementById('observations').value.trim(); // ✅ CRÍTICO
            const errorNumber = document.getElementById('errorNumber').value.trim();
            const tester = document.getElementById('tester').value.trim();

            // Validaciones
            if (!cycleNumber) {
                alert('⚠ El Ciclo es obligatorio');
                document.getElementById('cycleNumber').focus();
                return;
            }

            if (!scenarioNumber) {
                alert('⚠ El N° Escenario es obligatorio');
                document.getElementById('scenarioNumber').focus();
                return;
            }

            if (!description) {
                alert('⚠ La Descripción es obligatoria');
                document.getElementById('description').focus();
                return;
            }

            if (!tester) {
                alert('⚠ El Nombre del Tester es obligatorio');
                document.getElementById('tester').focus();
                return;
            }

            // Obtener variables de entrada
            const inputVariables = inputVariableNames.map(varName => {
                const input = document.querySelector(`input[name="var_${varName}"]`);
                return {
                    name: varName,
                    value: input ? input.value.trim() : ''
                };
            });

            // Obtener evidencias
            const evidenceContainer = document.getElementById('evidenceContainer');
            const evidenceItems = evidenceContainer.querySelectorAll('.evidence-item');
            const evidence = Array.from(evidenceItems).map(item => {
                const img = item.querySelector('img');
                const span = item.querySelector('span');
                return {
                    name: span ? span.textContent : 'evidencia.png',
                    data: img ? img.src : ''
                };
            });

            // Crear o actualizar caso
            const testCaseData = {
                cycleNumber,
                scenarioNumber,
                description,
                inputVariables,
                obtainedResult,
                status,
                executionDate,
                observations, // ✅ CRÍTICO: Incluir observaciones
                errorNumber,
                tester,
                evidence,
                testTime: 0 // Tiempo inicial en 0
            };

            if (currentEditingId !== null) {
                // ✅ EDITAR CASO EXISTENTE
                const existingCase = testCases.find(tc => tc.id === currentEditingId);
                if (existingCase) {
                    // Preservar tiempo existente
                    testCaseData.testTime = existingCase.testTime || 0;
                    Object.assign(existingCase, testCaseData);
                }
                console.log('✅ Caso editado:', testCaseData);
            } else {
                // ✅ CREAR NUEVO CASO
                const newCase = {
                    ...testCaseData,
                    id: Date.now(),
                    hidden: false
                };

                testCases.push(newCase);
                console.log('✅ Nuevo caso creado:', newCase);
            }

            // Guardar y actualizar interfaz
            saveToStorage();
            renderTestCases();
            updateStats();
            updateFilters();
            closeModal();

            const action = currentEditingId !== null ? 'actualizado' : 'creado';
            alert(`✅ Escenario ${action} correctamente`);
        });
    }

    // Event listener para formulario de requerimiento
    const requirementForm = document.getElementById('requirementForm');
    if (requirementForm) {
        requirementForm.addEventListener('submit', function (e) {
            e.preventDefault();

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

    // Event listeners para cerrar modales
    const closeRequirementBtn = document.getElementById('closeRequirementModalBtn');
    if (closeRequirementBtn) {
        closeRequirementBtn.addEventListener('click', closeRequirementModal);
    }

    // Cerrar modal al hacer clic fuera
    const requirementModal = document.getElementById('requirementModal');
    if (requirementModal) {
        requirementModal.addEventListener('click', function (e) {
            if (e.target === requirementModal) {
                closeRequirementModal();
            }
        });
    }

    console.log('✅ Sistema de tabs y UI inicializado correctamente');
});



// ===============================================
// FUNCIONES GLOBALES ADICIONALES
// ===============================================

// Exponer funciones globalmente
window.switchTab = switchTab;
window.updateDevButtons = updateDevButtons;
window.updateRequirementDisplay = updateRequirementDisplay;
window.reinitializeDragScroll = reinitializeDragScrollFunction;

// Debug function para desarrolladores
window.getTabsInfo = function () {
    console.log('📋 INFORMACIÓN DEL SISTEMA DE TABS:');
    console.log('Tab activo:', localStorage.getItem('activeTab'));
    console.log('Modo desarrollador:', isDeveloper());
    console.log('Tema actual:', localStorage.getItem('theme'));
    console.log('Tabs disponibles:', Array.from(document.querySelectorAll('.tab-btn')).map(btn => btn.getAttribute('data-tab')));
}

console.log('✅ ui.js cargado - Sistema de Tabs, Tema, Desarrollador y funciones auxiliares');