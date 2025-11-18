const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Global data storage
let equipmentData = [];
let productsData = [];
let equipmentChart = null;
let scenariosChart = null;

// Load data on startup
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    await loadEquipmentData();
    await loadProductsData();
    initializeTabs();
    initializeEquipmentModule();
    initializePortfolioModule();
    initializeScenariosModule();
    setupEventListeners();
}

// ===== DATA LOADING =====
async function loadEquipmentData() {
    const result = await ipcRenderer.invoke('load-data', 'equipment.json');
    if (result.success) {
        equipmentData = result.data.equipment;
    } else {
        console.error('Failed to load equipment data:', result.error);
    }
}

async function loadProductsData() {
    const result = await ipcRenderer.invoke('load-data', 'products.json');
    if (result.success) {
        productsData = result.data.products;
    } else {
        console.error('Failed to load products data:', result.error);
    }
}

// ===== TAB NAVIGATION =====
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const modules = document.querySelectorAll('.module');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs and modules
            tabButtons.forEach(btn => btn.classList.remove('active'));
            modules.forEach(module => module.classList.remove('active'));

            // Add active class to clicked tab and corresponding module
            button.classList.add('active');
            const tabName = button.getAttribute('data-tab');
            document.getElementById(`${tabName}-module`).classList.add('active');
        });
    });
}

// ===== MODULE 1: EQUIPMENT INVESTMENT PRIORITIZATION =====
function initializeEquipmentModule() {
    updateEquipmentStats(equipmentData);
    renderEquipmentChart(equipmentData);

    // Filter dropdown
    document.getElementById('equipmentFilter').addEventListener('change', (e) => {
        const filterValue = e.target.value;
        let filteredData = [...equipmentData];

        switch(filterValue) {
            case 'critical':
                filteredData = equipmentData.filter(item => item.priority === 'Critical');
                break;
            case 'highimpact':
                filteredData = equipmentData.filter(item => item.impact >= 80);
                break;
            case 'strategic':
                filteredData = equipmentData.filter(item =>
                    item.type.includes('Strategic') || item.type.includes('AU PANVAC')
                );
                break;
        }

        updateEquipmentStats(filteredData);
        renderEquipmentChart(filteredData);
    });

    // Close details panel
    document.getElementById('closeDetails').addEventListener('click', () => {
        document.getElementById('equipmentDetails').style.display = 'none';
    });
}

function updateEquipmentStats(data) {
    // Total CAPEX
    const totalCapex = data.reduce((sum, item) => sum + item.investment, 0);
    document.getElementById('totalCapex').textContent = `$${totalCapex.toFixed(1)}M`;

    // Critical Lines Count
    const criticalCount = data.filter(item => item.priority === 'Critical').length;
    document.getElementById('criticalCount').textContent = criticalCount;

    // Average ROI
    const avgROI = data.reduce((sum, item) => sum + (item.roi || 4), 0) / data.length;
    document.getElementById('avgROI').textContent = `${avgROI.toFixed(1)} years`;

    // GMP Compliance Gap
    const belowStandard = data.filter(item => (item.gmpcompliance || 70) < 75).length;
    const gmpGap = (belowStandard / data.length) * 100;
    document.getElementById('gmpGap').textContent = `${gmpGap.toFixed(0)}%`;
}

function renderEquipmentChart(data) {
    const ctx = document.getElementById('equipmentChart').getContext('2d');

    // Destroy existing chart if it exists
    if (equipmentChart) {
        equipmentChart.destroy();
    }

    // Prepare data for scatter plot
    const scatterData = data.map(item => ({
        x: item.investment,
        y: item.impact,
        r: item.complexity / 3, // Scale down for bubble size
        label: item.name,
        risk: item.risk,
        priority: item.priority,
        type: item.type,
        roi: item.roi || 4,
        gmp: item.gmpcompliance || 70,
        id: item.id
    }));

    // Group by risk level for coloring
    const highRisk = scatterData.filter(d => d.risk === 'high');
    const mediumRisk = scatterData.filter(d => d.risk === 'medium');
    const lowRisk = scatterData.filter(d => d.risk === 'low');

    equipmentChart = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [
                {
                    label: 'High Risk',
                    data: highRisk,
                    backgroundColor: 'rgba(220, 38, 38, 0.6)',
                    borderColor: '#dc2626',
                    borderWidth: 2
                },
                {
                    label: 'Medium Risk',
                    data: mediumRisk,
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: '#f59e0b',
                    borderWidth: 2
                },
                {
                    label: 'Low Risk',
                    data: lowRisk,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: '#10b981',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Investment vs Impact Analysis - 23 Production Lines',
                    font: { size: 16, weight: 'bold' },
                    color: '#1e40af'
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12 },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = context.raw;
                            return [
                                item.label,
                                `Investment: $${item.x.toFixed(1)}M`,
                                `Impact Score: ${item.y}`,
                                `Complexity: ${Math.round(item.r * 3)}`,
                                `Priority: ${item.priority}`,
                                `ROI: ${item.roi} years`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Investment Required ($ Millions)',
                        font: { size: 14, weight: 'bold' },
                        color: '#1e40af'
                    },
                    min: 0,
                    max: 2.5
                },
                y: {
                    title: {
                        display: true,
                        text: 'Impact Score (0-100)',
                        font: { size: 14, weight: 'bold' },
                        color: '#1e40af'
                    },
                    min: 40,
                    max: 100
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const dataset = elements[0].datasetIndex;
                    let clickedItem;

                    if (dataset === 0) clickedItem = highRisk[dataIndex];
                    else if (dataset === 1) clickedItem = mediumRisk[dataIndex];
                    else clickedItem = lowRisk[dataIndex];

                    showEquipmentDetails(clickedItem);
                }
            }
        }
    });
}

function showEquipmentDetails(item) {
    const detailsPanel = document.getElementById('equipmentDetails');
    const detailsTitle = document.getElementById('detailsTitle');
    const detailsContent = document.getElementById('detailsContent');

    detailsTitle.textContent = item.label;

    detailsContent.innerHTML = `
        <div class="detail-item">
            <label>Investment Required</label>
            <div class="value">$${item.x.toFixed(1)}M</div>
        </div>
        <div class="detail-item">
            <label>Impact Score</label>
            <div class="value">${item.y}/100</div>
        </div>
        <div class="detail-item">
            <label>Implementation Complexity</label>
            <div class="value">${Math.round(item.r * 3)}/90</div>
        </div>
        <div class="detail-item">
            <label>Risk Level</label>
            <div class="value" style="color: ${getRiskColor(item.risk)}">${item.risk.toUpperCase()}</div>
        </div>
        <div class="detail-item">
            <label>Production Line Type</label>
            <div class="value">${item.type}</div>
        </div>
        <div class="detail-item">
            <label>Priority Classification</label>
            <div class="value">${item.priority}</div>
        </div>
        <div class="detail-item">
            <label>ROI Timeline</label>
            <div class="value">${item.roi} years</div>
        </div>
        <div class="detail-item">
            <label>GMP Compliance</label>
            <div class="value">${item.gmp}%</div>
        </div>
    `;

    detailsPanel.style.display = 'block';
    detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getRiskColor(risk) {
    switch(risk) {
        case 'high': return '#dc2626';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#64748b';
    }
}

// ===== MODULE 2: PRODUCT PORTFOLIO OPTIMIZER =====
function initializePortfolioModule() {
    // Initialize sliders
    const sliders = ['demand', 'margin', 'feasibility', 'competitive', 'regulatory'];

    sliders.forEach(name => {
        const slider = document.getElementById(`${name}Slider`);
        slider.addEventListener('input', (e) => {
            document.getElementById(`${name}Weight`).textContent = e.target.value;
            updatePortfolioTable();
        });
    });

    updatePortfolioTable();
}

function updatePortfolioTable() {
    // Get current weights
    const weights = {
        demand: parseFloat(document.getElementById('demandSlider').value) / 100,
        margin: parseFloat(document.getElementById('marginSlider').value) / 100,
        feasibility: parseFloat(document.getElementById('feasibilitySlider').value) / 100,
        competitive: parseFloat(document.getElementById('competitiveSlider').value) / 100,
        regulatory: parseFloat(document.getElementById('regulatorySlider').value) / 100
    };

    // Calculate total weight
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) * 100;
    document.getElementById('totalWeight').textContent = totalWeight.toFixed(0);

    // Normalize weights if total is not 100%
    const normalizedWeights = {};
    Object.keys(weights).forEach(key => {
        normalizedWeights[key] = weights[key] / (totalWeight / 100);
    });

    // Calculate weighted scores
    const scoredProducts = productsData.map(product => {
        const score = (
            product.demand * normalizedWeights.demand +
            product.margin * normalizedWeights.margin +
            product.feasibility * normalizedWeights.feasibility +
            product.competitive * normalizedWeights.competitive +
            (100 - product.regulatory) * normalizedWeights.regulatory
        );

        return {
            ...product,
            weightedScore: score
        };
    });

    // Sort by weighted score (descending)
    scoredProducts.sort((a, b) => b.weightedScore - a.weightedScore);

    // Render table
    const tableBody = document.getElementById('portfolioTableBody');
    tableBody.innerHTML = '';

    scoredProducts.forEach((product, index) => {
        const rank = index + 1;
        let priorityClass = 'priority-low';
        let priorityText = 'Low Priority';

        if (rank <= 4) {
            priorityClass = 'priority-high';
            priorityText = 'High Priority';
        } else if (rank <= 8) {
            priorityClass = 'priority-medium';
            priorityText = 'Medium Priority';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${rank}</strong></td>
            <td>${product.name}</td>
            <td>${product.type}</td>
            <td><strong>${product.weightedScore.toFixed(1)}</strong></td>
            <td><span class="priority-badge ${priorityClass}">${priorityText}</span></td>
            <td>$${product.investment}M</td>
        `;
        tableBody.appendChild(row);
    });
}

// ===== MODULE 3: SCENARIO COMPARISON =====
function initializeScenariosModule() {
    renderScenariosChart();
}

function renderScenariosChart() {
    const ctx = document.getElementById('scenariosChart').getContext('2d');

    scenariosChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Conservative', 'Moderate', 'Aggressive'],
            datasets: [
                {
                    label: 'Investment ($M)',
                    data: [8.5, 15.2, 24.7],
                    backgroundColor: 'rgba(30, 64, 175, 0.7)',
                    borderColor: '#1e40af',
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue Growth (%)',
                    data: [35, 65, 120],
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Investment vs Revenue Growth Comparison',
                    font: { size: 16, weight: 'bold' },
                    color: '#1e40af'
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12 },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += '$' + context.parsed.y + 'M';
                            } else {
                                label += '+' + context.parsed.y + '%';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Investment ($M)',
                        font: { size: 13, weight: 'bold' },
                        color: '#1e40af'
                    },
                    min: 0,
                    max: 30
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Revenue Growth (%)',
                        font: { size: 13, weight: 'bold' },
                        color: '#10b981'
                    },
                    min: 0,
                    max: 140,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// ===== IMPORT/EXPORT FUNCTIONALITY =====
function setupEventListeners() {
    document.getElementById('importExcel').addEventListener('click', handleImportExcel);
    document.getElementById('exportPDF').addEventListener('click', handleExportPDF);
}

async function handleImportExcel() {
    try {
        const result = await ipcRenderer.invoke('select-file', {
            filters: [
                { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
            ],
            properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            // For now, show a success message
            alert('Excel import functionality will read and validate data from: ' + filePath);
            // TODO: Implement actual Excel parsing using xlsx library
        }
    } catch (error) {
        console.error('Error importing Excel:', error);
        alert('Error importing Excel file: ' + error.message);
    }
}

async function handleExportPDF() {
    try {
        // Get the active module
        const activeModule = document.querySelector('.module.active');
        const moduleName = activeModule.id.replace('-module', '');

        const result = await ipcRenderer.invoke('save-file', {
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
            ],
            defaultPath: `NVI_${moduleName}_${new Date().toISOString().split('T')[0]}.pdf`
        });

        if (!result.canceled && result.filePath) {
            alert('PDF export functionality will save current view to: ' + result.filePath);
            // TODO: Implement actual PDF generation using jspdf and html2canvas
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting PDF: ' + error.message);
    }
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
}
