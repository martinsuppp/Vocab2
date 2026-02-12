import sqlite3
import os

DB_PATH = 'vocab.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create table for mistake tracking
    # word: The English word (primary key logic, or simplified)
    # mistake_count: Number of times got wrong
    # correct_count: Number of times got right
    # last_seen: Timestamp
    c.execute('''
        CREATE TABLE IF NOT EXISTS word_stats (
            word TEXT PRIMARY KEY,
            mistake_count INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            last_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
