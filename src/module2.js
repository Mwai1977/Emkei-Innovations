const { ipcRenderer } = require('electron');
let productsData = [];
let weights = {
  marketDemand: 20,
  profitMargin: 20,
  technicalFeasibility: 20,
  competitivePosition: 20,
  regulatoryComplexity: 20
};

// Load data when module initializes
async function initModule2() {
  productsData = await ipcRenderer.invoke('load-products-data');
  setupWeightSliders();
  calculateAndRenderRankings();
}

// Setup weight sliders with real-time updates
function setupWeightSliders() {
  const sliders = ['marketDemand', 'profitMargin', 'technicalFeasibility', 'competitivePosition', 'regulatoryComplexity'];

  sliders.forEach(slider => {
    const element = document.getElementById(`${slider}-slider`);
    const valueDisplay = document.getElementById(`${slider}-value`);

    element.value = weights[slider];
    valueDisplay.textContent = weights[slider] + '%';

    element.addEventListener('input', function() {
      weights[slider] = parseInt(this.value);
      valueDisplay.textContent = weights[slider] + '%';
      normalizeWeights(slider);
      updateAllSliders();
      calculateAndRenderRankings();
    });
  });

  // Initialize normalize button
  document.getElementById('normalize-weights').addEventListener('click', function() {
    // Set all weights to equal values
    Object.keys(weights).forEach(key => {
      weights[key] = 20;
    });
    updateAllSliders();
    calculateAndRenderRankings();
  });
}

function normalizeWeights(changedSlider) {
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0);

  if (total !== 100) {
    const difference = total - 100;
    const otherSliders = Object.keys(weights).filter(key => key !== changedSlider);
    const adjustment = difference / otherSliders.length;

    otherSliders.forEach(key => {
      weights[key] = Math.max(0, Math.min(100, weights[key] - adjustment));
    });

    // Final normalization to ensure exactly 100%
    const newTotal = Object.values(weights).reduce((sum, val) => sum + val, 0);
    if (newTotal !== 100) {
      const finalAdjustment = 100 - newTotal;
      weights[otherSliders[0]] += finalAdjustment;
    }
  }
}

function updateAllSliders() {
  Object.keys(weights).forEach(key => {
    const slider = document.getElementById(`${key}-slider`);
    const display = document.getElementById(`${key}-value`);
    slider.value = Math.round(weights[key]);
    display.textContent = Math.round(weights[key]) + '%';
  });

  // Update total display
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
  document.getElementById('total-weight').textContent = Math.round(total) + '%';
}

// Calculate weighted scores and rankings
function calculateAndRenderRankings() {
  const rankedProducts = productsData.map(product => {
    const weightedScore =
      (product.marketDemand * weights.marketDemand / 100) +
      (product.profitMargin * weights.profitMargin / 100) +
      (product.technicalFeasibility * weights.technicalFeasibility / 100) +
      (product.competitivePosition * weights.competitivePosition / 100) +
      ((100 - product.regulatoryComplexity) * weights.regulatoryComplexity / 100);

    return {
      ...product,
      weightedScore: weightedScore
    };
  }).sort((a, b) => b.weightedScore - a.weightedScore);

  renderRankingsTable(rankedProducts);
  updateWeightDisplay();
}

function renderRankingsTable(rankedProducts) {
  const tbody = document.getElementById('rankings-tbody');
  tbody.innerHTML = '';

  rankedProducts.forEach((product, index) => {
    const rank = index + 1;
    const priorityBadge = getPriorityBadge(rank);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="rank-cell">${rank}</td>
      <td class="product-name">${product.name}</td>
      <td>${product.type}</td>
      <td class="score-cell">${product.weightedScore.toFixed(1)}</td>
      <td><span class="priority-badge priority-${priorityBadge.class}">${priorityBadge.text}</span></td>
      <td>${product.estimatedInvestment}</td>
      <td class="details-cell">
        <button class="details-btn" onclick="showProductDetails(${product.id})">View Details</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getPriorityBadge(rank) {
  if (rank <= 4) {
    return { text: 'High Priority', class: 'high' };
  } else if (rank <= 8) {
    return { text: 'Medium Priority', class: 'medium' };
  } else {
    return { text: 'Low Priority', class: 'low' };
  }
}

function updateWeightDisplay() {
  document.getElementById('total-weight').textContent = '100%';
}

// Show product details
window.showProductDetails = function(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('product-detail-content');

  content.innerHTML = `
    <h3>${product.name}</h3>
    <p class="product-type">${product.type}</p>

    <div class="product-metrics">
      <div class="metric-card">
        <label>Market Demand</label>
        <div class="metric-bar">
          <div class="metric-fill" style="width: ${product.marketDemand}%"></div>
        </div>
        <span>${product.marketDemand}/100</span>
      </div>

      <div class="metric-card">
        <label>Profit Margin</label>
        <div class="metric-bar">
          <div class="metric-fill" style="width: ${product.profitMargin}%"></div>
        </div>
        <span>${product.profitMargin}/100</span>
      </div>

      <div class="metric-card">
        <label>Technical Feasibility</label>
        <div class="metric-bar">
          <div class="metric-fill" style="width: ${product.technicalFeasibility}%"></div>
        </div>
        <span>${product.technicalFeasibility}/100</span>
      </div>

      <div class="metric-card">
        <label>Competitive Position</label>
        <div class="metric-bar">
          <div class="metric-fill" style="width: ${product.competitivePosition}%"></div>
        </div>
        <span>${product.competitivePosition}/100</span>
      </div>

      <div class="metric-card">
        <label>Regulatory Complexity</label>
        <div class="metric-bar">
          <div class="metric-fill complexity" style="width: ${product.regulatoryComplexity}%"></div>
        </div>
        <span>${product.regulatoryComplexity}/100 (lower is better)</span>
      </div>
    </div>

    <div class="product-production">
      <h4>Production Capacity</h4>
      <div class="production-row">
        <div>
          <label>Current Production</label>
          <value>${product.currentProduction}</value>
        </div>
        <div>
          <label>Potential Production</label>
          <value>${product.potentialProduction}</value>
        </div>
      </div>
    </div>

    <div class="product-investment">
      <h4>Estimated Investment</h4>
      <value class="investment-amount">${product.estimatedInvestment}</value>
    </div>
  `;

  modal.style.display = 'block';
};

// Close modal
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('product-modal');
  const closeBtn = document.getElementById('close-modal');

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
  document.addEventListener('DOMContentLoaded', initModule2);
} else {
  initModule2();
}
