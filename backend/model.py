import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

from data_service import fetch_external_data

model_cache = None

def train_model_from_api():
    global model_cache

    if model_cache is not None:
        return model_cache

    df = fetch_external_data()

    if df.empty:
        return None

    X = df[['hours_worked', 'tasks_completed']]

    df['workload_score'] = df['hours_worked'] * 0.7 + df['tasks_completed'] * 0.3
    y = df['workload_score']

    model = RandomForestRegressor()
    model.fit(X, y)

    model_cache = model
    return model


def classify_employee(hours):
    if hours > 9:
        return "Overloaded"
    elif hours < 5:
        return "Underutilized"
    else:
        return "Normal"


def predict_workload(hours, tasks):
    model = train_model_from_api()

    if model is None:
        return None

    prediction = model.predict(np.array([[hours, tasks]]))
    return float(prediction[0])