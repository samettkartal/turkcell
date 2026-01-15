from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from . import crud, models, schemas, auth
from .database import SessionLocal, engine, get_db
from datetime import timedelta

# Create tables if they don't exist (though they should)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Turkcell TrustShield API", version="1.0.0")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Account).filter(models.Account.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from .engine import RuleEngine

rule_engine = RuleEngine()

@app.post("/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    # 1. Save Event
    db_event = crud.create_event(db=db, event=event)
    
    # 2. Evaluate Rules (Synchronous)
    rule_engine.evaluate(db, db_event)
    
    return db_event

@app.get("/events", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, start_time: str = None, service: str = None, user_id: str = None, sort_by: str = 'timestamp_desc', db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    return crud.get_events(db, skip=skip, limit=limit, start_time=start_time, service=service, user_id=user_id, sort_by=sort_by)

@app.get("/users/{user_id}/risk-profile", response_model=schemas.RiskProfile)
def read_risk_profile(user_id: str, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    db_profile = crud.get_risk_profile(db, user_id=user_id)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Risk profile not found")
    return db_profile

@app.get("/risk-profiles", response_model=List[schemas.RiskProfile])
def read_risk_profiles(risk_level: str = None, limit: int = 100, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    return crud.get_risk_profiles(db, risk_level=risk_level, limit=limit)

@app.get("/risk-rules", response_model=List[schemas.RiskRule])
def read_risk_rules(db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    return crud.get_risk_rules(db)

@app.post("/risk-rules", response_model=schemas.RiskRule)
def create_risk_rule(rule: schemas.RiskRuleCreate, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_active_admin)):
    return crud.create_risk_rule(db=db, rule=rule)

@app.put("/risk-rules/{rule_id}", response_model=schemas.RiskRule)
def update_risk_rule(rule_id: str, rule: schemas.RiskRuleBase, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_active_admin)):
    db_rule = crud.update_risk_rule(db, rule_id=rule_id, rule=rule)
    if db_rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return db_rule

@app.delete("/risk-rules/{rule_id}", response_model=schemas.RiskRule)
def delete_risk_rule(rule_id: str, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_active_admin)):
    db_rule = crud.delete_risk_rule(db, rule_id=rule_id)
    if db_rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return db_rule

@app.get("/fraud-cases", response_model=List[schemas.FraudCase])
def read_fraud_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    return crud.get_fraud_cases(db, skip=skip, limit=limit)

@app.get("/decisions", response_model=List[schemas.Decision])
def read_decisions(skip: int = 0, limit: int = 100, action: str = None, user_id: str = None, db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    return crud.get_decisions(db, skip=skip, limit=limit, action=action, user_id=user_id)

@app.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def read_dashboard_summary(db: Session = Depends(get_db), current_user: models.Account = Depends(auth.get_current_user)):
    return crud.get_dashboard_summary(db)
