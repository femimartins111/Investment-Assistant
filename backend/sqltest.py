import os
from dotenv import load_dotenv
load_dotenv()
    
from dbauth import connect_to_db, store_portfolio_data, get_latest_portfolio_data

def setup_database():
    """Creates the portfolios table if it doesn't exist."""
    conn = connect_to_db()
    if not conn:
        print("❌ Setup Failed: Could not connect to the database.")
        return False
    
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolios (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            );
        """)
        conn.commit()
        print("✅ Database table 'portfolios' is ready.")
        return True
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        conn.close()

def run_tests():
    print("--- Starting Integration Tests ---\n")
    
    # 1. Ensure the table exists
    if not setup_database():
        return

    # Define mock data for the test
    test_user_id = "test_user_999"
    test_portfolio = {
        "assets": [
            {"ticker": "AAPL", "shares": 50},
            {"ticker": "VTI", "shares": 10}
        ],
        "cash_balance": 1250.00,
        "risk_tolerance": "moderate"
    }

    # 2. Test Storing Data
    print(f"\n[Test 1] Storing portfolio for {test_user_id}...")
    store_success = store_portfolio_data(test_user_id, test_portfolio)
    
    if store_success:
        print("✅ Successfully stored portfolio data.")
    else:
        print("❌ Failed to store portfolio data.")
        return  # Stop the test if we can't save

    # 3. Test Retrieving Data
    print("\n[Test 2] Retrieving latest portfolio data...")
    retrieved_data = get_latest_portfolio_data(test_user_id)
    
    if retrieved_data is None:
        print("❌ Failed to retrieve portfolio data (returned None).")
        return

    # 4. Validate the Payload
    print("\n[Test 3] Validating data integrity...")
    if retrieved_data == test_portfolio:
        print("✅ Success: Retrieved JSON perfectly matches the stored JSON!")
    else:
        print("❌ Failure: Data mismatch!")
        print(f"Expected: {test_portfolio}")
        print(f"Got:      {retrieved_data}")
        
    print("\n--- Tests Complete ---")

if __name__ == "__main__":
    run_tests()