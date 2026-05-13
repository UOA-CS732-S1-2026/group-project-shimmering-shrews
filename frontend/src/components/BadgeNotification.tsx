import { useEffect } from "react"

type BadgeNotificationProps = {
  badges: {
    id: number
    name: string
    description: string | null
    activeUrl: string | null
  }[]
  onClose?: () => void
}

function BadgeNotification({ badges, onClose }: BadgeNotificationProps) {
  useEffect(() => {
    // close after short delay
    setTimeout(() => {
      onClose?.();
    }, 2000); 
  }, [onClose])

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>New Badge Unlocked</h3>

          {onClose && (
            <button
              aria-label="Close badge notification"
              onClick={onClose}
              style={styles.closeButton}
              type="button"
            >
              ×
            </button>
          )}
        </div>

        <div style={styles.badgeList}>
          {badges.map((badge) => (
            <div key={badge.id} style={styles.badgeRow}>
              <div style={styles.badgeIcon}>
                {badge.activeUrl ? (
                <img
                  src={badge.activeUrl}
                  alt={badge.name}
                  style={styles.badgeImage}
                />
                ) : (
                  <span style={styles.badgeFallback}>★</span>
                )}
              </div>

              <div style={styles.badgeText}>
                <h4 style={styles.badgeName}>{badge.name}</h4>
                {badge.description && (
                  <p style={styles.badgeDescription}>{badge.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10000,
  },

  card: {
    width: 420,
    background: 'white',
    padding: '16px',
    border: '1px solid #d8ebf2',
    borderRadius: '8px',
    boxShadow: '0 20px 60px rgba(35, 82, 96, 0.12)',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },

  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },

  closeButton: {
    border: 'none',
    background: 'transparent',
    color: '#777',
    cursor: 'pointer',
    fontSize: 24,
    lineHeight: 1,
    padding: 0,
  },

  badgeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #3489ff,  #f469ef)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },

  badgeImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  badgeFallback: {
    color: 'white',
    fontSize: 24,
    fontWeight: 900,
  },

  badgeText: {
    minWidth: 0,
  },

  badgeName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },

  badgeDescription: {
    margin: '4px 0 0',
    color: '#555',
    fontSize: 14,
  },
}

export default BadgeNotification
