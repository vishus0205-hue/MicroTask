import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, os.path.abspath(backend_dir))

from app.models.db import get_db
from scripts.seed_data import seed_database

if __name__ == "__main__":
    db = get_db()
    conn = db.get_connection()
    seed_database(conn)
    print("Database seeding completed.")
