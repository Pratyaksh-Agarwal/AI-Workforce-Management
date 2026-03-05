import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np
import os

# Path to the data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
WORKLOAD_FILE = os.path.join(DATA_DIR, 'workload.csv')

def train_model():
    """Trains a simple linear regression model on historical workload data."""
    if not os.path.exists(WORKLOAD_FILE):
        raise FileNotFoundError(f"Workload data not found at: {WORKLOAD_FILE}")
    
    df = pd.read_csv(WORKLOAD_FILE)
    
    # Convert dates to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Create a simple feature: days since the first date in the dataset
    min_date = df['date'].min()
    df['days_since_start'] = (df['date'] - min_date).dt.days
    
    # Features (X) and Target (y)
    X = df[['days_since_start']]
    y = df['demand']
    
    # Train the model
    model = LinearRegression()
    model.fit(X, y)
    
    return model, min_date

def predict_demand(target_date_str):
    """Predicts the workforce demand for a given date string (YYYY-MM-DD)."""
    try:
        model, min_date = train_model()
    except Exception as e:
        print(f"Error training model: {e}")
        return None
        
    target_date = pd.to_datetime(target_date_str)
    days_since_start = (target_date - min_date).days
    
    # Predict using the trained model
    predicted_demand = model.predict(pd.DataFrame({'days_since_start': [days_since_start]}))
    
    # We round to the nearest whole number since we can't have a fraction of an employee
    return max(1, int(round(predicted_demand[0])))

if __name__ == "__main__":
    # Test the model with a date right after our dataset ends
    test_date = '2026-03-15'
    predicted = predict_demand(test_date)
    print(f"Predicted demand for {test_date}: {predicted} employees")
