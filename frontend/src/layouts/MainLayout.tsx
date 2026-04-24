import { Link, Outlet } from "react-router-dom";

export default function Layout() {

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

      <footer></footer>
    </div>
  );
}
