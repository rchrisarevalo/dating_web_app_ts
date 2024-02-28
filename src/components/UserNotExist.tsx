export const UserNotExist = () => {
    return (
        <div className="user-not-exist" style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', color: 'rgb(205, 44, 226)' }}>
            <h1>This user or page does not exist!</h1>
            <h5>
                {`If this page leads to a user you blocked, go to Settings > Privacy Settings > View Blocked Users to see if they had been blocked or not. Otherwise, you have been blocked.`}
            </h5>
            <button style={{borderRadius: '20px', padding: '7px 30px', border: 'none', fontWeight: '1000', textTransform: 'uppercase'}}><a href="/" style={{textDecoration: 'none', color: 'black'}}>Go To Profile</a></button>
        </div>
    )
}