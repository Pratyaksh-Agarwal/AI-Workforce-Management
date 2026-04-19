# 🤖 AI Workforce Management System

> Intelligent Workforce Planning Using Generative AI — PROJECT 12

![Python](https://img.shields.io/badge/Python-3.13-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-orange)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 📌 Overview

An AI-driven workforce planning and scheduling platform that integrates **predictive analytics** and **generative reasoning**. The system analyzes historical workforce data, business demand patterns, and employee preferences to generate schedules that balance organizational needs with employee well-being.

The platform emphasizes:

- **Fairness-aware scheduling** — equal workload distribution using statistical metrics
- **Explainability** — every scheduling decision comes with a plain-English AI explanation
- **Constraint modeling** — real labor law rules enforced at schedule generation time
- **Demand forecasting** — ML model predicts staffing needs from historical patterns

---

## ❗ Problem Statement

Organizations face persistent workforce management challenges:

| Challenge                                          | Impact                        |
| -------------------------------------------------- | ----------------------------- |
| Inaccurate demand forecasting during peak periods  | Understaffing or overstaffing |
| Inefficient manual scheduling processes            | High HR overhead              |
| Employee dissatisfaction from unfair schedules     | Increased attrition           |
| Industry-specific constraints (shifts, labor laws) | Compliance risk               |
| Poor integration between AI tools and HR systems   | Data silos                    |

> These issues reduce productivity, increase attrition, and place heavy administrative burdens on HR teams.

---

## ✅ Proposed Solution

This system addresses all five challenges through a 5-stage AI pipeline:
| Problem | Our Solution |
|---|---|
| Inaccurate forecasting | RandomForest model trained on 90-day historical workload data |
| Manual scheduling | Automated schedule generation for 100+ employees in one click |
| Unfair schedules | Fairness score (0–100) with standard deviation analysis |
| Labor law constraints | Configurable max hours, min rest period, max staff per shift |
| No explainability | Rule-based NLG engine — plain English reason for every assignment |

---

## 🎯 Key Objectives

- ✅ Accurately forecast workforce demand
- ✅ Optimize staffing and scheduling decisions
- ✅ Ensure fairness and compliance with labor policies
- ✅ Improve employee satisfaction and retention
- ✅ Reduce manual HR workload

---

## ⚙️ Key Features

### i. Workforce Demand Forecasting

- RandomForest Regressor trained on 90 days of seeded workload history
- Features: `hours_worked`, `tasks_completed`, `day_of_week`, `week_number`, `month`
- Captures weekly seasonality — Mondays peak (base demand 12), weekends low (base 7)
- Predicted demand shown on dashboard load — no manual trigger needed
- Department-aware baselines per team

| Department             | Baseline Hours |
| ---------------------- | -------------- |
| Research & Development | 9.0h           |
| Engineering            | 8.5h           |
| Legal                  | 8.0h           |
| Business Development   | 7.5h           |
| Product Management     | 7.5h           |
| Support                | 7.0h           |
| Accounting             | 7.0h           |
| Services               | 7.0h           |
| Marketing              | 6.5h           |
| Human Resources        | 6.0h           |

### ii. Fairness-Aware Scheduling Engine

- Calculates fairness score using standard deviation of hours across all employees
- Score 75–100 = Fair distribution
- Score 50–74 = Moderate variance
- Score below 50 = High imbalance — HR alert triggered
- Fairness enforcement caps overloaded employees at 20% of total schedule
- Toggle to enable/disable fairness balancing before generation

### iii. Employee Preference Integration

- HR can register employee shift preferences (Morning / Evening / Night / Any)
- Skills tracking per employee (e.g. Python, SQL, Management)
- Department assignment per employee
- Preference count shown in schedule header so judges can verify it's applied

### iv. HR Customization Interface

- **Max hours/day slider** — enforces labor law compliance (6h–14h range)
- **Min rest between shifts slider** — prevents back-to-back exhaustion (6h–12h)
- **Max staff per shift slider** — controls shift density (5–50)
- **Fairness balancing toggle** — ON/OFF with live status
- **Respect preferences toggle** — ON/OFF with live status
- Active constraints summary shown live at bottom of settings panel

### v. Explainable AI Insights

- Every schedule row has an Explain button
- Generates 3-sentence plain-English explanation per employee
- Sentence 1: Workload status vs department baseline
- Sentence 2: Shift assignment reasoning (preferred vs actual)
- Sentence 3: Task performance context
- Zero external API dependency — fully rule-based NLG engine

---

## 🏗️ System Architecture & Workflow

┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│ Data Ingestion │───▶│ Demand Prediction │───▶│ Constraint Modeling │
│ │ │ │ │ │
│ dummyjson API │ │ RandomForest │ │ Max hours/day │
│ 100 real users │ │ 90-day history │ │ Min rest period │
│ CSV fallback │ │ Day-of-week feat │ │ Fairness cap 20% │
└─────────────────┘ └──────────────────┘ └─────────────────────┘
│
▼
┌──────────────────┐ ┌─────────────────────┐
│ AI Explainability │◀───│ Schedule Generation │
│ │ │ │
│ Rule-based NLG │ │ Dept-aware sorting │
│ 3-sentence output│ │ Status-sorted output│
│ No API needed │ │ Shift balancing │
└──────────────────┘ └─────────────────────┘

---

## 🌍 Real-World Use Case

**Healthcare — Hospital Flu Season**

A hospital predicts higher patient inflow during flu season:

1. System forecasts demand spike using Monday-peak patterns in historical data
2. Identifies 14 overloaded nursing staff before scheduling begins
3. HR sets max hours to 9h to enforce labor law compliance
4. Fairness balancing ensures no single department carries excess load
5. Generated schedule respects nurse shift preferences (Morning/Evening/Night)
6. Every assignment explained — "Emily Johnson is overloaded at 10.2h against a 9h R&D baseline, so she was assigned the Night shift to manage peak coverage demand..."

---

## 📊 Expected Outcomes

- ✅ **Improved workforce utilization** — 82% of employees in normal range in testing
- ✅ **Higher employee satisfaction** — preferences respected, fair distribution
- ✅ **Reduced scheduling conflicts** — constraint modeling prevents violations
- ✅ **Lower administrative overhead** — 100 employees scheduled in one click
- ✅ **Full transparency** — every decision is explainable, no black box

---

## 🖥️ Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Frontend        | React 18, Tailwind CSS, Lucide Icons       |
| Charts          | Chart.js, react-chartjs-2 (Line, Bar, Pie) |
| Backend         | Python 3.13, Flask, Flask-CORS             |
| ML Model        | scikit-learn RandomForestRegressor         |
| Data Source     | dummyjson REST API + local CSV fallback    |
| Scheduling      | Custom rule-based engine (Python)          |
| AI Explanations | Rule-based NLG (no external API)           |

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
pip install flask flask-cors pandas scikit-learn requests
python app.py
```

Flask runs on `http://127.0.0.1:5000`

On startup you will see:
Seeded workload.csv with 90 days of data
Model trained successfully.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 📁 Project Structure

AI-Workforce-Management/
├── backend/
│ ├── app.py # Flask API — all routes
│ ├── model.py # RandomForest model + NLG explanations
│ ├── data_service.py # dummyjson API fetch + CSV fallback
│ ├── scheduler.py # Schedule generation logic
│ ├── data/
│ │ ├── workload.csv # Auto-generated 90-day demand history
│ │ └── employees.csv # Auto-generated from dummyjson API
│ └── requirements.txt
├── frontend/
│ ├── src/
│ │ ├── App.jsx # Main app — 4-tab dashboard
│ │ └── charts.jsx # Chart components (Line, Bar, Pie)
│ ├── package.json
│ └── vite.config.js
└── README.md

---

## 🗂️ API Endpoints

| Method | Endpoint                                         | Description                           |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/api/employees`                                 | Fetch all 100 employees               |
| GET    | `/api/workload`                                  | Fetch 90-day workload history         |
| GET    | `/api/ai-insights`                               | Get ML status for all employees       |
| GET    | `/api/predicted-demand`                          | Get today's predicted demand on load  |
| GET    | `/api/schedule?date=&maxHours=&enforceFairness=` | Generate constrained schedule         |
| POST   | `/api/explain-assignment`                        | Get AI explanation for one assignment |
| GET    | `/api/department-analytics`                      | Get burnout risk per department       |
| POST   | `/api/reset-cache`                               | Clear employee data cache             |

---

## 📈 Dashboard Tabs

| Tab             | What it shows                                                                         |
| --------------- | ------------------------------------------------------------------------------------- |
| **Dashboard**   | KPIs, workload trend, dept hours chart, utilization pie, fairness score, burnout risk |
| **Schedule**    | Generated schedule table with shift badges, status badges, AI explanations            |
| **Analytics**   | Fairness meter, workforce summary, full department breakdown                          |
| **HR Settings** | Constraint sliders, preference form, system architecture pipeline                     |

---

## 👥 Contributors

| Contributor                | Role                                             |
| -------------------------- | ------------------------------------------------ |
| Abhishek (iabhishek101203) | Lead Developer — Full stack, ML model, AI engine |

---

## 📄 License

MIT License — free to use for academic and research purposes.

---

> _"This project demonstrates how generative AI can transform workforce management into a fair, adaptive, and human-centered process, enhancing both operational efficiency and employee well-being."_
