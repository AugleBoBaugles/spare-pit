// Root component. Owns the active page state and renders the nav and current page.
import { useState } from 'react';
import './styles/global.css';
import AddItemPage from "./components/AddItemPage";
import InventoryPage from "./components/InventoryPage/InventoryPage";
import HomePage from "./components/HomePage";
import ThemeToggle from "./components/ThemeToggle";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "inventory", label: "Inventory" },
  { id: "add", label: "Add Item" },
];

function App() {
  const [activePage, setActivePage] = useState("inventory");

  return (
    <>
      <ThemeToggle />
      <h1>Spare Pit</h1>

      <nav>
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={activePage === id ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </nav>

      {activePage === "home" && <HomePage onNavigate={setActivePage} />}
      {activePage === "add" && <AddItemPage onNavigate={setActivePage} />}
      {activePage === "inventory" && <InventoryPage onNavigate={setActivePage} />}
    </>
  );
}

export default App;