import { Link, Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

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
