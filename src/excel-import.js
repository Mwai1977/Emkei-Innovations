const { ipcRenderer } = require('electron');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Setup import and export buttons
document.addEventListener('DOMContentLoaded', function() {
  const importBtn = document.getElementById('import-excel-btn');
  const exportBtn = document.getElementById('export-data-btn');

  if (importBtn) {
    importBtn.addEventListener('click', handleImportExcel);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportData);
  }
});

// Handle Excel import
async function handleImportExcel() {
  try {
    const result = await ipcRenderer.invoke('import-excel');

    if (result.success && result.path) {
      const workbook = XLSX.readFile(result.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Determine data type and process accordingly
      if (isEquipmentData(data)) {
        await importEquipmentData(data);
        showNotification('Equipment data imported successfully!', 'success');
      } else if (isProductData(data)) {
        await importProductData(data);
        showNotification('Product data imported successfully!', 'success');
      } else {
        showNotification('Unable to determine data format. Please check your Excel file.', 'error');
      }
    }
  } catch (error) {
    console.error('Error importing Excel:', error);
    showNotification('Error importing Excel file: ' + error.message, 'error');
  }
}

// Check if data is equipment data
function isEquipmentData(data) {
  if (data.length === 0) return false;
  const firstRow = data[0];
  return firstRow.hasOwnProperty('name') &&
         firstRow.hasOwnProperty('investment') &&
         firstRow.hasOwnProperty('impactScore');
}

// Check if data is product data
function isProductData(data) {
  if (data.length === 0) return false;
  const firstRow = data[0];
  return firstRow.hasOwnProperty('name') &&
         firstRow.hasOwnProperty('marketDemand') &&
         firstRow.hasOwnProperty('profitMargin');
}

// Import equipment data
async function importEquipmentData(data) {
  const mappedData = data.map((row, index) => ({
    id: row.id || index + 1,
    name: row.name || '',
    investment: parseFloat(row.investment) || 0,
    impactScore: parseInt(row.impactScore) || 0,
    complexity: parseInt(row.complexity) || 50,
    riskLevel: row.riskLevel || 'Medium',
    priority: row.priority || 'Medium',
    gmpCompliance: parseInt(row.gmpCompliance) || 70,
    revenueImpact: parseFloat(row.revenueImpact) || 0,
    strategicImportance: row.strategicImportance || 'Medium',
    roiTimeline: parseFloat(row.roiTimeline) || 4.0,
    category: row.category || 'General',
    description: row.description || ''
  }));

  await ipcRenderer.invoke('save-equipment-data', mappedData);

  // Reload the current module
  if (typeof initModule1 === 'function') {
    await initModule1();
  }
}

// Import product data
async function importProductData(data) {
  const mappedData = data.map((row, index) => ({
    id: row.id || index + 1,
    name: row.name || '',
    type: row.type || 'General',
    marketDemand: parseInt(row.marketDemand) || 50,
    profitMargin: parseInt(row.profitMargin) || 50,
    technicalFeasibility: parseInt(row.technicalFeasibility) || 50,
    competitivePosition: parseInt(row.competitivePosition) || 50,
    regulatoryComplexity: parseInt(row.regulatoryComplexity) || 50,
    estimatedInvestment: row.estimatedInvestment || '0M',
    currentProduction: row.currentProduction || 'N/A',
    potentialProduction: row.potentialProduction || 'N/A'
  }));

  // Save to products.json
  const dataPath = path.join(__dirname, '..', 'data', 'products.json');
  fs.writeFileSync(dataPath, JSON.stringify(mappedData, null, 2));

  // Reload the current module
  if (typeof initModule2 === 'function') {
    await initModule2();
  }
}

// Handle data export
async function handleExportData() {
  try {
    const equipmentData = await ipcRenderer.invoke('load-equipment-data');
    const productsData = await ipcRenderer.invoke('load-products-data');
    const scenariosData = await ipcRenderer.invoke('load-scenarios-data');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add equipment sheet
    const equipmentSheet = XLSX.utils.json_to_sheet(equipmentData);
    XLSX.utils.book_append_sheet(wb, equipmentSheet, 'Equipment');

    // Add products sheet
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, productsSheet, 'Products');

    // Add scenarios sheet (flatten the data)
    const scenariosFlat = [
      { scenario: 'Conservative', ...scenariosData.conservative },
      { scenario: 'Moderate', ...scenariosData.moderate },
      { scenario: 'Aggressive', ...scenariosData.aggressive }
    ];
    const scenariosSheet = XLSX.utils.json_to_sheet(scenariosFlat);
    XLSX.utils.book_append_sheet(wb, scenariosSheet, 'Scenarios');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `NVI_Investment_Dashboard_${timestamp}.xlsx`;

    // Write file to user's downloads or desktop
    const downloadsPath = path.join(require('os').homedir(), 'Downloads', filename);
    XLSX.writeFile(wb, downloadsPath);

    showNotification(`Data exported successfully to ${filename}`, 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Error exporting data: ' + error.message, 'error');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
