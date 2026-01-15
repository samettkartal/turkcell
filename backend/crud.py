from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
import uuid

def get_events(db: Session, skip: int = 0, limit: int = 100, start_time: str = None, service: str = None, user_id: str = None, sort_by: str = 'timestamp_desc'):
    query = db.query(models.Event)
    
    if start_time:
        query = query.filter(models.Event.timestamp >= start_time)
    
    if service and service != 'ALL':
        query = query.filter(func.upper(models.Event.service) == service.upper())

    if user_id:
        query = query.filter(models.Event.user_id == user_id)
        
    if sort_by == 'value_desc':
        query = query.order_by(models.Event.value.desc())
    elif sort_by == 'value_asc':
        query = query.order_by(models.Event.value.asc())
    else:
        query = query.order_by(models.Event.timestamp.desc())
        
    return query.offset(skip).limit(limit).all()

def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_risk_profile(db: Session, user_id: str):
    return db.query(models.RiskProfile).filter(models.RiskProfile.user_id == user_id).first()

def get_risk_profiles(db: Session, risk_level: str = None, limit: int = 100):
    query = db.query(models.RiskProfile)
    if risk_level:
        query = query.filter(models.RiskProfile.risk_level == risk_level)
    return query.limit(limit).all()

def get_risk_rules(db: Session):
    return db.query(models.RiskRule).all()

def create_risk_rule(db: Session, rule: schemas.RiskRuleCreate):
    db_rule = models.RiskRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

def update_risk_rule(db: Session, rule_id: str, rule: schemas.RiskRuleBase):
    db_rule = db.query(models.RiskRule).filter(models.RiskRule.rule_id == rule_id).first()
    if db_rule:
        db_rule.condition = rule.condition
        db_rule.action = rule.action
        db_rule.priority = rule.priority
        db_rule.is_active = rule.is_active
        db.commit()
        db.refresh(db_rule)
    return db_rule

def delete_risk_rule(db: Session, rule_id: str):
    db_rule = db.query(models.RiskRule).filter(models.RiskRule.rule_id == rule_id).first()
    if db_rule:
        db.delete(db_rule)
        db.commit()
    return db_rule

def get_fraud_cases(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FraudCase).offset(skip).limit(limit).all()

def get_decisions(db: Session, skip: int = 0, limit: int = 100, action: str = None, user_id: str = None):
    query = db.query(models.Decision)
    if action and action != 'ALL':
        query = query.filter(models.Decision.selected_action == action)
    if user_id:
        query = query.filter(models.Decision.user_id == user_id)
    return query.order_by(models.Decision.timestamp.desc()).offset(skip).limit(limit).all()

def get_dashboard_summary(db: Session):
    total_events = db.query(models.Event).count()
    active_rules = db.query(models.RiskRule).filter(models.RiskRule.is_active == 1).count()
    open_cases = db.query(models.FraudCase).filter(models.FraudCase.status == 'OPEN').count()
    high_risk_users = db.query(models.RiskProfile).filter(models.RiskProfile.risk_level == 'HIGH').count()
    
    # --- Charts Data (Real Aggregation) ---
    import datetime
    from collections import defaultdict

    now = datetime.datetime.now()
    
    # 1. Traffic (Last 24h)
    traffic_24h = []
    start_24h = (now - datetime.timedelta(hours=24)).isoformat()
    events_24h = db.query(models.Event).filter(models.Event.timestamp >= start_24h).all()
    
    # Bucket by hour
    hourly_counts = defaultdict(int)
    for e in events_24h:
        # timestamp format: YYYY-MM-DDTHH:MM:SS
        try:
            hour = e.timestamp.split('T')[1][:2] + ':00'
            hourly_counts[hour] += 1
        except:
            continue
            
    # Fill last 24 hours (simplified to just present hours for now or sorted keys)
    # To be "Area Chart" friendly, let's sort by time.
    for k in sorted(hourly_counts.keys()):
        traffic_24h.append({"time": k, "events": hourly_counts[k]})
    
    # If empty, add at least one point
    if not traffic_24h:
        traffic_24h.append({"time": now.strftime("%H:00"), "events": 0})

    # 2. Risk Distribution
    risk_dist = []
    risk_counts = db.query(models.RiskProfile.risk_level, func.count(models.RiskProfile.risk_level)).group_by(models.RiskProfile.risk_level).all()
    
    colors = {'LOW': '#10B981', 'MEDIUM': '#F59E0B', 'HIGH': '#F97316', 'CRITICAL': '#EF4444'}
    for level, count in risk_counts:
        if level:
            risk_dist.append({"name": level, "value": count, "color": colors.get(level, '#ccc')})
            
    # 3. Service Stats
    service_stats = []
    svc_counts = db.query(models.Event.service, func.count(models.Event.service)).group_by(models.Event.service).all()
    for svc, count in svc_counts:
        if svc:
            service_stats.append({"name": svc, "events": count, "cases": 0}) # Cases logic TBD

    # 4. Weekly Heatmap (Last 7 Days)
    # Matrix: 7 Days x 6 Blocks (4-hour chunks) for density
    heatmap_data = []
    start_7d = (now - datetime.timedelta(days=7)).isoformat()
    events_7d = db.query(models.Event).filter(models.Event.timestamp >= start_7d).all()
    
    # Map: Day -> HourBlock -> Count
    # Day Names: Mon, Tue...
    days_map = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    heat_map = {d: [0]*12 for d in days_map} # 12 blocks of 2 hours
    
    for e in events_7d:
        try:
            dt = datetime.datetime.fromisoformat(e.timestamp)
            day_name = dt.strftime("%a") # Mon
            hour_idx = dt.hour // 2 # 0-11
            if day_name in heat_map:
                heat_map[day_name][hour_idx] += 1
        except:
            continue
            
    for day in days_map:
        heatmap_data.append({"day": day, "values": heat_map[day]})

    return {
        "total_events": total_events,
        "active_risk_rules": active_rules,
        "open_fraud_cases": open_cases,
        "high_risk_users": high_risk_users,
        "traffic_24h": traffic_24h,
        "risk_distribution": risk_dist,
        "service_stats": service_stats,
        "weekly_heatmap": heatmap_data
    }
