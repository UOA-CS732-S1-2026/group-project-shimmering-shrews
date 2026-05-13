import { Link, Outlet } from "react-router-dom";

// Basic layout wrapper with a top navigation bar and footer.
// Used for public pages like login and auth callback that don't require the bottom nav.
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
