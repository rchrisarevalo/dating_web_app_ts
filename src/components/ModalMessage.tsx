// Will use the Modal component from React Bootstrap,
// which is licensed under the MIT License.
//
// Documentation to code:
// https://react-bootstrap.netlify.app/docs/components/modal/
import Modal from 'react-bootstrap/Modal'

interface ModalMessageProps {
    children: React.ReactNode
    displayModal: boolean,
    setDisplayModal: React.Dispatch<React.SetStateAction<boolean>>
}

export const ModalMessage = (props: ModalMessageProps) => {
    const { children, displayModal, setDisplayModal } = props

    return (
        <Modal show={displayModal} onHide={() => setDisplayModal(false)} keyboard={false} backdrop="static" centered>
            { children }
        </Modal>
    )
}