"""
Pyrolysis Prediction API - Flask Backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ========== LOOKUP TABLE ==========
LOOKUP_TABLE = {
    "2|300|15": 50.45, "2|450|15": 46.71, "2|600|15": 46.28,
    "1|300|15": 49.55, "1|300|10": 45.61, "2|450|10": 42.28,
    "1|450|15": 46.71, "1|450|5": 43.54, "1|450|10": 30.90,
    "2|600|5": 36.74, "1|600|5": 39.31, "1|600|10": 42.70,
    "2|450|5": 42.28, "2|600|10": 41.15
}
DEFAULT_YIELD = 42.5

def calculate_specs(oil_yield):
    ratio = (oil_yield - 27.26) / (54.76 - 27.26)
    return {
        'hhv': round(31.2 + ratio * 9, 1),
        'viscosity': round(0.2 + ratio * 20.49, 2),
        'biochar': round(46.75 - ratio * 31.84, 1)
    }

def get_evaluation(oil_yield):
    if oil_yield >= 48: return {'text': '🌟🌟🌟 EXCELLENT!', 'class': 'excellent'}
    elif oil_yield >= 40: return {'text': '🌟🌟 GOOD', 'class': 'good'}
    elif oil_yield >= 30: return {'text': '⚠️ AVERAGE', 'class': 'poor'}
    return {'text': '❌ POOR', 'class': 'bad'}

def calc_environmental(oil_yield):
    return {
        'tires_processed': f"{int(1000 + (oil_yield-30)*50):,}",
        'co2_reduced': f"{int((100000 + (oil_yield-30)*2000)/1000)}k",
        'oil_produced': f"{int((40000 + (oil_yield-30)*500)/1000)}k",
        'trees_equivalent': f"{int((5000 + (oil_yield-30)*100)/1000)}k"
    }

def calc_economic(oil_yield):
    revenue = int(800 + (oil_yield-30)*10)
    cost = int(500 + (oil_yield-30)*4)
    return {'revenue': revenue, 'cost': cost, 'profit': revenue-cost, 'jobs': int(35 + (oil_yield-30)*0.5)}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        key = f"{data.get('catalyst','2')}|{data.get('power','450')}|{data.get('susceptor','15')}"
        oil_yield = LOOKUP_TABLE.get(key, DEFAULT_YIELD)
        
        specs = calculate_specs(oil_yield)
        evaluation = get_evaluation(oil_yield)
        
        return jsonify({
            'success': True,
            'prediction': {'oil_yield': round(oil_yield, 2), 'unit': 'wt%'},
            'specifications': {
                'hhv': {'value': specs['hhv'], 'unit': 'MJ/kg'},
                'viscosity': {'value': specs['viscosity'], 'unit': 'cP'},
                'biochar': {'value': specs['biochar'], 'unit': 'wt%'}
            },
            'evaluation': evaluation,
            'environmental': calc_environmental(oil_yield),
            'economic': calc_economic(oil_yield),
            'optimal_note': '🎉 Optimal!' if oil_yield >= 48 else '💡 Try 300W-2g-15g'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Server running at http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=True)