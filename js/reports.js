// ===============================================
// REPORTS.JS - Sistema de reportes PDF COMPLETO
// ===============================================



// Función para obtener todas las métricas del reporte
function getReportMetrics() {
    const metrics = {
        // Información básica
        totalCases: testCases.length,
        okCases: testCases.filter(tc => tc.status === 'OK').length,
        noCases: testCases.filter(tc => tc.status === 'NO').length,
        pendingCases: testCases.filter(tc => !tc.status || tc.status === '' || tc.status === 'Pendiente').length,
        
        // Fechas
        startDate: requirementInfo.startDate || '',
        endDate: getLastExecutionDate(),
        
        // Tiempo
        totalTime: typeof getTotalTimeHours === 'function' ? getTotalTimeHours() : 0,
        averageTime: 0,
        casesWithTime: testCases.filter(tc => (tc.testTime || 0) > 0).length,
        casesWithoutTime: testCases.filter(tc => !(tc.testTime || 0) > 0).length,
        
        // Ciclos
        cycleStats: getCycleStatistics(),
        totalCycles: getCycleCount(),
        
        // Bugs y re-testing
        bugs: getBugsList(),
        scenariosNeedingRetest: getScenariosNeedingRetest(),
        
        // Tasa de éxito
        successRate: 0
    };

    // Calcular métricas derivadas
    metrics.averageTime = metrics.casesWithTime > 0 ? (metrics.totalTime / metrics.casesWithTime) : 0;
    metrics.successRate = metrics.totalCases > 0 ? Math.round((metrics.okCases / metrics.totalCases) * 100) : 0;

    return metrics;
}

// Función para obtener la fecha de última ejecución
function getLastExecutionDate() {
    const datesWithExecution = testCases
        .filter(tc => tc.executionDate && tc.executionDate.trim())
        .map(tc => tc.executionDate)
        .sort((a, b) => {
            // Verificar si las funciones de formato están disponibles
            const dateA = typeof formatDateForStorage === 'function' ? 
                formatDateForStorage(b) : b;
            const dateB = typeof formatDateForStorage === 'function' ? 
                formatDateForStorage(a) : a;
            return new Date(dateA) - new Date(dateB);
        });
    
    return datesWithExecution.length > 0 ? datesWithExecution[0] : '';
}

// Función para obtener estadísticas por ciclo
function getCycleStatistics() {
    const cycleStats = {};
    
    testCases.forEach(tc => {
        const cycle = tc.cycleNumber || '1';
        if (!cycleStats[cycle]) {
            cycleStats[cycle] = {
                totalCases: 0,
                totalTime: 0
            };
        }
        cycleStats[cycle].totalCases++;
        cycleStats[cycle].totalTime += parseFloat(tc.testTime) || 0;
    });

    return cycleStats;
}

// Función para contar ciclos únicos
function getCycleCount() {
    const cycles = new Set(testCases.map(tc => tc.cycleNumber || '1'));
    return cycles.size;
}

// Función para obtener lista de bugs
function getBugsList() {
    return testCases
        .filter(tc => tc.errorNumber && tc.errorNumber.trim())
        .map(tc => ({
            bugNumber: tc.errorNumber,
            scenario: tc.scenarioNumber,
            observations: tc.observations || 'Sin descripción'
        }));
}

// Función para obtener escenarios que necesitan re-testing
function getScenariosNeedingRetest() {
    const scenarioGroups = {};
    
    // Agrupar casos por número de escenario
    testCases.forEach(tc => {
        const scenario = tc.scenarioNumber;
        if (!scenarioGroups[scenario]) {
            scenarioGroups[scenario] = [];
        }
        scenarioGroups[scenario].push(tc);
    });

    const needRetest = [];

    // Para cada escenario, verificar el estado del ciclo más reciente
    Object.keys(scenarioGroups).forEach(scenario => {
        const cases = scenarioGroups[scenario];
        
        // Ordenar por número de ciclo (descendente) para obtener el más reciente
        cases.sort((a, b) => {
            const cycleA = parseInt(a.cycleNumber) || 0;
            const cycleB = parseInt(b.cycleNumber) || 0;
            return cycleB - cycleA;
        });

        const latestCase = cases[0];
        
        // Si el caso más reciente es NO, necesita re-testing
        if (latestCase.status === 'NO') {
            needRetest.push({
                scenario: scenario,
                lastCycle: latestCase.cycleNumber,
                status: latestCase.status
            });
        }
    });

    return needRetest;
}

// ===============================================
// FUNCIÓN PARA GENERAR EL CONTENIDO DEL REPORTE
// ===============================================

function generateReportContent() {
    const metrics = getReportMetrics();
    const reqInfo = requirementInfo;

    let content = '';

    // HEADER/PORTADA
    content += `REPORTE DE TESTING\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    content += `📋 Requerimiento: ${reqInfo.number || 'No especificado'} - ${reqInfo.name || 'Sin nombre'}\n`;
    content += `👤 Tester Principal: ${reqInfo.tester || 'No especificado'}\n`;
    content += `📅 Fecha Inicio: ${typeof formatDateForDisplay === 'function' ? formatDateForDisplay(metrics.startDate) || 'No especificada' : metrics.startDate || 'No especificada'}\n`;
    content += `📅 Fecha Fin: ${typeof formatDateForDisplay === 'function' ? formatDateForDisplay(metrics.endDate) || 'En progreso' : metrics.endDate || 'En progreso'}\n`;
    content += `📄 Reporte generado: ${typeof formatDateForDisplay === 'function' ? formatDateForDisplay(new Date().toISOString().split('T')[0]) : new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', {hour12: false})}\n\n`;

    // SECCIÓN 1: RESUMEN EJECUTIVO
    content += `ESTADÍSTICAS GENERALES\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    content += `✅ Casos totales: ${metrics.totalCases} escenarios\n`;
    if (metrics.totalCases > 0) {
        content += `✅ Casos OK: ${metrics.okCases} (${Math.round((metrics.okCases / metrics.totalCases) * 100)}%)\n`;
        content += `❌ Casos NO: ${metrics.noCases} (${Math.round((metrics.noCases / metrics.totalCases) * 100)}%)\n`;
        content += `⏳ Casos Pendientes: ${metrics.pendingCases} (${Math.round((metrics.pendingCases / metrics.totalCases) * 100)}%)\n`;
    } else {
        content += `✅ Casos OK: 0 (0%)\n`;
        content += `❌ Casos NO: 0 (0%)\n`;
        content += `⏳ Casos Pendientes: 0 (0%)\n`;
    }
    content += `🕐 Tiempo total invertido: ${metrics.totalTime.toFixed(1)} horas\n`;
    content += `🔄 Ciclos ejecutados: ${Object.keys(metrics.cycleStats).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}\n`;
    content += `📈 Tasa de éxito: ${metrics.successRate}%\n\n`;

    // SECCIÓN 4: MÉTRICAS DE TIEMPO
    content += `ANÁLISIS DE TIEMPO\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    content += `⏱️ Tiempo promedio por caso: ${metrics.averageTime.toFixed(1)} horas\n`;
    content += `📊 Tiempo total por ciclo:\n`;
    
    Object.keys(metrics.cycleStats)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(cycle => {
            const stats = metrics.cycleStats[cycle];
            content += `   • Ciclo ${cycle}: ${stats.totalTime.toFixed(1)}h (${stats.totalCases} casos)\n`;
        });
    
    if (metrics.casesWithoutTime > 0) {
        content += `⚠️ Casos sin tiempo registrado: ${metrics.casesWithoutTime}\n`;
    }
    content += '\n';

    // SECCIÓN 5: ISSUES Y RE-TESTING
    content += `BUGS ENCONTRADOS\n`;
    content += `${'='.repeat(50)}\n\n`;

    if (metrics.bugs.length > 0) {
        content += `🐛 Total de bugs: ${metrics.bugs.length}\n`;
        metrics.bugs.forEach(bug => {
            const shortObservation = bug.observations.length > 100 ? 
                bug.observations.substring(0, 100) + '...' : 
                bug.observations;
            content += `• ${bug.bugNumber}: ${shortObservation} (Escenario ${bug.scenario})\n`;
        });
    } else {
        content += `✅ No se encontraron bugs\n`;
    }
    content += '\n';

    content += `ESCENARIOS QUE NECESITAN RE-TESTING\n`;
    content += `${'='.repeat(50)}\n\n`;

    if (metrics.scenariosNeedingRetest.length > 0) {
        content += `⚠️ Escenarios pendientes de re-testing: ${metrics.scenariosNeedingRetest.length}\n`;
        metrics.scenariosNeedingRetest.forEach(item => {
            content += `• Escenario ${item.scenario}.\n`;
        });
    } else {
        content += `✅ No hay escenarios pendientes de re-testing\n`;
    }

    return content;
}

// Abrir modal de vista previa
function openReportPreview() {
    try {
        console.log('🚀 Iniciando generación de reporte...');
        
        // Validar que hay datos
        if (testCases.length === 0) {
            alert('⚠️ No hay escenarios de prueba para generar reporte');
            return;
        }

        console.log('📊 Datos encontrados:', testCases.length, 'casos');

        // Generar contenido
        const reportContent = generateReportContent();
        
        console.log('📝 Contenido generado, caracteres:', reportContent.length);
        
        // Mostrar en el modal
        const contentElement = document.getElementById('reportPreviewContent');
        if (!contentElement) {
            throw new Error('No se encontró el elemento reportPreviewContent');
        }
        
        contentElement.textContent = reportContent;
        
        const modalElement = document.getElementById('reportPreviewModal');
        if (!modalElement) {
            throw new Error('No se encontró el elemento reportPreviewModal');
        }
        
        modalElement.style.display = 'block';
        
        console.log('✅ Reporte generado para preview');
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        alert('❌ Error al generar el reporte: ' + error.message);
    }
}

// Cerrar modal de reporte
function closeReportModal() {
    document.getElementById('reportPreviewModal').style.display = 'none';
}

// ===============================================
// FUNCIÓN PARA GENERAR PDF
// ===============================================

async function generateReportPDF() {
    try {
        console.log('🔍 Iniciando generateReportPDF...');
        
        // Debug completo de jsPDF
        console.log('🔍 Debug jsPDF:');
        console.log('- window.jspdf:', typeof window.jspdf);
        console.log('- window.jsPDF:', typeof window.jsPDF);
        console.log('- global jsPDF:', typeof jsPDF);
        
        if (window.jspdf) {
            console.log('- window.jspdf keys:', Object.keys(window.jspdf));
            console.log('- window.jspdf.jsPDF:', typeof window.jspdf.jsPDF);
        }
        
        // Verificar múltiples formas de acceso a jsPDF
        let jsPDFClass = null;
        
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
            console.log('✅ jsPDF encontrado en window.jspdf.jsPDF');
        } else if (window.jsPDF && window.jsPDF.jsPDF) {
            jsPDFClass = window.jsPDF.jsPDF;
            console.log('✅ jsPDF encontrado en window.jsPDF.jsPDF');
        } else if (window.jspdf) {
            jsPDFClass = window.jspdf;
            console.log('✅ jsPDF encontrado en window.jspdf');
        } else if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
            console.log('✅ jsPDF encontrado en window.jsPDF');
        } else if (typeof jsPDF !== 'undefined') {
            jsPDFClass = jsPDF;
            console.log('✅ jsPDF encontrado globalmente');
        } else {
            console.error('❌ jsPDF no encontrado en ningún lugar');
            console.log('🔍 Objetos disponibles en window:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            console.log('🔍 window.jspdf:', window.jspdf);
            console.log('🔍 window.jspdf keys:', window.jspdf ? Object.keys(window.jspdf) : 'No disponible');
            alert('❌ Error: Librería jsPDF no disponible. Verifica que:\n1. Tienes conexión a internet\n2. El CDN está funcionando\n3. Recarga la página');
            return;
        }

        console.log('🏭 Creando documento PDF...');
        const doc = new jsPDFClass();
        console.log('✅ Documento PDF creado exitosamente');

        // Configuración
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const lineHeight = 6;
        let yPosition = margin;

        // Función para agregar texto con salto de página automático
        function addText(text, fontSize = 10, isBold = false) {
            if (yPosition > 280) { // Nueva página si se acerca al final
                doc.addPage();
                yPosition = margin;
            }
            
            doc.setFontSize(fontSize);
            doc.setFont(undefined, isBold ? 'bold' : 'normal');
            
            // Dividir texto largo en múltiples líneas
            const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
            
            lines.forEach(line => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.text(line, margin, yPosition);
                yPosition += lineHeight;
            });
            
            return yPosition;
        }

        // Función para agregar separador
        function addSeparator() {
            yPosition += 3;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 6;
        }

        // Generar contenido del PDF
        const metrics = getReportMetrics();
        const reqInfo = requirementInfo;

        console.log('📊 Generando contenido del PDF...');

        // HEADER
        addText('REPORTE DE TESTING', 16, true);
        addSeparator();

        addText(`Requerimiento: ${reqInfo.number || 'No especificado'} - ${reqInfo.name || 'Sin nombre'}`, 11);
        addText(`Tester Principal: ${reqInfo.tester || 'No especificado'}`);
        addText(`Fecha Inicio: ${typeof formatDateForDisplay === 'function' ? formatDateForDisplay(metrics.startDate) || 'No especificada' : metrics.startDate || 'No especificada'}`);
        addText(`Fecha Fin: ${typeof formatDateForDisplay === 'function' ? formatDateForDisplay(metrics.endDate) || 'En progreso' : metrics.endDate || 'En progreso'}`);
        addText(`Reporte generado: ${typeof formatDateForDisplay === 'function' ? formatDateForDisplay(new Date().toISOString().split('T')[0]) : new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', {hour12: false})}`);
        yPosition += 5;

        // ESTADÍSTICAS GENERALES
        addText('ESTADÍSTICAS GENERALES', 14, true);
        addSeparator();

        addText(`Casos totales: ${metrics.totalCases} escenarios`);
        if (metrics.totalCases > 0) {
            addText(`Casos OK: ${metrics.okCases} (${Math.round((metrics.okCases / metrics.totalCases) * 100)}%)`);
            addText(`Casos NO: ${metrics.noCases} (${Math.round((metrics.noCases / metrics.totalCases) * 100)}%)`);
            addText(`Casos Pendientes: ${metrics.pendingCases} (${Math.round((metrics.pendingCases / metrics.totalCases) * 100)}%)`);
        } else {
            addText(`Casos OK: 0 (0%)`);
            addText(`Casos NO: 0 (0%)`);
            addText(`Casos Pendientes: 0 (0%)`);
        }
        addText(`Tiempo total invertido: ${metrics.totalTime.toFixed(1)} horas`);
        addText(`Ciclos ejecutados: ${Object.keys(metrics.cycleStats).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}`);
        addText(`Tasa de éxito: ${metrics.successRate}%`);
        yPosition += 5;

        // MÉTRICAS DE TIEMPO
        addText('ANÁLISIS DE TIEMPO', 14, true);
        addSeparator();

        addText(`Tiempo promedio por caso: ${metrics.averageTime.toFixed(1)} horas`);
        addText('Tiempo total por ciclo:', 11, true);
        
        Object.keys(metrics.cycleStats)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach(cycle => {
                const stats = metrics.cycleStats[cycle];
                addText(`  • Ciclo ${cycle}: ${stats.totalTime.toFixed(1)}h (${stats.totalCases} casos)`);
            });

        if (metrics.casesWithoutTime > 0) {
            addText(`Casos sin tiempo registrado: ${metrics.casesWithoutTime}`);
        }
        yPosition += 5;

        // BUGS ENCONTRADOS
        addText('BUGS ENCONTRADOS', 14, true);
        addSeparator();

        if (metrics.bugs.length > 0) {
            addText(`Total de bugs: ${metrics.bugs.length}`, 11, true);
            metrics.bugs.forEach(bug => {
                const shortObservation = bug.observations.length > 100 ? 
                    bug.observations.substring(0, 100) + '...' : 
                    bug.observations;
                addText(`• ${bug.bugNumber}: ${shortObservation} (Escenario ${bug.scenario})`);
            });
        } else {
            addText('No se encontraron bugs');
        }
        yPosition += 3;

        // ESCENARIOS QUE NECESITAN RE-TESTING
        addText('ESCENARIOS QUE NECESITAN RE-TESTING', 14, true);
        addSeparator();

        if (metrics.scenariosNeedingRetest.length > 0) {
            addText(`Escenarios pendientes de re-testing: ${metrics.scenariosNeedingRetest.length}`, 11, true);
            metrics.scenariosNeedingRetest.forEach(item => {
                addText(`• Escenario ${item.scenario}.`);
            });
        } else {
            addText('No hay escenarios pendientes de re-testing');
        }

        // Generar nombre del archivo
        const projectName = reqInfo.name || 'Proyecto';
        const date = new Date().toISOString().split('T')[0];
        const fileName = `Reporte_Testing_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;

        console.log('💾 Guardando PDF:', fileName);

        // Descargar PDF
        doc.save(fileName);
        
        // Cerrar modal
        closeReportModal();
        
        console.log('✅ PDF generado exitosamente:', fileName);
        alert('✅ Reporte PDF generado correctamente');

    } catch (error) {
        console.error('❌ Error completo en generateReportPDF:', error);
        console.error('Stack trace:', error.stack);
        alert('❌ Error al generar PDF: ' + error.message);
    }
}

// ===============================================
// EVENT LISTENERS
// ===============================================

document.addEventListener('DOMContentLoaded', function() {
    // Esperar un momento para que todos los elementos estén disponibles
    setTimeout(() => {
        // Botón principal para generar reporte
        const btnGenerateReport = document.getElementById('btnGenerateReport');
        if (btnGenerateReport) {
            btnGenerateReport.addEventListener('click', openReportPreview);
            console.log('✅ Botón de reporte conectado');
        } else {
            console.warn('⚠️ No se encontró btnGenerateReport');
        }

        // Botones del modal
        const closeReportBtn = document.getElementById('closeReportModalBtn');
        if (closeReportBtn) {
            closeReportBtn.addEventListener('click', closeReportModal);
        }

        const btnCancelReport = document.getElementById('btnCancelReport');
        if (btnCancelReport) {
            btnCancelReport.addEventListener('click', closeReportModal);
        }

        const btnDownloadPDF = document.getElementById('btnDownloadPDF');
        if (btnDownloadPDF) {
            btnDownloadPDF.addEventListener('click', generateReportPDF);
        }

        // Cerrar modal al hacer clic fuera
        const reportModal = document.getElementById('reportPreviewModal');
        if (reportModal) {
            reportModal.addEventListener('click', function(e) {
                if (e.target === reportModal) {
                    closeReportModal();
                }
            });
        }
    }, 100);
});

// ===============================================
// EXPONER FUNCIONES GLOBALMENTE
// ===============================================


window.generateReportPDF = generateReportPDF;
window.getReportMetrics = getReportMetrics;

console.log('✅ Sistema de reportes PDF cargado');


