import sqlite3

# Database connection
DB_FILE = "contracts.db"
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

### Database Setup ###
def init_db():
    # Initialize the database table for storing contract addresses.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel TEXT NOT NULL,
        address TEXT UNIQUE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

def save_address_to_db(channel, address):
    # Save the extracted contract address to the database.
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO contracts (channel, address) VALUES (?, ?)",
            (channel, address),
        )
        conn.commit()
        print(f"[{channel}] Address saved to database: {address}")
    except Exception as e:
        print(f"[{channel}] Error saving address: {e}")

def delete_address_from_db(address):
    # Deletes a contract address from the database.
    try:
        cursor.execute("DELETE FROM contracts WHERE address = ?", (address,))
        conn.commit()
        print(f"Address deleted from database: {address}")
    except Exception as e:
        print(f"Error deleting address: {e}")