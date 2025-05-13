import sqlite3
from datetime import datetime

# Create a SQLite database and log each interaction
def log_interaction(sender, user_msg, bot_reply, sentiment):
    conn = sqlite3.connect('chatlogs.db')
    c = conn.cursor()

    # Create table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            sender TEXT,
            user_msg TEXT,
            bot_reply TEXT,
            sentiment TEXT
        )
    ''')

    # Insert new log
    c.execute('''
        INSERT INTO logs (timestamp, sender, user_msg, bot_reply, sentiment)
        VALUES (?, ?, ?, ?, ?)
    ''', (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), sender, user_msg, bot_reply, sentiment))

    conn.commit()
    conn.close()
