interface WrapperProps {
    children: React.ReactNode
}

export const Wrapper = (props: WrapperProps) => {
    const { children } = props

    return (
        <div className="wrapper">
            {children}
        </div>
    )
}

export const CenterWrapper = (props: WrapperProps) => {
    const { children } = props

    return (
        <div className="center-wrapper">
            { children }
        </div>
    )
}

export const SideScrollWrapper: React.FC<WrapperProps> = ({ children }) => {
    return (
        <div className="side-scroll-wrapper">
            { children }
        </div>
    )
}

export const SideScrollInnerWrapper: React.FC<WrapperProps> = ({ children }) => {
    return (
        <div className="side-scroll-inner-wrapper">
            { children }
        </div>
    )
}