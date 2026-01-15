from sqlalchemy.orm import Session
from . import models
import datetime
import uuid
import re
from .context_builder import build_evaluation_context

class RuleEngine:
    def evaluate(self, db: Session, event: models.Event):
        # 1. Fetch Active Rules
        # No longer sorting by priority, capturing all.
        rules = db.query(models.RiskRule).filter(models.RiskRule.is_active == 1).all()
        
        triggered_rules_ids = []
        possible_actions = [] # List of tuples (priority_val, action_name, rule_id)
        
        # Define Action Priority (Higher is more critical)
        ACTION_HIERARCHY = {
            "BLOCK": 100,
            "SUSPEND_ACCOUNT": 95,
            "TEMP_BLOCK": 90,
            "OPEN_FRAUD_CASE": 80,
            "FORCE_2FA": 70,
            "RATE_LIMIT": 60,
            "NOTIFY_USER": 50,
            "ALERT": 40,
            "MONITOR": 20,
            "ALLOW": 0
        }

        # Build Context using helper
        context = build_evaluation_context(event)
        
        # Known services for optimization check
        KNOWN_SERVICES = ['Paycell', 'BiP', 'TV+', 'Superonline']

        # Optimized Loop
        for rule in rules:
            try:
                # Service Matching Check
                target_service = rule.condition.split('.')[0]
                if target_service in KNOWN_SERVICES and target_service != event.service:
                    continue

                # Basic normalization
                condition = rule.condition.replace(" AND ", " and ").replace(" OR ", " or ")
                
                # Basic normalization
                condition = rule.condition.replace(" AND ", " and ").replace(" OR ", " or ")
                
                res = eval(condition, {"__builtins__": None}, context)
                
                if res:
                    triggered_rules_ids.append(rule.rule_id)
                    
                    action = rule.action.upper()
                    priority_val = ACTION_HIERARCHY.get(action, 10) # Default to low if unknown
                    
                    possible_actions.append({
                        "action": action,
                        "priority": priority_val,
                        "rule_id": rule.rule_id
                    })
            except Exception as e:
                print(f"Error evaluating rule {rule.rule_id}: {condition} - {e}")
                continue


        # If any rule triggered
        if triggered_rules_ids:
            # Sort valid actions by priority desc
            possible_actions.sort(key=lambda x: x["priority"], reverse=True)
            
            # Winner
            selected_action = possible_actions[0]["action"]
            
            # Suppressed (All unique actions that correspond to ignored lower priorities)
            # We filter out the selected action itself from suppressed list
            suppressed_list = [a["action"] for a in possible_actions if a["action"] != selected_action]
            # Deduplicate while preserving order (since possible_actions is already sorted by priority desc)
            seen = set()
            suppressed_ordered = []
            for action in suppressed_list:
                if action not in seen:
                    suppressed_ordered.append(action)
                    seen.add(action)
            
            suppressed_str = ",".join(suppressed_ordered)
            
            # Collect signals
            rule_map = {r.rule_id: r for r in rules}
            decision_signals = [rule_map[r_id].signal for r_id in triggered_rules_ids if r_id in rule_map and rule_map[r_id].signal]
            
            timestamp = datetime.datetime.now().isoformat()
            decision = models.Decision(
                decision_id=str(uuid.uuid4()),
                user_id=event.user_id,
                event_id=event.event_id, 
                triggered_rules=",".join(triggered_rules_ids),
                signals=",".join(decision_signals),
                selected_action=selected_action,
                suppressed_actions=suppressed_str, # Explicitly storing suppressed
                timestamp=timestamp
            )
            db.add(decision)
            
            # --- SIDE EFFECTS ---
            
            # 1. Update Risk Profile (Signal Based Score)
            profile = db.query(models.RiskProfile).filter(models.RiskProfile.user_id == event.user_id).first()
            if not profile:
                profile = models.RiskProfile(user_id=event.user_id, risk_score=0, risk_level="LOW", signals="")
                db.add(profile)
            
            score_increase = 0
            new_signals = []
            
            # Sum scores from ALL triggered rules
            for r_id in triggered_rules_ids:
                if r_id in rule_map:
                    rule = rule_map[r_id]
                    score_increase += rule.risk_score
                    if rule.signal:
                        new_signals.append(rule.signal)

            profile.risk_score = min(100, profile.risk_score + score_increase)
            
            # Signal Management
            existing_signals = profile.signals.split(",") if profile.signals else []
            existing_signals = [s for s in existing_signals if s]
            for sig in new_signals:
                if sig not in existing_signals:
                    existing_signals.append(sig)
            
            profile.signals = ",".join(existing_signals)

            # Update Level
            if profile.risk_score >= 80: profile.risk_level = "CRITICAL"
            elif profile.risk_score >= 50: profile.risk_level = "HIGH"
            elif profile.risk_score >= 20: profile.risk_level = "MEDIUM"
            else: profile.risk_level = "LOW"
            
            # 2. Mock BiP Notification
            # Notify for any non-ALLOW action
            msg_content = None
            if selected_action != "ALLOW":
                # Message Templates
                MESSAGES = {
                    "BLOCK": "Güvenlik riski nedeniyle hesabınız geçici olarak erişime kapatılmıştır.",
                    "SUSPEND_ACCOUNT": "Hesabınız şüpheli aktiviteler nedeniyle askıya alınmıştır. Lütfen müşteri hizmetleri ile iletişime geçiniz.",
                    "TEMP_BLOCK": "Geçici olarak işlem yapmanız kısıtlanmıştır.",
                    "OPEN_FRAUD_CASE": "İşleminiz inceleme altına alınmıştır. Bilgilendirme yapılacaktır.",
                    "FORCE_2FA": "Güvenlik nedeniyle ek doğrulama (2FA) zorunlu hale getirildi.",
                    "RATE_LIMIT": "İşlem limitine ulaştınız. Lütfen daha sonra tekrar deneyiniz.",
                    "ALERT": "Hesabınızda olağandışı hareketlilik tespit edildi.",
                    "MONITOR": "İşleminiz güvenlik kontrolünden geçiyor."
                }
                
                msg_content = MESSAGES.get(selected_action, f"Hesabınızda {selected_action} işlemi uygulandı.")
                
                notif = models.BipNotification(
                    notification_id=str(uuid.uuid4()),
                    user_id=event.user_id,
                    channel="BiP",
                    message=msg_content,
                    sent_at=timestamp
                )
                db.add(notif)
                # Mock Send Logic
                print(f"[BiP MOCK SEND] To: {event.user_id} | Msg: {msg_content}")
            
            # 3. Automatic Fraud Case (Using Hierarchy logic)
            # If action is OPEN_FRAUD_CASE or anything HIGHER than it (BLOCK, SUSPEND)
            # OR if profile is CRITICAL
            
            priority_threshold = ACTION_HIERARCHY["OPEN_FRAUD_CASE"]
            selected_priority = ACTION_HIERARCHY.get(selected_action, 0)
            
            case_id = None
            if selected_priority >= priority_threshold or profile.risk_level == "CRITICAL":
                case_id = str(uuid.uuid4())
                case = models.FraudCase(
                    case_id=case_id,
                    user_id=event.user_id,
                    event_id=event.event_id,
                    opened_by="SYSTEM",
                    case_type="AUTOMATED_RISK",
                    triggering_action=selected_action, # Added
                    notification_log=msg_content, # Added
                    status="OPEN",
                    opened_at=timestamp,
                    priority="HIGH"
                )
                db.add(case)
            
            # 4. Create Traceability Log
            trace_log = models.TraceabilityLog(
                trace_id=str(uuid.uuid4()),
                event_id=event.event_id,
                decision_id=decision.decision_id,
                case_id=case_id,
                created_at=timestamp
            )
            db.add(trace_log)

            db.commit()
            return decision
        return None
