import { Spinner } from "react-bootstrap";
import { useEffect, useState } from "react";

interface LoadingProps {
    error: boolean
}

export const Loading = (props: LoadingProps) => {
    const [seconds, setSeconds] = useState(1000)

    const reloadFunc = () => {
        window.location.reload()
    }

    const { error } = props

    useEffect(() => {
        if (error) {
            setTimeout(() => {
                setSeconds(seconds - 1)
            }, 1000)

            setTimeout(() => {
                window.location.reload()
            }, 1000000)
        }
    }, [error, seconds])

    return (
        <>
            {!error ?
                <div className="loading">
                    <Spinner animation='border' />
                    <p>Loading...</p>
                </div>
                :
                <div className="loading">
                    <p>Failed to load or perform request. Please try again or wait to be redirected in {seconds === 1 ? `${seconds} second` : `${seconds} seconds`}.</p>
                    <br></br>
                    <button style={{background: 'white', border: 'none', padding: '7px 30px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '900'}} onClick={reloadFunc}>Reload Page</button>
                </div>
            }
        </>
    )
}