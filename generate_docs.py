import sqlite3
import os

DB_NAME = 'trustshield.db'
OUTPUT_FILE = r'c:\Users\samet\Desktop\YAZILIM\turkcell\database_overview.md'

def create_connection():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Hata: {e}")
        return None

def generate_markdown(conn):
    cursor = conn.cursor()
    md_content = "# TrustShield Database Overview\n\n"
    md_content += f"Database File: `{DB_NAME}`\n\n"

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row['name'] for row in cursor.fetchall()]
    tables.sort()

    for table in tables:
        md_content += f"## Table: `{table}`\n\n"
        
        # Schema info
        md_content += "### Schema\n"
        md_content += "| Column | Type | PK |\n"
        md_content += "| :--- | :--- | :--: |\n"
        
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        column_names = []
        for col in columns:
            pk_mark = "Yes" if col['pk'] else ""
            md_content += f"| {col['name']} | {col['type']} | {pk_mark} |\n"
            column_names.append(col['name'])
        
        md_content += "\n"

        # Sample data
        md_content += "### Sample Data (Max 5 rows)\n"
        cursor.execute(f"SELECT * FROM {table} LIMIT 5")
        rows = cursor.fetchall()
        
        if rows:
            # Header
            md_content += "| " + " | ".join(column_names) + " |\n"
            md_content += "| " + " | ".join(["---"] * len(column_names)) + " |\n"
            # Rows
            for row in rows:
                row_data = [str(item).replace('\n', ' ').replace('|', '&#124;') for item in row]
                md_content += "| " + " | ".join(row_data) + " |\n"
        else:
            md_content += "_No data found._\n"
            
        md_content += "\n---\n\n"

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"Documentation generated at {OUTPUT_FILE}")

def main():
    if not os.path.exists(DB_NAME):
        print(f"Hata: {DB_NAME} bulunamadı.")
        return

    conn = create_connection()
    if conn:
        generate_markdown(conn)
        conn.close()

if __name__ == '__main__':
    main()
