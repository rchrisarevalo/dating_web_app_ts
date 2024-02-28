import { Spinner } from "react-bootstrap";

interface LoadingProps {
    error: boolean
}

export const Loading = (props: LoadingProps) => {
    const reloadFunc = () => {
        window.location.reload()
    }

    const { error } = props

    return (
        <>
            {!error ?
                <div className="loading">
                    <Spinner animation='border' />
                    <p>Loading...</p>
                </div>
                :
                <div className="loading">
                    <p>Failed to load or perform request. Please try again.</p>
                    <br></br>
                    <button style={{background: 'white', border: 'none', padding: '7px 30px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '900'}} onClick={reloadFunc}>Reload Page</button>
                </div>
            }
        </>
    )
}