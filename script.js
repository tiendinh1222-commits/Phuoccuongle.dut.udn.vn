// ========== CONFIG ==========
const API_URL = 'http://127.0.0.1:5000';  // Backend local

let r2Chart, gaugeChart, daNangMap;
let currentYieldValue = 42.5;

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", function() {
    initR2Chart();
    initGaugeChart();
    initMap();
    predict();  // Gọi API lần đầu
    document.getElementById("catalyst").addEventListener("change", predict);
    document.getElementById("power").addEventListener("change", predict);
    document.getElementById("susceptor").addEventListener("change", predict);
});

function initR2Chart() {
    const ctx = document.getElementById('r2Chart').getContext('2d');
    r2Chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['DT', 'RF', 'ET', 'Ada', 'GBT', 'XGB'],
            datasets: [{
                data: [0.708, 0.985, 0.988, 0.918, 0.985, 0.987],
                backgroundColor: [
                    '#c0392b',  // DT - Đỏ đậm
                    '#16a085',  // RF - Xanh ngọc đậm
                    '#2980b9',  // ET - Xanh dương đậm
                    '#27ae60',  // Ada - Xanh lá đậm
                    '#e67e22',  // GBT - Cam đậm
                    '#8e44ad'   // XGB - Tím đậm
                ],
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#fff',
                barPercentage: 0.65
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            devicePixelRatio: 2.5,  // Tăng độ sắc nét
            plugins: { 
                legend: { display: false } 
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 1,
                    ticks: { 
                        font: { size: 10, weight: 'bold' }, 
                        color: '#1a5f2a',
                        stepSize: 0.2
                    },
                    grid: { color: '#c8e6c9' }
                }, 
                x: { 
                    ticks: { 
                        font: { size: 11, weight: 'bold' },  // TĂNG SIZE LABEL
                        color: '#1a5f2a',
                        padding: 5  // Tạo khoảng cách
                    },
                    grid: { display: false }
                } 
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,  // TĂNG PADDING DƯỚI
                    left: 5,
                    right: 5
                }
            }
        }
    });
}

function initGaugeChart() {
    const ctx = document.getElementById('gaugeChart').getContext('2d');
    gaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: { datasets: [{ data: [0, 100], backgroundColor: ['#4caf50', '#e0e0e0'], circumference: 180, rotation: 270, cutout: '70%' }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
    });
}

function updateGaugeChart(yieldValue) {
    let percentage = Math.min(100, Math.max(0, (yieldValue / 60) * 100));
    gaugeChart.data.datasets[0].data = [percentage, 100 - percentage];
    let color = yieldValue < 30 ? '#f44336' : (yieldValue < 40 ? '#ff9800' : (yieldValue < 48 ? '#2196f3' : '#4caf50'));
    gaugeChart.data.datasets[0].backgroundColor[0] = color;
    gaugeChart.update();
}

// ========== ANIMATE ==========
function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        element.innerHTML = (start + range * progress).toFixed(1) + '%';
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ========== GỌI API ==========
async function predict() {
    const catalyst = document.getElementById("catalyst").value;
    const power = document.getElementById("power").value;
    const susceptor = document.getElementById("susceptor").value;
    
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ catalyst, power, susceptor })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const oilYield = data.prediction.oil_yield;
            
            // Animate và cập nhật
            animateValue(document.getElementById("oilYield"), currentYieldValue, oilYield, 800);
            currentYieldValue = oilYield;
            
            document.getElementById("hhv").innerHTML = data.specifications.hhv.value;
            document.getElementById("cvOil").innerHTML = data.specifications.viscosity.value;
            document.getElementById("biochar").innerHTML = data.specifications.biochar.value;
            
            const evalEl = document.getElementById("evaluation");
            evalEl.innerHTML = data.evaluation.text;
            evalEl.className = `eval ${data.evaluation.class}`;
            
            document.getElementById("optimalNote").innerHTML = data.optimal_note;
            document.getElementById("tiresProcessed").innerHTML = data.environmental.tires_processed;
            document.getElementById("co2Reduced").innerHTML = data.environmental.co2_reduced;
            document.getElementById("oilProduced").innerHTML = data.environmental.oil_produced;
            document.getElementById("treesEquivalent").innerHTML = data.environmental.trees_equivalent;
            document.getElementById("revenue").innerHTML = data.economic.revenue;
            document.getElementById("cost").innerHTML = data.economic.cost;
            document.getElementById("profit").innerHTML = data.economic.profit;
            document.getElementById("jobs").innerHTML = data.economic.jobs;
            
            updateGaugeChart(oilYield);
        }
    } catch (error) {
        console.error('Lỗi kết nối backend:', error);
        // Fallback nếu backend chưa chạy
        fallbackPredict();
    }
}

// ========== FALLBACK ==========
function fallbackPredict() {
    const lookupTable = {
        "2|300|15": 50.45, "2|450|15": 46.71, "2|600|15": 46.28,
        "1|300|15": 49.55, "1|300|10": 45.61, "2|450|10": 42.28,
        "1|450|15": 46.71, "1|450|5": 43.54, "1|450|10": 30.90,
        "2|600|5": 36.74, "1|600|5": 39.31, "1|600|10": 42.70,
        "2|450|5": 42.28, "2|600|10": 41.15
    };
    const key = `${document.getElementById("catalyst").value}|${document.getElementById("power").value}|${document.getElementById("susceptor").value}`;
    const oilYield = lookupTable[key] || 42.5;
    
    document.getElementById("oilYield").innerHTML = oilYield.toFixed(1) + '%';
    let evalText = "", evalClass = "";
    if (oilYield >= 48) { evalText = "🌟🌟🌟 EXCELLENT!"; evalClass = "excellent"; }
    else if (oilYield >= 40) { evalText = "🌟🌟 GOOD"; evalClass = "good"; }
    else if (oilYield >= 30) { evalText = "⚠️ AVERAGE"; evalClass = "poor"; }
    else { evalText = "❌ POOR"; evalClass = "bad"; }
    
    const evalEl = document.getElementById("evaluation");
    evalEl.innerHTML = evalText;
    evalEl.className = `eval ${evalClass}`;
    document.getElementById("optimalNote").innerHTML = oilYield < 48 ? "💡 Try 300W-2g-15g" : "🎉 Optimal!";
    updateGaugeChart(oilYield);
    
    let ratio = (oilYield - 27.26) / (54.76 - 27.26);
    document.getElementById('hhv').innerHTML = (31.2 + ratio * 9).toFixed(1);
    document.getElementById('cvOil').innerHTML = (0.2 + ratio * 20.49).toFixed(2);
    document.getElementById('biochar').innerHTML = (46.75 - ratio * 31.84).toFixed(1);
}

// ========== MAP ==========
function initMap() {
    daNangMap = L.map('daNangMap').setView([16.0544, 108.2022], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM', subdomains: 'abcd', maxZoom: 18
    }).addTo(daNangMap);
    
    const points = [
        { name: "Chợ Cồn", lat: 16.0605, lng: 108.2208 },
        { name: "Phú Lộc", lat: 16.0742, lng: 108.1967 },
        { name: "Hòa Khánh", lat: 16.0891, lng: 108.1682 },
        { name: "Sơn Trà", lat: 16.1062, lng: 108.2778 },
        { name: "Non Nước", lat: 15.9967, lng: 108.2670 }
    ];
    
    const icon = L.divIcon({ html: '<div style="font-size: 14px;">📍</div>', iconSize: [14,14], popupAnchor: [0,-7] });
    points.forEach(p => { L.marker([p.lat, p.lng], { icon }).addTo(daNangMap).bindPopup(`<b>${p.name}</b><br>🎁 5 lốp = 1 cây`); });
}