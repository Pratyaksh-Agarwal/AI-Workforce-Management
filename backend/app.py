from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os
from datetime import datetime

from scheduler import generate_schedule
from model import predict_workload, classify_employee, train_model, seed_workload_csv
from data_service import fetch_external_data, get_workload_df, reset_cache

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR       = os.path.join(os.path.dirname(__file__), 'data')
EMPLOYEES_FILE = os.path.join(DATA_DIR, 'employees.csv')
WORKLOAD_FILE  = os.path.join(DATA_DIR, 'workload.csv')


# ── Train model at startup ──────────────────────────────────────────────────
seed_workload_csv()   # no-op if file already exists
train_model()         # trains once, caches in memory


# ── Employees ───────────────────────────────────────────────────────────────
@app.route('/api/employees', methods=['GET'])
def get_employees():
    df = fetch_external_data()
    if df.empty:
        return jsonify([])
    return jsonify(df.to_dict(orient='records'))


# ── Workload ────────────────────────────────────────────────────────────────
@app.route('/api/workload', methods=['GET'])
def get_workload():
    df = get_workload_df()
    return jsonify(df.to_dict(orient='records'))


# ── Schedule ────────────────────────────────────────────────────────────────
@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date required'}), 400

    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    df = fetch_external_data()
    if df.empty:
        return jsonify({'error': 'No employee data available'}), 500

    day_of_week = date_obj.weekday()
    week_number = date_obj.isocalendar()[1]
    month       = date_obj.month

    schedule = []
    for _, row in df.iterrows():
        score  = predict_workload(
            row['hours_worked'], row['tasks_completed'],
            day_of_week, week_number, month
        )
        status = classify_employee(row['hours_worked'], row['department'])
        shift  = (
            'Morning' if row['hours_worked'] < 7 else
            'Evening' if row['hours_worked'] < 10 else
            'Night'
        )
        schedule.append({
            'id':              row['employee_id'],
            'name':            row['name'],
            'skill':           row['department'],
            'role':            row.get('role', ''),
            'shift':           shift,
            'hours_worked':    round(row['hours_worked'], 1),
            'tasks_completed': int(row['tasks_completed']),
            'workload_score':  score,
            'status':          status,
        })

    # Sort: overloaded first so they're visible at top
    order = {'Overloaded': 0, 'Normal': 1, 'Underutilized': 2}
    schedule.sort(key=lambda x: order.get(x['status'], 1))

    return jsonify({
        'date':             date_str,
        'predicted_demand': len(schedule),
        'schedule':         schedule,
    })


## Remove these two lines from the top of app.py:
# import anthropic
# client = anthropic.Anthropic(...)

# Replace the explain-assignment route with this:
from model import predict_workload, classify_employee, train_model, seed_workload_csv, generate_explanation

@app.route('/api/explain-assignment', methods=['POST'])
def explain_assignment():
    data       = request.json
    employee   = data.get('employee',   'Unknown')
    department = data.get('department', 'Unknown')
    shift      = data.get('shift',      'Unknown')
    hours      = float(data.get('hours_worked',    0))
    tasks      = int(data.get('tasks_completed',   0))
    status     = data.get('status',     'Normal')
    score      = float(data.get('workload_score',  0))

    try:
        explanation = generate_explanation(
            employee, department, shift, hours, tasks, status, score
        )
        return jsonify({'explanation': explanation})
    except Exception as e:
        print(f"explain error: {e}")
        return jsonify({'error': str(e)}), 500
# ── AI insights ──────────────────────────────────────────────────────────────
@app.route('/api/ai-insights', methods=['GET'])
def ai_insights():
    df = fetch_external_data()
    if df.empty:
        return jsonify([])

    date_obj    = datetime.now()
    day_of_week = date_obj.weekday()
    week_number = date_obj.isocalendar()[1]
    month       = date_obj.month

    results = []
    for _, row in df.iterrows():
        score  = predict_workload(
            row['hours_worked'], row['tasks_completed'],
            day_of_week, week_number, month
        )
        status = classify_employee(row['hours_worked'], row['department'])
        results.append({
            'name':              row['name'],
            'department':        row['department'],
            'hours_worked':      round(row['hours_worked'], 1),
            'tasks_completed':   int(row['tasks_completed']),
            'predicted_workload': score,
            'status':            status,
        })

    return jsonify(results)


# ── Department analytics ─────────────────────────────────────────────────────
@app.route('/api/department-analytics', methods=['GET'])
def department_analytics():
    df = fetch_external_data()
    if df.empty:
        return jsonify([])

    stats = []
    for dept, group in df.groupby('department'):
        avg_hours    = group['hours_worked'].mean()
        overloaded   = int((group['hours_worked'] > 9).sum())
        underutilized = int((group['hours_worked'] < 5).sum())
        normal       = len(group) - overloaded - underutilized
        std          = group['hours_worked'].std() or 0
        risk_score   = min(100, int(
            (overloaded / len(group)) * 60 +
            (avg_hours / 13) * 30 +
            (std / 4) * 10
        ))
        stats.append({
            'department':    dept,
            'staff_count':   len(group),
            'avg_hours':     round(avg_hours, 2),
            'overloaded':    overloaded,
            'normal':        normal,
            'underutilized': underutilized,
            'burnout_risk':  risk_score,
        })

    stats.sort(key=lambda x: x['burnout_risk'], reverse=True)
    return jsonify(stats)


# ── External data (raw) ───────────────────────────────────────────────────────
@app.route('/api/external-data', methods=['GET'])
def get_external_data():
    df = fetch_external_data()
    return jsonify(df.to_dict(orient='records'))


# ── Cache reset (dev utility) ─────────────────────────────────────────────────
@app.route('/api/reset-cache', methods=['POST'])
def reset():
    reset_cache()
    return jsonify({'status': 'cache cleared'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)