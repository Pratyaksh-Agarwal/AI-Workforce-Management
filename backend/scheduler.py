import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
EMPLOYEES_FILE = os.path.join(DATA_DIR, 'employees.csv')

def generate_schedule(predicted_demand, date_str):
    if not os.path.exists(EMPLOYEES_FILE):
        return []
        
    df_emp = pd.read_csv(EMPLOYEES_FILE)
    
    # Simple rule-based scheduling (Greedy)
    demand_per_shift = max(1, predicted_demand // 3)
    
    schedule = []
    
    for shift in ['Morning', 'Evening', 'Night']:
        available = df_emp[df_emp['availability'] == shift]
        assigned = available.head(demand_per_shift)
        
        for _, row in assigned.iterrows():
            schedule.append({
                'id': row['id'],
                'name': row['name'],
                'skill': row['skill'],
                'shift': shift,
                'date': date_str
            })
            
    return schedule
