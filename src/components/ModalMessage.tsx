import { useState } from 'react'

// Will use the Modal component from React Bootstrap,
// which is licensed under the MIT License.
//
// Documentation to code:
// https://react-bootstrap.netlify.app/docs/components/modal/
import Modal from 'react-bootstrap/Modal'

interface ModalMessageProps {
    children: React.ReactNode
}

export const ModalMessage = (props: ModalMessageProps) => {
    const { children } = props

    const [displayModal, setDisplayModal] = useState(false)

    const closeModal = () => setDisplayModal(false)

    return (
        <Modal show={displayModal} onHide={closeModal}>
            { children }
        </Modal>
    )
}