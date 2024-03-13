import { Spinner } from 'react-bootstrap'

interface NotificationCountProps {
    counter: number,
    pending: boolean,
    error: boolean
}

export const NotificationCounter = (props: NotificationCountProps) => {
    const { counter, pending, error } = props

    return (
        <>
            {!pending ?
                <>
                    {!error ?
                        <>
                            {(counter !== 0 && typeof(counter) !== "undefined") ? <span id="notification-count">{counter}</span> : <></>}
                        </>
                        :
                        <span id="notification-count">!</span>
                    }
                </>
                :
                <span id="notification-count" style={{ background: 'transparent' }}><Spinner size="sm" /></span>
            }
        </>
    )
}