import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function TabsLayout() {

  return (
    <div className="container">
      <header>
        <nav className="topbar" aria-label="Main navigation">
          <a href="/" aria-label="CityQuest home">
            CityQuest
          </a>
        </nav>
      </header>
      
      <Outlet />

      <BottomNav />
    </div>
  );
}