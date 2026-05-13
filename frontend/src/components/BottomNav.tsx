import { NavLink } from "react-router-dom"


// Bottom navigation bar with links to the map, challenges, and profile pages.
// Applies an active class to the current route's nav item.
function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <NavLink
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
        }
        to="/map"
        aria-label="Map"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18.7 4.8 21A1.2 1.2 0 0 1 3 19.9V5.3c0-.4.2-.8.6-1L9 1.3v17.4Zm6 4-6-4V1.3l6 4v17.4Zm0 0V5.3L19.2 3A1.2 1.2 0 0 1 21 4.1v14.6c0 .4-.2.8-.6 1L15 22.7Z" />
        </svg>
      </NavLink>

      <NavLink
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
        }
        to="/challenges"
        aria-label="Challenges"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4.75A2.75 2.75 0 0 1 9.75 2h4.5A2.75 2.75 0 0 1 17 4.75V6h.75A2.25 2.25 0 0 1 20 8.25v10.5A2.25 2.25 0 0 1 17.75 21H6.25A2.25 2.25 0 0 1 4 18.75V8.25A2.25 2.25 0 0 1 6.25 6H7V4.75Zm2.75-.75a.75.75 0 0 0-.75.75V6h6V4.75a.75.75 0 0 0-.75-.75h-4.5ZM8 11a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h3.5a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Z" />
        </svg>
      </NavLink>

      <NavLink
        className={({ isActive }) =>
          `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
        }
        to="/profile"
        aria-label="Profile"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12.2a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4Zm0 2.1c-4.5 0-8.2 2.4-8.2 5.3 0 .9.7 1.6 1.6 1.6h13.2c.9 0 1.6-.7 1.6-1.6 0-2.9-3.7-5.3-8.2-5.3Z" />
        </svg>
      </NavLink>
    </nav>
  )
}

export default BottomNav
