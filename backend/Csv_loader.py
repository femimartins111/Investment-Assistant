import pandas as pd


def load_portfolio_data(file):
    """
    Load a portfolio CSV into a dict keyed by the first column
    (expected to be the company name), with each row's remaining
    columns as the value.
    """
    df = pd.read_csv(file)
    first_col = df.columns[0]
    portfolio_dict = df.set_index(first_col).to_dict(orient="index")

    return portfolio_dict
