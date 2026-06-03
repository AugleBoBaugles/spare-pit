import { useState } from 'react'
import { useInventory } from '../utils/useInventory'
import { patchInventory } from '../lib/api'
import '../styles/HomePage.css'

function HomePage() {
  const { data, loading, updateItem } = useInventory()

  const total = data.length
  const checkedOut = data.filter(i => i.status === 'checked-out').length
  const attention = data.filter(i => i.status === 'maintenance' || i.status === 'missing')
  const restock = data.filter(i => i.needsRestock)

  const [restockingId, setRestockingId] = useState(null)
  const [restockQty, setRestockQty] = useState('')

  function handleRestockOpen(item) {
    setRestockingId(item.id)
    setRestockQty(item.quantity ?? '')
  }

  async function handleRestockConfirm(item) {
    try {
      const updated = await patchInventory(item.id, {
        needsRestock: 0,
        quantity: restockQty !== '' ? Number(restockQty) : item.quantity,
      })
      updateItem(updated)
      setRestockingId(null)
    } catch {
      // silently ignore — the item stays in the list and the user can try again
    }
  }

  return (
    <div className="home-page">
        <h2>Dashboard</h2>

      <div className="home-stats">
        <div className="stat">
          <span className="stat__value">{loading ? '—' : total}</span>
          <span className="stat__label">Total items</span>
        </div>
        <div className="stat">
          <span className="stat__value">{loading ? '—' : checkedOut}</span>
          <span className="stat__label">Checked out</span>
        </div>
        <div className="stat">
          <span className="stat__value">{loading ? '—' : attention.length}</span>
          <span className="stat__label">Needs attention</span>
        </div>
        <div className="stat">
          <span className="stat__value">{loading ? '—' : restock.length}</span>
          <span className="stat__label">Needs restock</span>
        </div>
      </div>

      <div className="home-attention">
        <p className="home-section-label">Needs attention</p>
        {loading ? null : attention.length === 0 ? (
          <p className="home-empty">All items are accounted for.</p>
        ) : (
          <ul className="attention-list">
            {attention.map(item => (
              <li key={item.id} className="attention-item">
                <span className="attention-item__name">{item.name}</span>
                <span className={`attention-item__badge attention-item__badge--${item.status}`}>
                  {item.status}
                </span>
                {item.location && (
                  <span className="attention-item__loc">{item.location}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="home-restock">
        <p className="home-section-label">Needs restock</p>
        {loading ? null : restock.length === 0 ? (
          <p className="home-empty">No items are flagged for restock.</p>
        ) : (
          <ul className="attention-list">
            {restock.map(item => (
              <li key={item.id} className="attention-item">
                <span className="attention-item__name">{item.name}</span>
                {item.quantity != null && (
                  <span className="restock-item__qty">Qty: {item.quantity}</span>
                )}
                {item.location && (
                  <span className="attention-item__loc">{item.location}</span>
                )}
                {restockingId === item.id ? (
                  <div className="restock-item__form">
                    <input
                      type="number"
                      min={0}
                      className="restock-item__qty-input"
                      value={restockQty}
                      onChange={e => setRestockQty(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => handleRestockConfirm(item)}>Save</button>
                    <button onClick={() => setRestockingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    className="restock-item__clear"
                    onClick={() => handleRestockOpen(item)}
                  >
                    Mark as restocked
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default HomePage
