import { Outlet } from "react-router-dom";

export default function Layout() {

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

      <footer></footer>
    </div>
  );
}