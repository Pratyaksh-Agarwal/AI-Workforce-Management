import requests
import pandas as pd
import random

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
                "hours_worked": random.randint(4, 12),
                "tasks_completed": random.randint(1, 10),
                "age": user["age"]
            })

        return pd.DataFrame(data)

    return pd.DataFrame()