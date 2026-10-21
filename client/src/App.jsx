// Root component. Owns the active page state and renders the nav and current page.
import { useState } from 'react';
import './styles/global.css';
import InventoryPage from "./components/InventoryPage/InventoryPage";
import HomePage from "./components/HomePage";
import LocationsPage from "./components/LocationsPage/LocationsPage";
import ThemeToggle from "./components/ThemeToggle";
import ScrollToTop from "./components/ScrollToTop";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "inventory", label: "Inventory" },
  { id: "locations", label: "Locations" },
];

function App() {
  const [activePage, setActivePage] = useState("inventory");
  // Location the Inventory page opens filtered to — set when a location card is clicked.
  const [inventoryLocation, setInventoryLocation] = useState(null);

  function navigate(page) {
    setInventoryLocation(null);
    setActivePage(page);
  }

  // `location` is { id, name, area }.
  function openLocation(location) {
    setInventoryLocation(location);
    setActivePage("inventory");
  }

  return (
    <>
      <ThemeToggle />
      <h1>Spare Pit</h1>

      <nav>
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => navigate(id)}
            className={activePage === id ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </nav>

      {activePage === "home" && <HomePage onNavigate={navigate} />}
      {activePage === "inventory" && <InventoryPage onNavigate={navigate} initialLocation={inventoryLocation} />}
      {activePage === "locations" && <LocationsPage onOpenLocation={openLocation} />}

      <ScrollToTop />
    </>
  );
}

export default App;