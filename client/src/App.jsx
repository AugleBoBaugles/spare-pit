import { useState } from "react";
import AddItemPage from "./components/AddItemPage";
import InventoryPage from "./components/InventoryPage";
import HomePage from "./components/HomePage";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "inventory", label: "Inventory" },
  { id: "add", label: "Add Item" },
];

function App() {
  const [activePage, setActivePage] = useState("home");

  return (
    <>
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