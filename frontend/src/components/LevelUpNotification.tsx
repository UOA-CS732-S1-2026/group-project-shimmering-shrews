type ChallengeCompletionNotificationProps = {
  xpGained: number
  levelUp: boolean
  previousLevel?: number
  newLevel: number
  message: string
  onClose?: () => void
}

function LevelUpNotification({
  xpGained,
  levelUp,
  newLevel,
  message,
  onClose,
}: ChallengeCompletionNotificationProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-white p-4 shadow-lg border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">Challenge completed</p>
          <h3 className="text-lg font-bold">
            {levelUp ? `Level Up! Level ${newLevel}` : `+${xpGained} XP`}
          </h3>
          <p className="mt-1 text-sm text-gray-700">{message}</p>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default LevelUpNotification