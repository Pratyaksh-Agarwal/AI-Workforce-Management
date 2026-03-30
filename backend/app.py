from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os
import requests
import random
from scheduler import generate_schedule
from model import predict_workload, classify_employee
from data_service import fetch_external_data
import google.generativeai as genai

app = Flask(__name__)
# Enable CORS for the frontend application
CORS(app, resources={r"/api/*": {"origins": "*"}})


def fetch_external_data():
    url = "https://dummyjson.com/users"
    response = requests.get(url)

    if response.status_code == 200:
        users = response.json()['users']

        data = []

        for user in users:
            data.append({
                "employee_id": user["id"],
                "name": user["firstName"],
                "department": user["company"]["department"],
                
                # simulate realistic work metrics
                "hours_worked": random.randint(4, 12),
                "tasks_completed": random.randint(1, 10),
                
                # optional
                "age": user["age"]
            })

        df = pd.DataFrame(data)
        return df

    return pd.DataFrame()

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
        return jsonify({'error': 'Date required'}), 400

    df = fetch_external_data()

    schedule = []

    for _, row in df.iterrows():
        schedule.append({
            "id": row["employee_id"],
            "name": row["name"],
            "skill": row["department"],
            "shift": "Morning" if row["hours_worked"] < 8 else "Evening"
        })

    return jsonify({
        "date": date_str,
        "predicted_demand": len(schedule),
        "schedule": schedule
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
    

@app.route('/api/external-data', methods=['GET'])
def get_external_data():
    df = fetch_external_data()
    return jsonify(df.to_dict(orient='records'))



@app.route('/api/ai-insights', methods=['GET'])
def ai_insights():
    df = fetch_external_data()

    if df.empty:
        return jsonify([])

    results = []

    for _, row in df.iterrows():
        workload = predict_workload(row['hours_worked'], row['tasks_completed'])
        status = classify_employee(row['hours_worked'])

        results.append({
            "name": row["name"],
            "hours_worked": row["hours_worked"],
            "tasks_completed": row["tasks_completed"],
            "predicted_workload": workload,
            "status": status
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
