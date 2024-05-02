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