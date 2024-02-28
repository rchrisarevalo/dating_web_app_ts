import { Link } from 'react-router-dom';
import MediaQuery from 'react-responsive';

export const Options = () => {
    return (
        <>
            <MediaQuery minWidth={1024}>                
                <div className="options-container">
                    <div className="options-menu">
                        <div className="options-menu-links-container">
                            <Link to="/profile/options/update">Update Profile</Link>
                            <Link to="/profile/options/settings">Account Settings</Link>
                            <Link to="/profile/options/privacy">Privacy Settings</Link>
                        </div>
                    </div>
                </div>
            </MediaQuery>
            <MediaQuery maxWidth={1024}>
                <div className="options-container">
                    <div className="options-menu-mobile">
                        <div className="options-menu-links-container">
                            <Link to="/profile/options/update">Update Profile</Link>
                            <Link to="/profile/options/settings">Account Settings</Link>
                            <Link to="/profile/options/privacy">Privacy Settings</Link>
                        </div>
                    </div>
                </div>
            </MediaQuery>
        </>
    )
}