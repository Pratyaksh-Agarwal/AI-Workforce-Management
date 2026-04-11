import requests
import random
import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
EMPLOYEES_FILE = os.path.join(DATA_DIR, 'employees.csv')
WORKLOAD_FILE  = os.path.join(DATA_DIR, 'workload.csv')

DEPT_BASELINES = {
    'Engineering': 8.5, 'Support': 7.0, 'Marketing': 6.5,
    'Human Resources': 6.0, 'Research and Development': 9.0,
    'Product Management': 7.5, 'Accounting': 7.0,
    'Legal': 8.0, 'Business Development': 7.5, 'Services': 7.0,
}

_employee_cache = None

def fetch_external_data():
    """
    Fetch 100 real users from dummyjson, enrich with realistic work metrics.
    Caches in memory so repeated calls in the same request don't re-fetch.
    Falls back to local employees.csv if the API is unreachable.
    """
    global _employee_cache
    if _employee_cache is not None:
        return _employee_cache

    try:
        resp = requests.get('https://dummyjson.com/users?limit=100', timeout=6)
        resp.raise_for_status()
        users = resp.json()['users']

        rows = []
        for u in users:
            dept = u['company']['department']
            baseline = DEPT_BASELINES.get(dept, 7.5)
            hours = round(random.gauss(baseline, 1.5), 1)
            hours = max(2, min(13, hours))
            tasks = max(1, min(12, int(random.gauss(5, 2))))

            rows.append({
                'employee_id':     u['id'],
                'name':            f"{u['firstName']} {u['lastName']}",
                'department':      dept,
                'company':         u['company']['name'],
                'role':            u['company']['title'],
                'age':             u['age'],
                'hours_worked':    hours,
                'tasks_completed': tasks,
            })

        df = pd.DataFrame(rows)
        _employee_cache = df

        # Persist to CSV so the app works offline next time
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(EMPLOYEES_FILE, index=False)
        return df

    except Exception as e:
        print(f"fetch_external_data API failed: {e} — falling back to CSV")
        if os.path.exists(EMPLOYEES_FILE):
            return pd.read_csv(EMPLOYEES_FILE)
        return pd.DataFrame()


def get_workload_df():
    """Return workload.csv as a DataFrame, seeding it first if missing."""
    if not os.path.exists(WORKLOAD_FILE):
        from model import seed_workload_csv
        seed_workload_csv()
    return pd.read_csv(WORKLOAD_FILE)


def reset_cache():
    """Call this to force a fresh API pull on next request."""
    global _employee_cache
    _employee_cache = None