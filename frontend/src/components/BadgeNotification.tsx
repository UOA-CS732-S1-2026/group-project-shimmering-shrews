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
  return (
    <div className="fixed bottom-28 right-6 z-50 max-w-sm rounded-2xl bg-yellow-50 p-4 shadow-lg border border-yellow-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-yellow-700">New Badge Unlocked</p>

          {badges.map((badge) => (
            <div key={badge.id} className="mt-2 flex items-center gap-3">
              {badge.activeUrl && (
                <img
                  src={badge.activeUrl}
                  alt={badge.name}
                  className="h-12 w-12 rounded-full"
                />
              )}

              <div>
                <h3 className="text-base font-bold">{badge.name}</h3>
                <p className="text-sm text-gray-700">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default BadgeNotification