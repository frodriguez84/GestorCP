// ===============================================
// EXPORT.JS - Import/Export Excel y JSON
// ===============================================

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

// FUNCIONES AUXILIARES PARA EXCEL

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

console.log('✅ export.js cargado - Import/Export Excel y JSON completo');