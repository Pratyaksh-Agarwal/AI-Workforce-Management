from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os
from datetime import datetime

from genai_engine import generate_genai_explanation
from scheduler import generate_schedule
from model import predict_workload, classify_employee, train_model, seed_workload_csv, generate_explanation
from data_service import fetch_external_data, get_workload_df, reset_cache
from tickets import (
    raise_ticket, update_ticket, edit_ticket, delete_ticket,
    get_tickets, get_approved_leaves, get_half_day_employees
)
from model import predict_workload, classify_employee, train_model, seed_workload_csv, generate_explanation, match_skill_to_department

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATA_DIR       = os.path.join(os.path.dirname(__file__), 'data')
EMPLOYEES_FILE = os.path.join(DATA_DIR, 'employees.csv')
WORKLOAD_FILE  = os.path.join(DATA_DIR, 'workload.csv')

seed_workload_csv()
train_model()


@app.route('/api/employees', methods=['GET'])
def get_employees():
    df = fetch_external_data()
    if df.empty:
        return jsonify([])
    return jsonify(df.to_dict(orient='records'))


@app.route('/api/workload', methods=['GET'])
def get_workload():
    df = get_workload_df()
    return jsonify(df.to_dict(orient='records'))


@app.route('/api/predicted-demand', methods=['GET'])
def predicted_demand():
    try:
        date_obj    = datetime.now()
        day_of_week = date_obj.weekday()
        week_number = date_obj.isocalendar()[1]
        month       = date_obj.month
        df = fetch_external_data()
        if df.empty:
            return jsonify({'predicted_demand': 0})
        count = 0
        for _, row in df.iterrows():
            status = classify_employee(row['hours_worked'], row['department'])
            if status != 'Underutilized':
                count += 1
        return jsonify({'predicted_demand': count})
    except Exception as e:
        print(f"predicted_demand error: {e}")
        return jsonify({'predicted_demand': 0})


@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date required'}), 400

    max_hours        = float(request.args.get('maxHours', 13))
    min_rest         = int(request.args.get('minRest', 8))
    max_per_shift    = int(request.args.get('maxPerShift', 100))
    enforce_fairness = request.args.get('enforceFairness', 'true').lower() == 'true'
    respect_prefs    = request.args.get('respectPreferences', 'true').lower() == 'true'

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

    approved_leaves = get_approved_leaves(date_str)
    half_day_emps   = get_half_day_employees(date_str)

    print(f"Approved leaves for {date_str}: {approved_leaves}")
    print(f"Half day for {date_str}: {half_day_emps}")

    all_employees  = []
    excluded_leave = 0
    excluded_hours = 0

    for _, row in df.iterrows():
        if row['name'] in approved_leaves:
            excluded_leave += 1
            continue

        score  = predict_workload(row['hours_worked'], row['tasks_completed'],
                                  day_of_week, week_number, month)
        status = classify_employee(row['hours_worked'], row['department'])

        if row['hours_worked'] > max_hours:
            excluded_hours += 1
            continue

        is_half_day = row['name'] in half_day_emps
        shift = 'Morning' if is_half_day else (
            'Morning' if row['hours_worked'] < 7 else
            'Evening' if row['hours_worked'] < 10 else
            'Night'
        )

        all_employees.append({
    'id':              row['employee_id'],
    'name':            row['name'],
    'skill':           row['department'],
    'role':            row.get('role', ''),
    'shift':           shift,
    'hours_worked':    round(row['hours_worked'], 1),
    'tasks_completed': int(row['tasks_completed']),
    'workload_score':  score,
    'status':          status,
    'half_day':        is_half_day,
    # ✅ new — skill match score for this employee's department
    'skill_match':     match_skill_to_department(
                           row.get('skills', ''), row['department']
                       ),
})

    if enforce_fairness:
        non_overloaded = [e for e in all_employees if e['status'] != 'Overloaded']
        overloaded     = [e for e in all_employees if e['status'] == 'Overloaded']
        max_overloaded = max(1, int(len(all_employees) * 0.20))
        all_employees  = non_overloaded + overloaded[:max_overloaded]

    shift_counts = {'Morning': 0, 'Evening': 0, 'Night': 0}
    schedule     = []
    for emp in all_employees:
        if shift_counts[emp['shift']] < max_per_shift:
            schedule.append(emp)
            shift_counts[emp['shift']] += 1

    order = {'Overloaded': 0, 'Normal': 1, 'Underutilized': 2}
    schedule.sort(key=lambda x: order.get(x['status'], 1))

    return jsonify({
        'date':             date_str,
        'predicted_demand': len(schedule),
        'schedule':         schedule,
        'constraints_applied': {
            'max_hours':      max_hours,
            'min_rest':       min_rest,
            'max_per_shift':  max_per_shift,
            'enforce_fairness': enforce_fairness,
            'respect_prefs':  respect_prefs,
            'filtered_out':   len(df) - len(schedule),
            'on_leave':       excluded_leave,
            'exceeded_hours': excluded_hours,
        }
    })


@app.route('/api/explain-assignment', methods=['POST'])
def explain_assignment():
    data = request.json

    explanation = generate_genai_explanation(
        employee = data.get('employee'),
        dept     = data.get('department'),
        shift    = data.get('shift'),
        hours    = data.get('hours_worked', 0),
        tasks    = data.get('tasks_completed', 0),
        score    = data.get('workload_score', 0),
        status   = data.get('status', 'Normal')
    )

    return jsonify({
        "explanation": explanation,
        "source": "genai-simulated"
    })


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
        score  = predict_workload(row['hours_worked'], row['tasks_completed'],
                                  day_of_week, week_number, month)
        status = classify_employee(row['hours_worked'], row['department'])
        results.append({
            'name':               row['name'],
            'department':         row['department'],
            'hours_worked':       round(row['hours_worked'], 1),
            'tasks_completed':    int(row['tasks_completed']),
            'predicted_workload': score,
            'status':             status,
        })
    return jsonify(results)


@app.route('/api/department-analytics', methods=['GET'])
def department_analytics():
    df = fetch_external_data()
    if df.empty:
        return jsonify([])
    stats = []
    for dept, group in df.groupby('department'):
        avg_hours     = group['hours_worked'].mean()
        overloaded    = int((group['hours_worked'] > 9).sum())
        underutilized = int((group['hours_worked'] < 5).sum())
        normal        = len(group) - overloaded - underutilized
        std           = group['hours_worked'].std() or 0
        risk_score    = min(100, int(
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


# ── Ticket routes ─────────────────────────────────────────────────────────────

@app.route('/api/tickets', methods=['GET'])
def list_tickets():
    status = request.args.get('status')
    date   = request.args.get('date')
    return jsonify(get_tickets(status, date))


@app.route('/api/tickets/summary', methods=['GET'])
def ticket_summary():
    all_tickets = get_tickets()
    return jsonify({
        'total':    len(all_tickets),
        'pending':  len([t for t in all_tickets if t['status'] == 'Pending']),
        'approved': len([t for t in all_tickets if t['status'] == 'Approved']),
        'rejected': len([t for t in all_tickets if t['status'] == 'Rejected']),
    })


@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    data   = request.json
    ticket = raise_ticket(
        employee_name = data.get('employee'),
        department    = data.get('department'),
        ticket_type   = data.get('type'),
        reason        = data.get('reason'),
        date          = data.get('date'),
    )
    return jsonify(ticket), 201


@app.route('/api/tickets/<int:ticket_id>', methods=['PATCH'])
def resolve_ticket(ticket_id):
    data         = request.json
    status       = data.get('status')
    manager_note = data.get('manager_note', '')
    result       = update_ticket(ticket_id, status, manager_note)
    return jsonify(result)


@app.route('/api/tickets/<int:ticket_id>', methods=['PUT'])
def edit_ticket_route(ticket_id):
    data   = request.json
    result = edit_ticket(ticket_id, data)
    return jsonify(result)


@app.route('/api/tickets/<int:ticket_id>', methods=['DELETE'])
def delete_ticket_route(ticket_id):
    result = delete_ticket(ticket_id)
    return jsonify(result)


# ── Utility ───────────────────────────────────────────────────────────────────

@app.route('/api/external-data', methods=['GET'])
def get_external_data():
    df = fetch_external_data()
    return jsonify(df.to_dict(orient='records'))


@app.route('/api/reset-cache', methods=['POST'])
def reset():
    reset_cache()
    return jsonify({'status': 'cache cleared'})
@app.route('/api/skill-match', methods=['POST'])
def skill_match():
    """Check if an employee's skills match a department's requirements."""
    from model import match_skill_to_department, CERTIFICATION_REQUIREMENT
    data       = request.json
    skills     = data.get('skills', '')
    department = data.get('department', '')
    score      = match_skill_to_department(skills, department)
    required   = CERTIFICATION_REQUIREMENT.get(department, [])
    return jsonify({
        'match_score': score,
        'required_skills': required,
        'department': department,
        'recommendation': (
            'Excellent match' if score >= 80 else
            'Good match'      if score >= 50 else
            'Partial match — consider training'
        )
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)