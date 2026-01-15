import sqlite3
import csv
import os

# Veritabanı dosya yolu
DB_NAME = 'trustshield.db'
FOLDER_PATH = r'c:\Users\samet\Desktop\YAZILIM\turkcell'

def create_connection():
    """Veritabanı bağlantısı oluşturur."""
    try:
        conn = sqlite3.connect(DB_NAME)
        return conn
    except sqlite3.Error as e:
        print(f"Hata: {e}")
        return None

def create_tables(conn):
    """Tabloları oluşturur."""
    cursor = conn.cursor()
    
    # Eski tabloları temizle (Temiz bir başlangıç için)
    tables = [
        'users', 'events', 'risk_rules', 'risk_profiles', 
        'fraud_cases', 'case_actions', 'decisions', 'bip_notifications'
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")

    # Tablo şemaları
    queries = [
        """
        CREATE TABLE users (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            city TEXT,
            segment TEXT
        );
        """,
        """
        CREATE TABLE events (
            event_id TEXT PRIMARY KEY,
            user_id TEXT,
            service TEXT,
            event_type TEXT,
            value REAL,
            unit TEXT,
            meta TEXT,
            timestamp TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
        """,
        """
        CREATE TABLE risk_rules (
            rule_id TEXT PRIMARY KEY,
            condition TEXT,
            action TEXT,
            priority INTEGER,
            is_active INTEGER
        );
        """,
        """
        CREATE TABLE risk_profiles (
            user_id TEXT PRIMARY KEY,
            risk_score INTEGER,
            risk_level TEXT,
            signals TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
        """,
        """
        CREATE TABLE fraud_cases (
            case_id TEXT PRIMARY KEY,
            user_id TEXT,
            opened_by TEXT,
            case_type TEXT,
            status TEXT,
            opened_at TEXT,
            priority TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
        """,
        """
        CREATE TABLE case_actions (
            action_id TEXT PRIMARY KEY,
            case_id TEXT,
            action_type TEXT,
            actor TEXT,
            note TEXT,
            timestamp TEXT,
            FOREIGN KEY (case_id) REFERENCES fraud_cases (case_id)
        );
        """,
        """
        CREATE TABLE decisions (
            decision_id TEXT PRIMARY KEY,
            user_id TEXT,
            triggered_rules TEXT,
            selected_action TEXT,
            suppressed_actions TEXT,
            timestamp TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
        """,
        """
        CREATE TABLE bip_notifications (
            notification_id TEXT PRIMARY KEY,
            user_id TEXT,
            channel TEXT,
            message TEXT,
            sent_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        );
        """
    ]

    for query in queries:
        cursor.execute(query)
    
    print("Tablolar başarıyla oluşturuldu.")

def insert_data(conn):
    """CSV dosyalarından verileri okuyup veritabanına ekler."""
    cursor = conn.cursor()
    
    files_map = {
        'users.csv': 'users',
        'events.csv': 'events',
        'risk_rules.csv': 'risk_rules',
        'risk_profiles.csv': 'risk_profiles',
        'fraud_cases.csv': 'fraud_cases',
        'case_actions.csv': 'case_actions',
        'decisions.csv': 'decisions',
        'bip_notifications.csv': 'bip_notifications'
    }

    for filename, table_name in files_map.items():
        file_path = os.path.join(FOLDER_PATH, filename)
        if not os.path.exists(file_path):
            print(f"UYARI: {filename} bulunamadı, atlanıyor.")
            continue
            
        print(f"İşleniyor: {filename} -> {table_name}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                to_db = []
                
                for row in reader:
                    # Sütun isimlerini ve değerlerini hazırla
                    columns = ', '.join(row.keys())
                    placeholders = ', '.join(['?'] * len(row))
                    sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
                    to_db.append(list(row.values()))
                
                if to_db:
                    cursor.executemany(sql, to_db)
                    print(f"- {len(to_db)} satır eklendi.")
                else:
                    print("- Eklenecek veri bulunamadı.")
                    
        except Exception as e:
            print(f"HATA ({filename}): {e}")

    conn.commit()
    print("Tüm veriler başarıyla içe aktarıldı.")

def main():
    conn = create_connection()
    if conn is not None:
        create_tables(conn)
        insert_data(conn)
        conn.close()
    else:
        print("Veritabanı bağlantısı kurulamadı.")

if __name__ == '__main__':
    main()
