interface NotificationCountProps {
    counter: number
}

export const NotificationCounter = (props: NotificationCountProps) => {
    const { counter } = props
    
    return (
        <>
            {counter !== 0 ? <span id="notification-count">{counter}</span> : <></>}
        </>
    )
}