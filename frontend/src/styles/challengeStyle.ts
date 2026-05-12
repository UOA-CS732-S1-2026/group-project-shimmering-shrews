export const containerStyle = {
        maxWidth: "30vh",
        minWidth: "350px",
        minHeight: "80vh",
        margin: "0 auto",
        padding: "0 2em 0 2em",

        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      } as const
export const cardStyle = {
        background: "rgba(255, 255, 255, 0.82)",
        padding: "16px",
        marginBottom: "16px",
        position: "relative",
        border: "1px solid #d8ebf2",
        borderRadius: "8px",
        boxShadow: "0 20px 60px rgba(35, 82, 96, 0.12)",
      } as const
export const badgeStyle = {
        padding: "6px 12px",
        borderRadius: "20px",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "bold",
        margin: "0",
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
        background: "linear-gradient(270deg, #3489ff,  #f469ef)",
        color: "white",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer"
    } as const
export const categoryColors: { [key: string]: string } = {
        Food: "#6acf3c",
        Fitness: "#ffae00",
        Social: "#3ac4ff",
        Nature: "#83c577",
    }
export const categoryColorsStrong: { [key: string]: string } = {
        Food: "#51ff00",
        Fitness: "#ffae00",
        Social: "#3ac4ff",
        Nature: "#83c577",
    }
export const challengeTitleStyle = {
        margin: 0, 
        textAlign: "left", 
        fontSize: "16px", 
        fontWeight: "bold"
    } as const
export const titleStyle = {
        color: "#071317",
        textAlign: "center",
        margin: "16px 0px 16px 0px",
        fontSize: "24px",
        fontWeight: "bold",
    } as const

export const challengeStatusColors: { [key: string]: string } = {
        in_progress: "#e9d500",
        accepted: "#35a9f1",
        cancelled: "#f5a0a0",
        expired: "#d7c2ff",
        skipped: "#a3a3a3",
        completed: "#56ea60",
    }

export const challengeStatusText: { [key: string]: string } = {
        in_progress: 'Pending',
        accepted: 'Accepted',
        cancelled: 'Cancelled',
        expired: 'Expired',
        skipped: 'Skipped',
        completed: 'Completed',
    }


