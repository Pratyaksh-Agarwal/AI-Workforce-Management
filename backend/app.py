from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os

from model import predict_demand
from scheduler import generate_schedule
import google.generativeai as genai

app = Flask(__name__)
# Enable CORS for the frontend application
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
EMPLOYEES_FILE = os.path.join(DATA_DIR, 'employees.csv')
WORKLOAD_FILE = os.path.join(DATA_DIR, 'workload.csv')

@app.route('/api/employees', methods=['GET'])
def get_employees():
    if not os.path.exists(EMPLOYEES_FILE):
        return jsonify([])
    df = pd.read_csv(EMPLOYEES_FILE)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/workload', methods=['GET'])
def get_workload():
    if not os.path.exists(WORKLOAD_FILE):
        return jsonify([])
    df = pd.read_csv(WORKLOAD_FILE)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required (YYYY-MM-DD)'}), 400
        
    demand = predict_demand(date_str)
    if demand is None:
        return jsonify({'error': 'Error predicting demand'}), 500
        
    schedule = generate_schedule(demand, date_str)
    
    return jsonify({
        'date': date_str,
        'predicted_demand': demand,
        'schedule': schedule
    })

@app.route('/api/explain', methods=['POST'])
def explain_decision():
    data = request.json
    employee_name = data.get('name')
    shift = data.get('shift')
    skill = data.get('skill')
    
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return jsonify({'explanation': f"Nurse {employee_name} was assigned to the {shift} shift to ensure optimal coverage of {skill} skills during peak hours and align with their availability preferences. (Mock Explanation - Set GEMINI_API_KEY for real AI)"})
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"Explain in 1-2 short sentences why employee {employee_name} with skill '{skill}' was assigned to the {shift} shift in a hospital workforce scheduling system. Frame it as if you are the AI system that made the decision."
        response = model.generate_content(prompt)
        return jsonify({'explanation': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
