from pydantic import BaseModel
from typing import Optional, List

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class AccountBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str

class AccountCreate(AccountBase):
    password: str

class Account(AccountBase):
    id: int
    class Config:
        from_attributes = True
# --------------------

# Event Schemas
class EventBase(BaseModel):
    user_id: str
    service: str
    event_type: str
    value: Optional[float] = None
    unit: Optional[str] = None
    meta: Optional[str] = None
    timestamp: str

class EventCreate(EventBase):
    event_id: str

class Event(EventBase):
    event_id: str
    class Config:
        from_attributes = True

# Risk Rule Schemas
class RiskRuleBase(BaseModel):
    condition: str
    action: str
    priority: int
    is_active: bool

class RiskRuleCreate(RiskRuleBase):
    rule_id: str

class RiskRule(RiskRuleBase):
    rule_id: str
    class Config:
        from_attributes = True

# Risk Profile Schemas
class RiskProfile(BaseModel):
    user_id: str
    risk_score: int
    risk_level: str
    signals: Optional[str] = None
    class Config:
        from_attributes = True

# Fraud Case Schemas
class FraudCase(BaseModel):
    case_id: str
    user_id: str
    event_id: Optional[str] = None  # Added
    opened_by: str
    case_type: str
    triggering_action: Optional[str] = None
    notification_log: Optional[str] = None # Added
    status: str
    opened_at: str
    priority: str
    class Config:
        from_attributes = True

# Decision Schemas
class Decision(BaseModel):
    decision_id: str
    user_id: str
    event_id: Optional[str] = None # Added
    triggered_rules: Optional[str] = None
    signals: Optional[str] = None # Added
    selected_action: Optional[str] = None
    suppressed_actions: Optional[str] = None
    timestamp: str
    class Config:
        from_attributes = True

# Dashboard Summary Schema
# Dashboard Summary Schema
class TrafficPoint(BaseModel):
    time: str
    events: int

class RiskDistPoint(BaseModel):
    name: str
    value: int
    color: str

class ServiceStatPoint(BaseModel):
    name: str
    cases: int
    events: int

class TraceabilityItem(BaseModel):
    event_id: str
    decision_id: Optional[str] = None
    case_id: Optional[str] = None
    user_id: str
    timestamp: str

class HeatmapData(BaseModel):
    day: str
    values: List[int]

class DashboardSummary(BaseModel):
    total_events: int
    active_risk_rules: int
    open_fraud_cases: int
    high_risk_users: int
    
    # Charts
    traffic_24h: List[TrafficPoint]
    risk_distribution: List[RiskDistPoint]
    service_stats: List[ServiceStatPoint]
    weekly_heatmap: List[HeatmapData]
