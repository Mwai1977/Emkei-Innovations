const { ipcRenderer } = require('electron');
let scenariosData = {};
let comparisonChart = null;

// Load data when module initializes
async function initModule3() {
  scenariosData = await ipcRenderer.invoke('load-scenarios-data');
  renderScenarioCards();
  renderComparisonChart();
}

// Render scenario cards
function renderScenarioCards() {
  renderScenarioCard('conservative', scenariosData.conservative, 'conservative-card');
  renderScenarioCard('moderate', scenariosData.moderate, 'moderate-card');
  renderScenarioCard('aggressive', scenariosData.aggressive, 'aggressive-card');
}

function renderScenarioCard(type, scenario, elementId) {
  const card = document.getElementById(elementId);

  const riskColors = {
    'Low': '#4caf50',
    'Medium': '#ff9800',
    'High': '#f44336'
  };

  card.innerHTML = `
    <div class="scenario-header" style="border-top: 4px solid ${riskColors[scenario.riskLevel]}">
      <h3>${scenario.name}</h3>
      <span class="risk-badge" style="background-color: ${riskColors[scenario.riskLevel]}">${scenario.riskLevel} Risk</span>
    </div>

    <p class="scenario-description">${scenario.description}</p>

    <div class="scenario-metrics">
      <div class="metric-item">
        <label>Total Investment</label>
        <value class="value-large">$${scenario.totalInvestment}M</value>
      </div>

      <div class="metric-item">
        <label>Production Lines</label>
        <value class="value-large">${scenario.productionLines} Lines</value>
      </div>

      <div class="metric-item">
        <label>Revenue Impact (5yr)</label>
        <value class="value-positive">+${scenario.revenueImpact}%</value>
      </div>

      <div class="metric-item">
        <label>Payback Period</label>
        <value>${scenario.paybackPeriod} years</value>
      </div>

      <div class="metric-item">
        <label>Market Position</label>
        <value>${scenario.marketPosition}</value>
      </div>
    </div>

    <div class="scenario-benefits">
      <h4>Key Benefits</h4>
      <ul>
        ${scenario.keyBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
      </ul>
    </div>

    <div class="scenario-considerations">
      <h4>Considerations</h4>
      <ul>
        ${scenario.considerations.map(consideration => `<li>${consideration}</li>`).join('')}
      </ul>
    </div>

    <button class="scenario-action-btn" onclick="viewScenarioDetails('${type}')">View Full Analysis</button>
  `;
}

// Render comparison chart
function renderComparisonChart() {
  const ctx = document.getElementById('comparisonChart').getContext('2d');

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const labels = ['Conservative', 'Moderate', 'Aggressive'];
  const investments = [
    scenariosData.conservative.totalInvestment,
    scenariosData.moderate.totalInvestment,
    scenariosData.aggressive.totalInvestment
  ];
  const revenueGrowth = [
    scenariosData.conservative.revenueImpact,
    scenariosData.moderate.revenueImpact,
    scenariosData.aggressive.revenueImpact
  ];

  comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Investment ($M)',
          data: investments,
          backgroundColor: 'rgba(33, 150, 243, 0.8)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Revenue Growth (%)',
          data: revenueGrowth,
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
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
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (context.datasetIndex === 0) {
                  label += '$' + context.parsed.y + 'M';
                } else {
                  label += '+' + context.parsed.y + '%';
                }
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
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return '$' + value + 'M';
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Revenue Growth (%)',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: function(value) {
              return '+' + value + '%';
            }
          }
        }
      }
    }
  });
}

// View scenario details
window.viewScenarioDetails = async function(scenarioType) {
  const scenario = scenariosData[scenarioType];
  const equipmentData = await ipcRenderer.invoke('load-equipment-data');

  const includedLines = equipmentData.filter(item =>
    scenario.linesIncluded.includes(item.id)
  );

  const modal = document.getElementById('scenario-modal');
  const content = document.getElementById('scenario-detail-content');

  content.innerHTML = `
    <h2>${scenario.name} - Detailed Analysis</h2>
    <p class="scenario-detail-description">${scenario.description}</p>

    <div class="detail-summary">
      <div class="summary-item">
        <label>Total Investment</label>
        <value>$${scenario.totalInvestment}M</value>
      </div>
      <div class="summary-item">
        <label>Production Lines</label>
        <value>${scenario.productionLines}</value>
      </div>
      <div class="summary-item">
        <label>Revenue Impact</label>
        <value>+${scenario.revenueImpact}%</value>
      </div>
      <div class="summary-item">
        <label>Payback Period</label>
        <value>${scenario.paybackPeriod} years</value>
      </div>
      <div class="summary-item">
        <label>Risk Level</label>
        <value>${scenario.riskLevel}</value>
      </div>
      <div class="summary-item">
        <label>Market Position</label>
        <value>${scenario.marketPosition}</value>
      </div>
    </div>

    <h3>Included Production Lines</h3>
    <div class="production-lines-table">
      <table>
        <thead>
          <tr>
            <th>Line Name</th>
            <th>Category</th>
            <th>Investment</th>
            <th>Impact Score</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          ${includedLines.map(line => `
            <tr>
              <td>${line.name}</td>
              <td>${line.category}</td>
              <td>$${line.investment}M</td>
              <td>${line.impactScore}</td>
              <td><span class="priority-badge priority-${line.priority.toLowerCase()}">${line.priority}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="benefits-considerations-grid">
      <div>
        <h3>Key Benefits</h3>
        <ul>
          ${scenario.keyBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h3>Considerations</h3>
        <ul>
          ${scenario.considerations.map(consideration => `<li>${consideration}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  modal.style.display = 'block';
};

// Close modal
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('scenario-modal');
  const closeBtn = document.getElementById('close-scenario-modal');

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});

// Initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModule3);
} else {
  initModule3();
}
