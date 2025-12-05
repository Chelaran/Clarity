import pickle
import pandas as pd
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import joblib

app = FastAPI(
    title="Clarity ML Service",
    description="API для классификации банковских транзакций",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Пути к файлам модели
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
CLASSIFIER_PATH = os.path.join(MODEL_DIR, 'models', 'classifier.pkl')
METADATA_PATH = os.path.join(MODEL_DIR, 'models', 'metadata.pkl')

# Глобальные переменные для модели
classifier = None
metadata = None

class RuleBasedClassifier:
    """Классификатор транзакций на основе правил и ML модели"""
    
    def __init__(self, ml_model=None, category_mapping=None, feature_columns=None):
        self.ml_model = ml_model
        self.category_mapping = category_mapping or {}
        self.feature_columns = feature_columns or []
    
    def predict_by_rules(self, transaction_data):
        """Предсказание на основе правил"""
        date = pd.to_datetime(transaction_data.get('date', datetime.now()))
        amount = transaction_data.get('amount', 0)
        refno = str(transaction_data.get('ref_no', '')).upper()
        
        if amount > 5000:
            return 'Salary', 0.99, 'rule'
        elif 'CHAS' in refno and amount > 0:
            return 'Salary', 0.99, 'rule'
        
        if amount < -2000 and amount > -15000 and date.day <= 7:
            return 'Rent', 0.98, 'rule'
        
        transport_amounts = [-3062, -1718, -500, -100, -50, -200]
        if amount in transport_amounts:
            return 'Transport', 0.97, 'rule'
        
        if -500 < amount < -10 and amount % 1 != 0:
            return 'Food', 0.85, 'rule'
        
        if -10000 < amount < -100:
            if amount not in transport_amounts:
                return 'Shopping', 0.80, 'rule'
        
        return None, 0, 'rule'
    
    def predict_with_ml(self, transaction_data):
        """Предсказание с помощью ML модели"""
        if self.ml_model is None:
            return 'Misc', 0.5, 'ml_fallback'
        
        date = pd.to_datetime(transaction_data.get('date', datetime.now()))
        amount = transaction_data.get('amount', 0)
        refno = str(transaction_data.get('ref_no', '')).upper()
        
        features = {
            'Amount': amount,
            'Amount_Abs': abs(amount),
            'Is_Positive': 1 if amount > 0 else 0,
            'Is_Negative': 1 if amount < 0 else 0,
            'Is_Large_Positive': 1 if amount > 5000 else 0,
            'Is_Medium_Negative': 1 if (-10000 < amount < -100) else 0,
            'Is_Small_Negative': 1 if (-500 < amount < 0) else 0,
            'Month': date.month,
            'Day': date.day,
            'DayOfWeek': date.dayofweek,
            'Is_FirstWeek': 1 if date.day <= 7 else 0,
            'Is_Weekend': 1 if date.dayofweek >= 5 else 0,
            'Has_CHAS': 1 if 'CHAS' in refno else 0,
            'Has_E11': 1 if 'E+11' in refno else 0,
        }
        
        if not self.feature_columns:
            return 'Misc', 0.5, 'ml_error'
        
        X_new = pd.DataFrame([features])[self.feature_columns].fillna(0)
        
        try:
            prediction = self.ml_model.predict(X_new)[0]
            probabilities = self.ml_model.predict_proba(X_new)[0]
            
            category = self.category_mapping.get(prediction, 'Misc')
            confidence = float(probabilities[prediction])
            
            return category, confidence, 'ml'
        except Exception as e:
            print(f"ML prediction error: {e}")
            return 'Misc', 0.5, 'ml_error'
    
    def predict(self, transaction_data, use_ml=True):
        """Основной метод предсказания"""
        rule_category, rule_confidence, rule_method = self.predict_by_rules(transaction_data)
        
        if rule_category is not None:
            return {
                'category': rule_category,
                'confidence': rule_confidence,
                'method': rule_method,
                'is_rule_based': True
            }
        
        if use_ml and self.ml_model is not None:
            ml_category, ml_confidence, ml_method = self.predict_with_ml(transaction_data)
            return {
                'category': ml_category,
                'confidence': ml_confidence,
                'method': ml_method,
                'is_rule_based': False
            }
        
        return {
            'category': 'Misc',
            'confidence': 0.5,
            'method': 'fallback',
            'is_rule_based': False
        }

def load_model():
    """Загрузка модели и метаданных"""
    global classifier, metadata
    
    try:
        print(f"Загрузка метаданных из {METADATA_PATH}...")
        with open(METADATA_PATH, 'rb') as f:
            metadata = pickle.load(f)
        
        # Загружаем RF модель (пробуем joblib, затем pickle)
        rf_model_path = os.path.join(MODEL_DIR, 'models', 'rf_model.pkl')
        print(f"Загрузка RF модели из {rf_model_path}...")
        try:
            rf_model = joblib.load(rf_model_path)
            print("   RF модель загружена через joblib")
        except Exception as e:
            print(f"   Попытка загрузки через pickle: {e}")
            with open(rf_model_path, 'rb') as f:
                rf_model = pickle.load(f)
            print("   RF модель загружена через pickle")
        
        # Создаем классификатор с загруженными данными
        print(f"Создание RuleBasedClassifier...")
        classifier = RuleBasedClassifier(
            ml_model=rf_model,
            category_mapping=metadata.get('category_mapping', {}),
            feature_columns=metadata.get('feature_columns', [])
        )
        
        print(f"✅ Модель загружена успешно!")
        print(f"   Категории: {list(metadata.get('category_mapping', {}).values())}")
        print(f"   Признаков: {len(metadata.get('feature_columns', []))}")
        
    except FileNotFoundError as e:
        print(f"❌ Ошибка: файл не найден - {e}")
        raise
    except Exception as e:
        print(f"❌ Ошибка загрузки модели: {e}")
        import traceback
        traceback.print_exc()
        raise

# Загружаем модель при старте
load_model()

# Pydantic модели для запросов/ответов
class CategorizeRequest(BaseModel):
    date: str = Field(..., description="Дата транзакции в формате YYYY-MM-DD")
    amount: float = Field(..., description="Сумма транзакции")
    ref_no: str = Field(..., description="Референсный номер транзакции")

class CategorizeResponse(BaseModel):
    category: str = Field(..., description="Категория транзакции")
    confidence: float = Field(..., description="Уверенность модели (0-1)")

class PredictRequest(BaseModel):
    date: str = Field(..., description="Дата транзакции в формате YYYY-MM-DD")
    amount: float = Field(..., description="Сумма транзакции")
    ref_no: str = Field(..., description="Референсный номер транзакции")

class PredictionResult(BaseModel):
    category: str
    confidence: float
    method: str
    is_rule_based: bool

class PredictResponse(BaseModel):
    success: bool
    prediction: PredictionResult

class TransactionRequest(BaseModel):
    date: str
    amount: float
    ref_no: str

class BatchResult(BaseModel):
    index: int
    success: bool
    prediction: Optional[PredictionResult] = None
    error: Optional[str] = None

class BatchSummary(BaseModel):
    total: int
    successful: int
    failed: int

class BatchPredictResponse(BaseModel):
    success: bool
    results: List[BatchResult]
    summary: BatchSummary

@app.get("/health")
async def health():
    """Проверка работоспособности API"""
    return {
        'status': 'ok',
        'model': 'RuleBasedClassifier',
        'categories': list(metadata.get('category_mapping', {}).values()) if metadata else [],
        'features_count': len(metadata.get('feature_columns', [])) if metadata else 0
    }

@app.post("/categorize", response_model=CategorizeResponse)
async def categorize(request: CategorizeRequest):
    """
    Классификация транзакции (новый формат)
    
    Принимает:
    - date: дата транзакции (YYYY-MM-DD)
    - amount: сумма транзакции
    - ref_no: референсный номер транзакции
    
    Возвращает:
    - category: категория транзакции
    - confidence: уверенность модели (0-1)
    """
    try:
        # Формируем данные для модели
        transaction_data = {
            'date': request.date,
            'amount': request.amount,
            'ref_no': request.ref_no
        }
        
        # Предсказание
        result = classifier.predict(transaction_data)
        
        return CategorizeResponse(
            category=result['category'],
            confidence=float(result['confidence'])
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Предсказание категории для одной транзакции (расширенный формат)
    
    Возвращает дополнительную информацию о методе классификации.
    """
    try:
        # Предсказание
        result = classifier.predict({
            'date': request.date,
            'amount': request.amount,
            'ref_no': request.ref_no
        })
        
        return PredictResponse(
            success=True,
            prediction=PredictionResult(
                category=result['category'],
                confidence=float(result['confidence']),
                method=result['method'],
                is_rule_based=result.get('is_rule_based', False)
            )
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch_predict", response_model=BatchPredictResponse)
async def batch_predict(transactions: List[TransactionRequest]):
    """Пакетное предсказание для нескольких транзакций"""
    try:
        if len(transactions) > 1000:
            raise HTTPException(status_code=400, detail="Too many transactions. Max: 1000")
        
        results = []
        for i, transaction in enumerate(transactions):
            try:
                result = classifier.predict({
                    'date': transaction.date,
                    'amount': transaction.amount,
                    'ref_no': transaction.ref_no
                })
                results.append(BatchResult(
                    index=i,
                    success=True,
                    prediction=PredictionResult(
                        category=result['category'],
                        confidence=float(result['confidence']),
                        method=result['method'],
                        is_rule_based=result.get('is_rule_based', False)
                    )
                ))
            except Exception as e:
                results.append(BatchResult(
                    index=i,
                    success=False,
                    error=str(e)
                ))
        
        successful = sum(1 for r in results if r.success)
        return BatchPredictResponse(
            success=True,
            results=results,
            summary=BatchSummary(
                total=len(transactions),
                successful=successful,
                failed=len(transactions) - successful
            )
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model_info")
async def model_info():
    """Информация о модели"""
    return {
        'categories': metadata.get('categories', []),
        'feature_columns': metadata.get('feature_columns', []),
        'category_mapping': metadata.get('category_mapping', {}),
        'rules': {
            'salary': 'Amount > 5000 OR (RefNo contains "CHAS" AND Amount > 0)',
            'rent': 'Amount between -2000 and -15000 AND Day <= 7',
            'transport': 'Amount in [-3062, -1718, -500, -100, -50, -200]',
            'food': 'Amount between -500 and -10 AND not integer',
            'shopping': 'Amount between -10000 and -100 (if not transport)'
        }
    }

if __name__ == '__main__':
    import uvicorn
    print("\n" + "="*50)
    print("🚀 ML API запущено на http://0.0.0.0:5000")
    print("Доступные эндпоинты:")
    print("  GET  /health        - Проверка работоспособности")
    print("  GET  /model_info    - Информация о модели")
    print("  GET  /docs          - Swagger документация")
    print("  GET  /redoc         - ReDoc документация")
    print("  POST /categorize    - Классификация транзакции")
    print("  POST /predict       - Предсказание (расширенный формат)")
    print("  POST /batch_predict - Пакетное предсказание")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=5000)
