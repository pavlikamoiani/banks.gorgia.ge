import styles from '../assets/css/deleteConfirmModal.module.css';
import { useState, useEffect } from 'react';

const DeleteConfirmModal = ({
    open,
    onClose,
    onConfirm,
    title = '',
    text = '',
    t
}) => {
    const [show, setShow] = useState(open);

    useEffect(() => {
        if (open) {
            setShow(true);
        } else if (show) {
            setShow(false);
        }
    }, [open]);

    const handleClose = () => {
        onClose();
    };

    const handleConfirm = () => {
        onConfirm();
    };

    if (!show) return null;

    return (
        <div className={styles.overlay}>
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.modalClose}
                    onClick={handleClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <div className={styles.modalDeleteTitle}>
                    {t ? t('delete_title') : title}
                </div>
                <div className={styles.modalDeleteText}>
                    {t ? t('delete_confirm_text') : text}
                </div>
                <div className={styles.modalActions}>
                    <button
                        type="button"
                        onClick={handleClose}
                        className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                    >
                        {t ? t('cancel') : 'Отмена'}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`${styles.modalButton} ${styles.modalButtonDelete}`}
                    >
                        {t ? t('delete') : 'Удалить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
