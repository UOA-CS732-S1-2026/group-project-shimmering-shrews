import { useEffect, useState } from "react"

type ChallengeCompletionNotificationProps = {
  xpGained: number
  previousXp: number
  newXp: number
  previousLevelXpRequired: number
  nextLevelXpRequired: number
  levelUp: boolean
  previousLevel?: number
  newLevel: number
  xpForLevelStart: number
  xpForNextLevelStart: number
  message: string
  onClose?: () => void
}

function LevelUpNotification({
  xpGained,
  previousXp,
  newXp,
  previousLevelXpRequired,
  nextLevelXpRequired,
  levelUp,
  previousLevel,
  newLevel,
  xpForLevelStart,
  xpForNextLevelStart,
  message,
  onClose,
}: ChallengeCompletionNotificationProps) {

  const [progress, setProgress] = useState(0);

  const progressBefore =
    Math.min(100, Math.max(0, ((previousXp - xpForLevelStart) / previousLevelXpRequired) * 100));

  const progressAfter =
    Math.min(100, Math.max(0, ((newXp - xpForNextLevelStart) / nextLevelXpRequired) * 100));

  console.log(newXp)
  console.log(xpForNextLevelStart)
  console.log(nextLevelXpRequired)

  useEffect(() => {
    // Start at previous progress
    setProgress(progressBefore);

    // Animate after short delay
    const timeout = setTimeout(() => {
      if (levelUp) {
        /**
         * Fill current level bar
         */
        setProgress(100);

        /**
         * Reset and animate new level
         */
        setTimeout(() => {
          setProgress(0);

          setTimeout(() => {
            setProgress(progressAfter);

            setTimeout(() => {
              onClose?.();
            }, 2000); 

          }, 100);
        }, 900);
      } else {
        setProgress(progressAfter);
        setTimeout(() => {
            onClose?.();
        }, 2000); 
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [levelUp, progressBefore, progressAfter, onClose]);

  return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.header}>
            {levelUp ? (
              <h3>
                {levelUp
                  ? `🎉 Level Up! Level ${previousLevel} → ${newLevel}`
                  : `+${xpGained} XP`}
              </h3>
            ) : (
              <div style={styles.levelText}>Level {previousLevel}</div>
            )}
          </div>

          <div style={styles.xpGain}>+{xpGained} XP</div>
          <p style={styles.message}>{message}</p>

          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.barFill,
                width: `${Math.max(0, Math.min(progress, 100))}%`,
              }}
            />
          </div>

          <div style={styles.footer}>
            {levelUp ? (
              <>
                {newXp - xpForNextLevelStart} /{" "}
                {nextLevelXpRequired} XP
              </>
            ) : (
              <>
                {newXp - xpForLevelStart} /{" "}
                {previousLevelXpRequired} XP
              </>
            )}
          </div>
        </div>

      </div>
    );
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

  levelUpText: {
    fontSize: 30,
    fontWeight: 900,
    color: "#00aaff",
    marginBottom: 4,
  },

  levelText: {
    fontSize: 20,
    fontWeight: 700,
  },

  xpGain: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: "#6ee7ff",
  },

  message: {
    margin: "0 0 16px",
    color: "#24424d",
    fontSize: 14,
    lineHeight: 1.4,
  },

  barContainer: {
    width: "100%",
    height: 24,
    background: "#d4d4d4",
    borderRadius: 999,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #3489ff,  #f469ef)",
    transition: "width 1s ease-in-out",
  },

  footer: {
    marginTop: 10,
    textAlign: "right",
    fontSize: 14,
    opacity: 0.8,
  },
};

export default LevelUpNotification
