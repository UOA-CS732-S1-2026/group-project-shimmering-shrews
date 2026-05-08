export const containerStyle = {
        maxWidth: "30vh",
        minWidth: "350px",
        minHeight: "80vh",
        margin: "0 auto",
        background: "#8b004b",
        padding: "50px",
        borderRadius: "20px",

        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      } as const
export const cardStyle = {
        background: "white",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "16px",
        position: "relative",
      } as const
export const badgeStyle = {
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        marginRight: "10px"
    } as const
export const xpStyle = {
        background: "#e0c3fc",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
    } as const
export const buttonStyle = {
        width: "100%",
        padding: "14px",
        marginTop: "12px",
        borderRadius: "12px",
        border: "2px solid white",
        background: "transparent",
        color: "white",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer"
    } as const
export const categoryColors: { [key: string]: string } = {
        Food: "#c8f7c5",
        Fitness: "#fceabb",
        Social: "#d5f5f9",
    Nature: "#dff6d8",
    }
export const categoryColorsStrong: { [key: string]: string } = {
        Food: "hsl(116, 100%, 71%)",
        Fitness: "hsl(43, 100%, 70%)",
        Social: "hsl(187, 100%, 75%)",
    Nature: "hsl(102, 55%, 58%)",
    }
export const challengeTitleStyle = {
        margin: 0, 
        textAlign: "left", 
        fontSize: "16px", 
        fontWeight: "bold"
    } as const
export const titleStyle = {
        color: "white",
        textAlign: "center",
        marginBottom: "16px",
        fontSize: "24px",
        fontWeight: "bold",
    } as const

export const challengeStatusColors: { [key: string]: string } = {
        in_progress: "#f8ec6e",
    accepted: "#8ac7ff",
    cancelled: "#f5a0a0",
        expired: "#d7c2ff",
        skipped: "#a3a3a3",
        completed: "#62e260",
    }

export const challengeStatusText: { [key: string]: string } = {
        in_progress: 'In Progress',
    accepted: 'Accepted',
    cancelled: 'Cancelled',
        expired: 'Expired',
        skipped: 'Skipped',
        completed: 'Completed',
    }


