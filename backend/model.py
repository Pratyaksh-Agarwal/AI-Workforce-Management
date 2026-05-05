import pandas as pd
import numpy as np
import os
import random
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split

model_cache = None
explanation_model_cache = None

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
WORKLOAD_FILE = os.path.join(DATA_DIR, 'workload.csv')

DEPT_BASELINES = {
    'Engineering':              8.5,
    'Support':                  7.0,
    'Marketing':                6.5,
    'Human Resources':          6.0,
    'Research and Development': 9.0,
    'Product Management':       7.5,
    'Accounting':               7.0,
    'Legal':                    8.0,
    'Business Development':     7.5,
    'Services':                 7.0,
}

SHIFT_RULES = {
    'Morning': {'min_hours': 0,  'max_hours': 6.9},
    'Evening': {'min_hours': 7,  'max_hours': 9.9},
    'Night':   {'min_hours': 10, 'max_hours': 13},
}

DEPT_SHIFT_PREFERENCE = {
    'Engineering':              'Night',
    'Support':                  'Morning',
    'Marketing':                'Morning',
    'Human Resources':          'Morning',
    'Research and Development': 'Evening',
    'Product Management':       'Evening',
    'Accounting':               'Morning',
    'Legal':                    'Evening',
    'Business Development':     'Evening',
    'Services':                 'Morning',
}


def classify_employee(hours, department=''):
    baseline = DEPT_BASELINES.get(department, 7.5)
    if hours > baseline + 1.5:
        return 'Overloaded'
    elif hours < baseline - 2.5:
        return 'Underutilized'
    return 'Normal'


def generate_explanation(employee, department, shift, hours, tasks, status, score):
    """
    Generate a plain-English explanation using rules trained on
    department baselines, shift logic, and workload score.
    No external API needed.
    """
    baseline   = DEPT_BASELINES.get(department, 7.5)
    preferred  = DEPT_SHIFT_PREFERENCE.get(department, 'Morning')
    shift_match = shift == preferred

    # ── Status sentence ──────────────────────────────────────────────
    if status == 'Overloaded':
        status_line = (
            f"{employee} is currently overloaded with {hours:.1f} hours worked "
            f"(baseline for {department} is {baseline}h), "
            f"so they were assigned the {shift} shift to manage peak coverage demand."
        )
    elif status == 'Underutilized':
        status_line = (
            f"{employee} is underutilized at {hours:.1f} hours "
            f"against a {baseline}h baseline for {department}, "
            f"making the {shift} shift a suitable assignment to balance team load."
        )
    else:
        status_line = (
            f"{employee} has a healthy workload of {hours:.1f} hours "
            f"(normal range for {department} is ~{baseline}h), "
            f"and was assigned the {shift} shift to maintain consistent coverage."
        )

    # ── Shift reasoning sentence ──────────────────────────────────────
    if shift_match:
        shift_line = (
            f"The {shift} shift aligns with the preferred coverage window "
            f"for {department}, and their workload score of {score:.1f} "
            f"confirms they are well-suited for this slot."
        )
    else:
        shift_line = (
            f"Although {department} typically prefers {preferred} shifts, "
            f"the {shift} assignment was chosen based on a workload score "
            f"of {score:.1f} and current team availability."
        )

    # ── Tasks addendum ────────────────────────────────────────────────
    if tasks >= 8:
        task_line = f"With {tasks} tasks completed, {employee} has demonstrated high output this period."
    elif tasks <= 3:
        task_line = f"Task count is low at {tasks}, so this shift helps redistribute workload evenly."
    else:
        task_line = f"Their {tasks} completed tasks reflect a steady contribution to the team."

    return f"{status_line} {shift_line} {task_line}"


def get_training_data():
    if not os.path.exists(WORKLOAD_FILE):
        seed_workload_csv()

    df_wl = pd.read_csv(WORKLOAD_FILE)
    df_wl['date']        = pd.to_datetime(df_wl['date'])
    df_wl['day_of_week'] = df_wl['date'].dt.dayofweek
    df_wl['week_number'] = df_wl['date'].dt.isocalendar().week.astype(int)
    df_wl['month']       = df_wl['date'].dt.month

    rows = []
    for _, wl_row in df_wl.iterrows():
        for _ in range(random.randint(5, 10)):
            dept     = random.choice(list(DEPT_BASELINES.keys()))
            baseline = DEPT_BASELINES[dept]
            hours    = round(max(2, min(13, random.gauss(baseline, 1.5))), 1)
            tasks    = max(1, min(12, int(random.gauss(5, 2))))
            rows.append({
                'demand':          wl_row['demand'],
                'day_of_week':     wl_row['day_of_week'],
                'week_number':     wl_row['week_number'],
                'month':           wl_row['month'],
                'hours_worked':    hours,
                'tasks_completed': tasks,
                'workload_score':  hours * 0.6 + tasks * 0.4,
            })

    return pd.DataFrame(rows)


def train_model():
    global model_cache
    if model_cache is not None:
        return model_cache

    df = get_training_data()
    if df.empty:
        return None

    features = ['hours_worked', 'tasks_completed', 'day_of_week', 'week_number', 'month']
    X = df[features]
    y = df['workload_score']

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    model_cache = model
    print("Model trained successfully.")
    return model


def predict_workload(hours, tasks, day_of_week=0, week_number=1, month=1):
    model = train_model()
    if model is None:
        return round(hours * 0.6 + tasks * 0.4, 2)
    try:
        X = pd.DataFrame(
            [[hours, tasks, day_of_week, week_number, month]],
            columns=['hours_worked', 'tasks_completed', 'day_of_week', 'week_number', 'month']
        )
        return round(float(model.predict(X)[0]), 2)
    except Exception as e:
        print(f"predict_workload error: {e}")
        return round(hours * 0.6 + tasks * 0.4, 2)


def seed_workload_csv():
    os.makedirs(DATA_DIR, exist_ok=True)
    dates = pd.date_range(start='2026-01-01', periods=90, freq='D')
    rows  = []
    for d in dates:
        dow    = d.dayofweek
        base   = 12 if dow == 0 else 11 if dow < 5 else 7
        demand = max(5, int(random.gauss(base, 1.5)))
        rows.append({'date': d.strftime('%Y-%m-%d'), 'demand': demand})
    pd.DataFrame(rows).to_csv(WORKLOAD_FILE, index=False)
    print(f"Seeded workload.csv with 90 days at {WORKLOAD_FILE}")

SKILL_SHIFT_MAP = {
    'Python':     ['Engineering', 'Research and Development'],
    'SQL':        ['Engineering', 'Accounting', 'Research and Development'],
    'Management': ['Human Resources', 'Product Management', 'Business Development'],
    'Support':    ['Support', 'Services'],
    'Legal':      ['Legal'],
    'Finance':    ['Accounting', 'Business Development'],
    'Marketing':  ['Marketing'],
    'Sales':      ['Business Development', 'Marketing'],
}

CERTIFICATION_REQUIREMENT = {
    'Engineering':              ['Python', 'SQL'],
    'Research and Development': ['Python', 'SQL'],
    'Legal':                    ['Legal'],
    'Accounting':               ['Finance', 'SQL'],
    'Human Resources':          ['Management'],
    'Product Management':       ['Management'],
    'Business Development':     ['Management', 'Sales'],
    'Marketing':                ['Marketing', 'Sales'],
    'Support':                  ['Support'],
    'Services':                 ['Support'],
}

def match_skill_to_department(skills_str, department):
    """
    Returns a match score 0-100 based on how well
    employee skills match department requirements.
    """
    if not skills_str or not department:
        return 50  # neutral score if no data

    employee_skills = [s.strip().lower() for s in skills_str.split(',')]
    required        = CERTIFICATION_REQUIREMENT.get(department, [])

    if not required:
        return 50

    matched = sum(
        1 for req in required
        if any(req.lower() in skill or skill in req.lower()
               for skill in employee_skills)
    )

    return round((matched / len(required)) * 100)