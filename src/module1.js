const { ipcRenderer } = require('electron');
let equipmentData = [];
let filteredData = [];
let scatterChart = null;

// Load data when module initializes
async function initModule1() {
  equipmentData = await ipcRenderer.invoke('load-equipment-data');
  filteredData = [...equipmentData];
  updateStatistics();
  renderScatterPlot();
  setupFilters();
}

// Update statistics cards
function updateStatistics() {
  const totalCapex = filteredData.reduce((sum, item) => sum + item.investment, 0);
  const criticalCount = filteredData.filter(item => item.priority === 'Critical').length;
  const avgROI = filteredData.reduce((sum, item) => sum + item.roiTimeline, 0) / filteredData.length;
  const gmpGap = calculateGMPGap();

  document.getElementById('total-capex').textContent = `$${totalCapex.toFixed(1)}M`;
  document.getElementById('critical-count').textContent = criticalCount;
  document.getElementById('avg-roi').textContent = `${avgROI.toFixed(1)} years`;
  document.getElementById('gmp-gap').textContent = `${gmpGap.toFixed(1)}%`;
}

function calculateGMPGap() {
  const belowStandard = filteredData.filter(item => item.gmpCompliance < 75).length;
  return (belowStandard / filteredData.length) * 100;
}

// Render scatter plot using Chart.js
function renderScatterPlot() {
  const ctx = document.getElementById('scatterChart').getContext('2d');

  if (scatterChart) {
    scatterChart.destroy();
  }

  const datasets = prepareChartData();

  scatterChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#333',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const item = context.raw.item;
              return [
                `${item.name}`,
                `Investment: $${item.investment}M`,
                `Impact Score: ${item.impactScore}`,
                `Complexity: ${item.complexity}`,
                `Risk: ${item.riskLevel}`,
                `Priority: ${item.priority}`
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
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          min: 0,
          max: 3.5
        },
        y: {
          title: {
            display: true,
            text: 'Impact Score (0-100)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          min: 60,
          max: 100
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const datasetIndex = elements[0].datasetIndex;
          const index = elements[0].index;
          const item = scatterChart.data.datasets[datasetIndex].data[index].item;
          showDetailPanel(item);
        }
      }
    }
  });
}

function prepareChartData() {
  const riskColors = {
    'Low': 'rgba(76, 175, 80, 0.7)',
    'Medium': 'rgba(255, 152, 0, 0.7)',
    'High': 'rgba(244, 67, 54, 0.7)'
  };

  const datasetsByRisk = {
    'Low': [],
    'Medium': [],
    'High': []
  };

  filteredData.forEach(item => {
    datasetsByRisk[item.riskLevel].push({
      x: item.investment,
      y: item.impactScore,
      r: item.complexity / 5, // Scale bubble size
      item: item
    });
  });

  return Object.keys(datasetsByRisk).map(risk => ({
    label: `${risk} Risk`,
    data: datasetsByRisk[risk],
    backgroundColor: riskColors[risk],
    borderColor: riskColors[risk].replace('0.7', '1'),
    borderWidth: 2
  }));
}

// Show detail panel when bubble is clicked
function showDetailPanel(item) {
  const panel = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');

  content.innerHTML = `
    <div class="detail-header">
      <h3>${item.name}</h3>
      <span class="priority-badge priority-${item.priority.toLowerCase()}">${item.priority}</span>
    </div>
    <p class="detail-description">${item.description}</p>
    <div class="detail-grid">
      <div class="detail-item">
        <label>Investment Required</label>
        <value>$${item.investment}M</value>
      </div>
      <div class="detail-item">
        <label>Impact Score</label>
        <value>${item.impactScore}/100</value>
      </div>
      <div class="detail-item">
        <label>Implementation Complexity</label>
        <value>${item.complexity}/90</value>
      </div>
      <div class="detail-item">
        <label>Risk Level</label>
        <value>${item.riskLevel}</value>
      </div>
      <div class="detail-item">
        <label>GMP Compliance</label>
        <value>${item.gmpCompliance}%</value>
      </div>
      <div class="detail-item">
        <label>Revenue Impact</label>
        <value>${item.revenueImpact > 0 ? '$' + item.revenueImpact + 'M/yr' : 'N/A'}</value>
      </div>
      <div class="detail-item">
        <label>Strategic Importance</label>
        <value>${item.strategicImportance}</value>
      </div>
      <div class="detail-item">
        <label>ROI Timeline</label>
        <value>${item.roiTimeline} years</value>
      </div>
      <div class="detail-item">
        <label>Category</label>
        <value>${item.category}</value>
      </div>
    </div>
  `;

  panel.classList.add('active');
}

// Setup filter buttons
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;
      applyFilter(filter);
    });
  });

  document.getElementById('close-detail').addEventListener('click', function() {
    document.getElementById('detail-panel').classList.remove('active');
  });
}

function applyFilter(filter) {
  switch(filter) {
    case 'all':
      filteredData = [...equipmentData];
      break;
    case 'critical':
      filteredData = equipmentData.filter(item => item.priority === 'Critical');
      break;
    case 'high-revenue':
      filteredData = equipmentData.filter(item => item.impactScore >= 80);
      break;
    case 'strategic':
      filteredData = equipmentData.filter(item => item.strategicImportance === 'High');
      break;
  }

  updateStatistics();
  renderScatterPlot();
}

// Initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModule1);
} else {
  initModule1();
}
