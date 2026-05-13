import { Link, Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

// Layout wrapper for authenticated pages that include the bottom navigation bar.
// Used for the map, challenges, and other tabbed views.
export default function TabsLayout() {

  return (
    <div className="container">
      <header>
        <nav className="topbar" aria-label="Main navigation">
          <Link to="/" aria-label="CityQuest home">
            CityQuest
          </Link>
        </nav>
      </header>
      
      <Outlet />

      <BottomNav />
    </div>
  );
}
