import time
import requests
import random
import datetime
import sqlite3

API_URL = "http://localhost:8000/events"
DB_PATH = "trustshield.db"

# Ensure we have a triggerable rule
def ensure_rule():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check for our dedicated test rule
    cursor.execute("SELECT rule_id FROM risk_rules WHERE rule_id='RR-AUTO-01'")
    if not cursor.fetchone():
        print("Creating Auto-Generation Trigger Rule (RR-AUTO-01)...")
        # Rule: Paycell.amount > 20000 -> OPEN_FRAUD_CASE
        cursor.execute("""
            INSERT INTO risk_rules (rule_id, condition, action, priority, is_active, signal, risk_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('RR-AUTO-01', 'Paycell.amount > 20000', 'OPEN_FRAUD_CASE', 80, 1, 'High Value Paycell Transaction', 90))
        conn.commit()
    
    # Also a BiP rule
    cursor.execute("SELECT rule_id FROM risk_rules WHERE rule_id='RR-AUTO-02'")
    if not cursor.fetchone():
        print("Creating BiP Trigger Rule (RR-AUTO-02)...")
        # Rule: BiP.count > 100 -> ALERT
        cursor.execute("""
            INSERT INTO risk_rules (rule_id, condition, action, priority, is_active, signal, risk_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('RR-AUTO-02', 'BiP.count > 100', 'ALERT', 50, 1, 'Abnormal Message Count', 40))
        conn.commit()

    conn.close()

def generate_traffic():
    print("Starting Traffic Generator (Every 60s)...")
    
    while True:
        try:
            # 1. Paycell High Value (Should Trigger RR-AUTO-01)
            paycell_event = {
                "event_id": str(uuid.uuid4()),
                "user_id": f"User_{random.randint(100, 999)}",
                "service": "Paycell",
                "event_type": "TRANSFER",
                "value": random.randint(20001, 50000), # > 20000 to trigger
                "unit": "TRY",
                "meta": '{"merchant": "CryptoExchange"}',
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            # 2. BiP Normal (or occasional high)
            bip_val = random.choice([5, 10, 150]) # 150 triggers RR-AUTO-02
            bip_event = {
                "event_id": str(uuid.uuid4()),
                "user_id": f"User_{random.randint(100, 999)}",
                "service": "BiP",
                "event_type": "MESSAGE",
                "value": bip_val, 
                "unit": "Count",
                "meta": '{"device_status": "known"}',
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            # Send Paycell
            print(f"Sending Paycell Event: {paycell_event['value']} TRY...")
            res = requests.post(API_URL, json=paycell_event)
            if res.status_code == 200:
                print(" -> Success. " + str(res.json()))
            else:
                print(" -> Failed: " + res.text)
                
            # Send BiP
            print(f"Sending BiP Event: {bip_event['value']} msgs...")
            res = requests.post(API_URL, json=bip_event)
             
            # Wait 60s
            print("Waiting 60s...")
            time.sleep(60)
            
        except Exception as e:
            print(f"Error in generator: {e}")
            time.sleep(10)

if __name__ == "__main__":
    ensure_rule()
    generate_traffic()
