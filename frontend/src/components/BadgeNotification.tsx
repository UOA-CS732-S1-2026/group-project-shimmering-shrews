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
          <h3>New Badge Unlocked</h3>

          {badges.map((badge) => (
            <div key={badge.id} style={styles.badgeDisplay}>
              {badge.activeUrl && (
                <img
                  src={badge.activeUrl}
                  alt={badge.name}
                  style={styles.badgeImage}
                />
              )}

              <div>
                <h3>{badge.name}</h3>
                <p style={styles.message}>{badge.description}</p>
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
  position: "fixed",
  inset: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "rgba(0, 0, 0, 0.3)",
  zIndex: 9999,
},

badgeDisplay: {
  display: "flex",
  marginTop: "0.5rem",
  alignItems: "center",
  gap: "0.75rem",
},

badgeImage: {
  width: 64,
  height: 64,
  objectFit: "contain",
  flexShrink: 0,
},

card: {
  width: 420,
  background: "white",
  padding: "16px",
  border: "1px solid #d8ebf2",
  borderRadius: "8px",
  boxShadow: "0 20px 60px rgba(35, 82, 96, 0.12)",
},

header: {
  marginBottom: 16,
},

message: {
  margin: "0 0 16px",
  color: "#24424d",
  fontSize: 14,
  lineHeight: 1.4,
},

};

export default BadgeNotification