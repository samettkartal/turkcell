from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    city = Column(String)
    segment = Column(String)

class Event(Base):
    __tablename__ = "events"
    event_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    service = Column(String)
    event_type = Column(String)
    value = Column(Float)
    unit = Column(String)
    meta = Column(String)
    timestamp = Column(String)

class RiskRule(Base):
    __tablename__ = "risk_rules"
    rule_id = Column(String, primary_key=True, index=True)
    condition = Column(String)
    action = Column(String)
    priority = Column(Integer)
    is_active = Column(Integer) # SQLite stores boolean as Integer
    signal = Column(String, default="Generic Risk") # Added
    risk_score = Column(Integer, default=0) # Added

class RiskProfile(Base):
    __tablename__ = "risk_profiles"
    user_id = Column(String, ForeignKey("users.user_id"), primary_key=True)
    risk_score = Column(Integer)
    risk_level = Column(String)
    signals = Column(String)

class FraudCase(Base):
    __tablename__ = "fraud_cases"
    case_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    event_id = Column(String, ForeignKey("events.event_id")) # Added
    opened_by = Column(String)
    case_type = Column(String)
    triggering_action = Column(String)
    notification_log = Column(String) # Added
    status = Column(String)
    opened_at = Column(String)
    priority = Column(String)

class Decision(Base):
    __tablename__ = "decisions"
    decision_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    event_id = Column(String, ForeignKey("events.event_id")) # Added
    triggered_rules = Column(String)
    signals = Column(String) # Added: To store human-readable signals
    selected_action = Column(String)
    suppressed_actions = Column(String) # For auditing/debugging
    timestamp = Column(String)

class TraceabilityLog(Base): # Fixed inheritance
    __tablename__ = "traceability_logs"
    trace_id = Column(String, primary_key=True, index=True)
    event_id = Column(String, index=True)
    decision_id = Column(String)
    case_id = Column(String, nullable=True) # Can be null if no case opened
    created_at = Column(String)
    suppressed_actions = Column(String)
    timestamp = Column(String)

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String) # 'ADMIN' or 'USER'

class BipNotification(Base):
    __tablename__ = "bip_notifications"
    notification_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    channel = Column(String)
    message = Column(String)
    sent_at = Column(String)

class CaseAction(Base):
    __tablename__ = "case_actions"
    action_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("fraud_cases.case_id"))
    action_type = Column(String)
    actor = Column(String)
    note = Column(String)
    timestamp = Column(String)
