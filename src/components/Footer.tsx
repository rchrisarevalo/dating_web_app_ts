export const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="copyright">
                <p>{`© ${new Date().getFullYear()} Dating App. All rights reserved.`}</p>
            </div>
            <div className="terms-col">
                <a href="/tos" rel="noreferrer">Terms of Use</a>
                <a href="/" rel="noreferrer">Privacy Policy</a>
                <a href="/" rel="noreferrer">Licenses</a>
            </div>
        </footer>
    )
}