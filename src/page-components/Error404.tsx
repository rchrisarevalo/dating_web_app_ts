interface Error404Props {
    errorInvoked: boolean,
    status_code: number
}

export const Error404 = (props: Error404Props) => {
    const { errorInvoked, status_code } = props

    if (errorInvoked) {
        setTimeout(() => {
            if (status_code !== 403) {
                window.location.href = "http://localhost:5173/"
            }
        }, 3000)

        const handleLogout = () => {
            fetch("http://localhost:5000/logout", {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                if (res.ok) {
                    return res.json()
                }
            }).then(() => {
                sessionStorage.removeItem("username")
                sessionStorage.removeItem("profile_pic")
                window.location.href = "http://localhost:5173"
            })
            .catch((error) => {
                console.log(error)
            })
        }

        return (
            <>
                {(status_code !== 403) ?
                    <div className="error-container">
                        <div className="error-message">
                            <h1>ERROR 404: The link you entered was invalid.</h1>
                        </div>
                    </div>
                    :
                    <div className="error-container" style={{position: 'fixed'}}>
                        <div className="error-message">
                            <h1><b style={{fontWeight: '1000'}}>Uh oh! It appears that your account has been suspended for violating our Terms of Service.</b></h1>
                            <p>If you believe that our decision was wrong, please feel free to submit an appeal. Unfortunately, we do <b>not</b> have an appeals process yet.</p>
                            <p>Stay tuned for an update on when the appeals process is available as the app is currently in development.</p>
                            <button style={{borderRadius: '25px', padding: '7px 30px', marginTop: '30px', marginBottom: '30px', border: 'none', fontWeight: '1000', textTransform: 'uppercase'}} onClick={handleLogout}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                }
            </>
        )
    }
}