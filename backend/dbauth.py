import os
import json
import psycopg2
from psycopg2.extras import Json

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_NAME = os.environ.get("DB_NAME", "investment")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD")


def connect_to_db():
    if not DB_PASSWORD:
        print("Error connecting to database: DB_PASSWORD is not set")
        return None

    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return connection
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


def store_portfolio_data(user_id, portfolio_data):
    """
    Store a user's portfolio (a dict) as JSON in the portfolios table.
    Expects a table roughly like:

        CREATE TABLE portfolios (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            data JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """
    connection = connect_to_db()
    if connection is None:
        return False

    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO portfolios (user_id, data) VALUES (%s, %s)",
            (user_id, Json(portfolio_data))
        )
        connection.commit()
        return True
    except Exception as e:
        print(f"Error storing portfolio data: {e}")
        connection.rollback()
        return False
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


def get_latest_portfolio_data(user_id):
    """
    Fetch the most recently stored portfolio for a user.
    Returns the portfolio dict, or None if not found / on error.
    """
    connection = connect_to_db()
    if connection is None:
        return None

    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT data FROM portfolios
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id,)
        )
        row = cursor.fetchone()
        if row is None:
            return None

        data = row[0]
        if isinstance(data, str):
            data = json.loads(data)
        return data
    except Exception as e:
        print(f"Error fetching portfolio data: {e}")
        return None
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()
