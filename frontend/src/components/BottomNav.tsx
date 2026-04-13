function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <a className="bottom-nav__item" href="#map" aria-label="Map">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18.7 4.8 21A1.2 1.2 0 0 1 3 19.9V5.3c0-.4.2-.8.6-1L9 1.3v17.4Zm6 4-6-4V1.3l6 4v17.4Zm0 0V5.3L19.2 3A1.2 1.2 0 0 1 21 4.1v14.6c0 .4-.2.8-.6 1L15 22.7Z" />
        </svg>
      </a>

      <a className="bottom-nav__item bottom-nav__item--active" href="/" aria-label="Profile" aria-current="page">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12.2a4.7 4.7 0 1 0 0-9.4 4.7 4.7 0 0 0 0 9.4Zm0 2.1c-4.5 0-8.2 2.4-8.2 5.3 0 .9.7 1.6 1.6 1.6h13.2c.9 0 1.6-.7 1.6-1.6 0-2.9-3.7-5.3-8.2-5.3Z" />
        </svg>
      </a>
    </nav>
  )
}

export default BottomNav
