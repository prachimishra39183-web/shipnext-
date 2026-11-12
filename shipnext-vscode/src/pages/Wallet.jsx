
import { Link } from 'react-router-dom';

function Wallet() {
  const transactions = [];

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">S</span>
          Ship<span>Next</span>
        </Link>

        <Link to="/dashboard" className="booking-back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="wallet-container">
        <div className="booking-heading">
          <span>YOUR SHIPNEXT ACCOUNT</span>
          <h1>My Wallet</h1>
          <p>Manage your shipping funds and transactions.</p>
        </div>

        <section className="wallet-balance-card">
          <div className="wallet-balance-info">
            <span>AVAILABLE BALANCE</span>
            <h2>₹0.00</h2>
            <p>Your current ShipNext wallet balance</p>
          </div>

          <div className="wallet-symbol">₹</div>
        </section>

        <section className="wallet-action-card">
          <div>
            <h2>Add Money to Wallet</h2>
            <p>Add funds to pay for your upcoming shipments.</p>
          </div>

          <div className="wallet-add-form">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              min="100"
              placeholder="Enter amount (minimum ₹100)"
            />

            <button
              type="button"
              onClick={() => alert('Wallet payments will be connected to Razorpay soon.')}
            >
              + Add Money
            </button>
          </div>
        </section>

        <section className="wallet-transactions">
          <div className="wallet-transactions-heading">
            <div>
              <h2>Transaction History</h2>
              <p>Review your wallet activity.</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="wallet-empty">
              <div>💳</div>
              <h3>No transactions yet</h3>
              <p>Your wallet transactions will appear here.</p>
            </div>
          ) : (
            <div className="wallet-transaction-list">
              {transactions.map((transaction) => (
                <div key={transaction.id}>
                  {transaction.description}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Wallet;
