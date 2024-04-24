import { IoMenuOutline } from 'react-icons/io5';

import logo from '../images/New Dating App Logo (White).png';

export const TOS = () => {
    return (
        <div className="policy-container">
            <div className="menu">
                <div className="menu-logo">
                    <img src={logo} alt="logo" id="policy-logo"></img>
                </div>
                <div className="links-menu">
                    <li><a href="/home">Home</a></li>
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/">Sign In</a></li>
                </div>
                <div className="links-menu-mobile">
                    <IoMenuOutline size={30}/>
                </div>
            </div>
            <div className="policy-section">
                <div className="policy-section-menu-list-container">
                    <div className="policy-section-menu-list">
                        <li><a href="#intro">Introduction</a></li>
                        <li><a href="#datacollection">Data Collection</a></li>
                        <li><a href="#accountregistration">Account Registration</a></li>
                        <li><a href="#accounttermination">Account Termination</a></li>
                    </div>
                </div>
                <div className="policy-section-menu" id="policy">
                    <h1>Terms of Service</h1>
                    <div className="policy-section-menu-details">
                        <li id="intro">Introduction</li>
                        <div id="paragraph">
                            <p>
                                Welcome to <b>Dating App</b>. By agreeing to use our service(s) or visiting
                                the site, you are agreeing to our Terms of Service and Privacy Policy listed below 
                                in regards to your use of this Site's services. When reading through the terms and 
                                conditions of this document, you are also agreeing to said Terms and Conditions when
                                creating and using an account on this Site.
                            </p>
                        </div>
                        <li id="datacollection"><b>Data Collection</b></li>
                        <div id="paragraph">
                            <p id="paragraph-section-header"><b>2.1: Collection of Personal Data</b></p>
                            <div id="paragraph-section">
                                <p>
                                    When using this Site and its resources, we will collect specific personal data
                                    when you register for an account. This information includes, but is not limited
                                    to:
                                </p>
                                <li>Your name (first name, middle name, and last name)</li>
                                <li>Your city and state residence</li>
                                <li>Your date of birth</li>
                                <li>Your password</li>
                                <li>Your height</li>
                                <li>Your sexual orientation and gender interest</li>
                                <li>Your relationship status</li>
                                <br></br>
                                <p>
                                    All of the personal data mentioned above will be stored securely in our database to uphold the
                                    highest standards of individual privacy. We will utilize your personal data for analytical
                                    purposes only to improve our Site. In addition, we will utilize your personal data to improve
                                    your match suggestions when searching for people that have similar qualities and interests
                                    to you.
                                </p>
                                <p>
                                    Furthermore, we will <b>NOT</b> use your personal data to discriminate based on your gender,
                                    sexual orientation, national origin, age, religion, political affiliation, etc.,
                                    in accordance with US federal and state privacy and data collection laws.
                                </p>
                            </div>
                            <p id="paragraph-section-header"><b>2.2: Retention and Usage of Data For Reports</b></p>
                            <div id="paragraph-section">
                                <p>
                                    If you find yourself being harassed, doxxed, stalked, or threatened by someone who has a hold
                                    of your personal data, please let our team know <b>immediately</b> and we will do our very best to resolve
                                    the situation and uphold the highest standards in personal safety on this platform.
                                </p>
                                <p>
                                    You can additionally make a report on the user after you have blocked them, and our systems will 
                                    securely store your documentation (e.g. files, photographs, etc.) in our database to use
                                    in the event where we decide to terminate the user and/or provide evidence
                                    to the legal authorities.
                                </p>
                                <p>
                                    Your report and any associated documentation will be retained for 5 years for bans that do not
                                    involve illegal activity. However, this data will be retained permanently for serious crimes, 
                                    such as, but not limited to: 
                                    <ol>
                                        <li>Sexual assault and/or harassment</li>
                                        <li>Domestic abuse</li>
                                        <li>Distribution of inappropriate content without consent</li>
                                        <li>Fraud</li>
                                    </ol>
                                </p>
                                <p>
                                    The data will only be provided to the authorities should they provide a valid request
                                    and a court order to do so.
                                </p>
                                <p>
                                    Furthermore, if you come across disturbing content involving minors,
                                </p>
                                <p>
                                    <b style={{fontSize: '23px'}}> 
                                    PLEASE DO NOT, UNDER ANY CIRCUMSTANCES, SUBMIT ANY DOCUMENTATION THAT
                                    CONTAINS SUCH CONTENT WHEN MAKING A REPORT OR EVEN CLICK ON SAID CONTENT.
                                    IT IS A SERIOUS CRIME--EVEN IF DONE IN GOOD FAITH--AND WILL RESULT IN YOUR
                                    ACCOUNT BEING AUTOMATICALLY TERMINATED.
                                    </b>
                                </p>
                                <p>
                                    Instead, report the content to your local <b>Child Protective Services (CPS)</b> agency,
                                    or any of the following agencies:
                                    <ol>
                                        <li>National Center for Missing and Exploited Children (NCMEC)</li>
                                        <li>CyberTipline</li>
                                        <li>Federal Bureau of Investigation (FBI)</li>
                                        <li>Childhelp National Child Abuse Hotline</li>
                                    </ol>
                                </p>
                            </div>
                            <p id="paragraph-section-header"><b>2.3: Account Deletion</b></p>
                            <div id="paragraph-section">
                                <p>
                                    Should you wish to delete your account and any associated personal data
                                    stored in our database, click on the cog icon in your profile, go to "Privacy Settings", 
                                    and click on "Delete Your Account", where it will then display a prompt confirming 
                                    your decision.
                                </p>
                                <p>
                                    In the event that your account is deleted, all of your personal data, including your
                                    messages, search history, and any associated profile information, will be
                                    deleted from our database immediately.
                                </p>
                                <p>
                                    For more details surrounding this section, please visit our Privacy Policy page.
                                </p>
                            </div>
                        </div>
                        <li id="accountregistration">Account Registration</li>
                        <div id="paragraph">
                            <p>
                                To register for an account, you must be at or past the age of majority in your local jurisdiction.
                                Generally, you must be <b>18 years old</b> to register for an account. However, you must be <b>19 years old</b> in 
                                Nebraska and Alabama, and <b>21 years old</b> in Mississippi, to do so 
                                if you currently reside in those jurisdictions.
                            </p>
                            <p>
                                By registering for an account, you are agreeing to not only our <b>Terms of Service</b>, but also
                                our <b>Privacy Policy</b> as well to use our Site's service(s).
                            </p>
                            <p>
                                If you register for an account using a birthday other than your own, and you attempt to change
                                your birthday in your profile settings, we will determine whether you were old enough to
                                register for an account based on your registration date.
                            </p>
                            <b>
                                If our team discovers that your age was below 18 when you registered for an account after performing
                                said actions, your account will be automatically terminated as a result of violating this
                                section, as outlined in <i>Section 4: Account Termination.</i>
                            </b>
                        </div>
                        <li id="accounttermination">Account Termination</li>
                        <div id="paragraph">
                            <p>
                                Welcome to <b>DateMatch</b>. By agreeing to use our service(s) or visiting
                                the site, you are agreeing to the Terms of Service listed below in regards
                                to your use of this Site's services. 
                            </p>
                        </div>
                        <li>Copyright</li>
                        <div id="paragraph">
                            <p>
                                Welcome to <b>DateMatch</b>. By agreeing to use our service(s) or visiting
                                the site, you are agreeing to the Terms of Service listed below in regards
                                to your use of this Site's services. 
                            </p>
                        </div>
                        <li>Privacy Policy</li>
                        <div id="paragraph">
                            <p>
                                Welcome to <b>DateMatch</b>. By agreeing to use our service(s) or visiting
                                the site, you are agreeing to the Terms of Service listed below in regards
                                to your use of this Site's services. 
                            </p>
                        </div>
                        <li>Privacy Policy</li>
                        <div id="paragraph">
                            <p>
                                Welcome to <b>DateMatch</b>. By agreeing to use our service(s) or visiting
                                the site, you are agreeing to the Terms of Service listed below in regards
                                to your use of this Site's services. 
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}