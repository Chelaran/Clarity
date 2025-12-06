#pip install fastapi uvicorn pydantic prophet pandas numpy requests -q

import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime
import threading
import uvicorn
import requests
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional
import time

logging.getLogger('cmdstanpy').setLevel(logging.WARNING)
logging.getLogger('prophet').setLevel(logging.WARNING)

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super(NpEncoder, self).default(obj)

# --- 1. МОДЕЛЬ ДАННЫХ (POD Pydantic) ---
# Настраиваем под JSON от бэкенда
class Transaction(BaseModel):
    date: str
    amount: float
    category: str
    is_essential: bool = False # Бэкенд называет это is_essential

    # Pydantic их просто проигнорирует и не выдаст ошибку.
    class Config:
        extra = "ignore"

# --- 2. МОЗГИ СИСТЕМЫ (FinancialBrain) ---
class FinancialBrain:
    def __init__(self, df):
        self.df = df.copy()
        
        # 1. Обработка даты с Timezone (2025-12-09T00:00:00Z)
        # Мы превращаем её в datetime и убираем часовой пояс, чтобы не было конфликтов
        self.df['ds'] = pd.to_datetime(self.df['date']).dt.tz_localize(None)
        self.df['y'] = self.df['amount']
        
        # 2. Маппинг полей (is_essential -> is_mandatory)
        if 'is_essential' in self.df.columns:
            self.df['is_mandatory'] = self.df['is_essential']
        else:
            self.df['is_mandatory'] = False
        
        self.incomes = self.df[self.df['y'] > 0]
        self.expenses = self.df[self.df['y'] < 0]
        
        if not self.incomes.empty:
            self.monthly_income = self.incomes.set_index('ds').resample('M')['y'].sum().mean()
        else: self.monthly_income = 0.0
        
        if not self.expenses.empty:
            self.monthly_expense_total = abs(self.expenses.set_index('ds').resample('M')['y'].sum().mean())
        else: self.monthly_expense_total = 0.0

    def detect_mandatory_expenses(self):
        if self.expenses.empty: return 0.0, []
        
        # ML поиск
        stats = self.expenses.groupby('category')['y'].agg(['count', 'mean', 'std'])
        ml_detected = stats[
            (stats['count'] >= 3) & 
            (stats['std'].fillna(0) < abs(stats['mean'] * 0.1))
        ].index.tolist()
        
        # Флаги от бэкенда
        backend_flagged = []
        if 'is_mandatory' in self.expenses.columns:
            backend_flagged = self.expenses[self.expenses['is_mandatory'] == True]['category'].unique().tolist()
        
        final_categories = list(set(ml_detected + backend_flagged))
        
        mandatory_df = self.expenses[self.expenses['category'].isin(final_categories)]
        if not mandatory_df.empty:
            monthly_val = abs(mandatory_df.set_index('ds').resample('M')['y'].sum().mean())
        else:
            monthly_val = 0.0
            
        return monthly_val, final_categories

    def calculate_smart_cushion(self, mandatory_val):
        if self.incomes.empty: return 0, 6, "Нет дохода"
        income_monthly = self.incomes.set_index('ds').resample('M')['y'].sum()
        income_cv = income_monthly.std() / income_monthly.mean() if income_monthly.mean() != 0 else 0
        
        months_target = 6 if income_cv > 0.2 else 3
        risk_label = "Высокая волатильность" if income_cv > 0.2 else "Стабильный доход"
        
        # Если обязательных трат 0, берем просто половину средних расходов как базу
        base = mandatory_val if mandatory_val > 0 else (self.monthly_expense_total * 0.5)
        target_amount = (base * months_target) + (self.monthly_expense_total * 0.5)
        
        return round(target_amount, -2), months_target, risk_label

    def generate_optimization_advice(self, mandatory_cats):
        if self.expenses.empty: return []
        cat_expenses = self.expenses.groupby('category')['y'].sum().abs().sort_values(ascending=False)
        advice_list = []
        for cat, amount_total in cat_expenses.items():
            if cat in mandatory_cats: continue
            avg_monthly = amount_total / (self.df['ds'].dt.to_period('M').nunique())
            if avg_monthly > (self.monthly_income * 0.05):
                save_amount = avg_monthly * 0.15
                advice_list.append({
                    "category": cat,
                    "current_spend": round(avg_monthly),
                    "action": f"Категория '{cat}' занимает {int(avg_monthly)} р/мес.",
                    "recommendation": f"Сократите на 15% (+{int(save_amount)} р)."
                })
        return advice_list

    def run_full_analysis(self):
        mandatory_val, mandatory_cats = self.detect_mandatory_expenses()
        cushion_target, cushion_months, risk_label = self.calculate_smart_cushion(mandatory_val)
        current_balance = self.df['y'].sum()
        
        if cushion_target > 0:
            cushion_progress = (current_balance / cushion_target) * 100
        else: cushion_progress = 0

        # --- SCORE = SAVINGS RATE ---
        if self.monthly_income > 0:
            spent_percent = (self.monthly_expense_total / self.monthly_income) * 100
            saved_percent = 100 - spent_percent
        else:
            spent_percent = 100
            saved_percent = 0

        score = int(max(0, min(100, saved_percent)))
            
        if score >= 50: status = "Excellent"
        elif score >= 20: status = "Stable"
        elif score > 0: status = "Warning"
        else: status = "Critical"

        optimizations = self.generate_optimization_advice(mandatory_cats)

        return {
            "budget_health": {
                "score": score,
                "status": status,
                "saved_percent": round(saved_percent, 1),
                "spent_percent": round(spent_percent, 1),
                "description": f"Вы тратите {int(spent_percent)}% и сохраняете {int(saved_percent)}%. Рейтинг: {score}/100."
            },
            "financial_cushion": {
                "target_amount": cushion_target,
                "current_amount": round(current_balance),
                "progress_percent": round(cushion_progress, 1),
                "reasoning": f"Цель: {cushion_months} мес."
            },
            "metrics": {
                "monthly_income": int(self.monthly_income),
                "monthly_expense": int(self.monthly_expense_total)
            },
            "mandatory_expenses": {
                "total": round(mandatory_val),
                "categories": mandatory_cats
            },
            "optimization_plan": optimizations
        }

# --- 3. API SERVER ---
app = FastAPI()

@app.post("/analyze_v2")
def analyze_v2(transactions: List[Transaction]):
    if not transactions: return {"error": "No data"}
    
    # Превращаем Pydantic модели в dict
    records = [t.dict() for t in transactions]
    
    df = pd.DataFrame(records)
    brain = FinancialBrain(df)
    report = brain.run_full_analysis()
    return json.loads(json.dumps(report, cls=NpEncoder))

# Запуск на порту 8015
def run_server(): uvicorn.run(app, host="127.0.0.1", port=8015, log_level="error")
thread = threading.Thread(target=run_server, daemon=True)
thread.start()
time.sleep(3)

# --- 4. ТЕСТ НА ДАННЫХ БЭКЕНДА ---
print("\n--- ТЕСТ: РЕАЛЬНЫЙ ФОРМАТ БЭКЕНДА ---")

# Точная копия того, что присылает твой бэкенд
real_backend_json = [
  {
    "id": 38,
    "user_id": 1,
    "amount": -300,
    "description": "Обед в кафе",
    "ref_no": "TEST",
    "category": "Food",
    "date": "2025-12-09T00:00:00Z",
    "type": "expense",
    "is_essential": False, # В Python True/False с большой буквы, в JSON с маленькой
    "created_at": "2025-12-06T01:27:11.345029Z"
  },
    {
    "id": 39,
    "user_id": 1,
    "amount": 50000,
    "description": "ЗП",
    "ref_no": "SALARY",
    "category": "Salary",
    "date": "2025-12-10T00:00:00Z",
    "type": "income",
    "is_essential": False,
    "created_at": "2025-12-06T01:27:11.345029Z"
  },
   {
    "id": 40,
    "user_id": 1,
    "amount": -30000,
    "description": "Квартира",
    "ref_no": "RENT",
    "category": "Rent",
    "date": "2025-12-01T00:00:00Z",
    "type": "expense",
    "is_essential": True, # <-- ВАЖНОЕ ПОЛЕ
    "created_at": "2025-12-06T01:27:11.345029Z"
  }
]

try:
    # Отправляем список напрямую
    resp = requests.post("http://127.0.0.1:8015/analyze_v2", json=real_backend_json)
    if resp.status_code == 200:
        print("✅ УСПЕХ! Сервер принял JSON ")
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
    else:
        print(f"❌ Ошибка {resp.status_code}: {resp.text}")
except Exception as e:
    print(f"❌ Ошибка: {e}")