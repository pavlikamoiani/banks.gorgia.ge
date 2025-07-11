import styles from '../assets/css/modal.module.css';
import { useState, useEffect } from 'react';

const ANIMATION_DURATION = 220;

const AddContragentModal = ({
    open,
    onClose,
    onSubmit,
    form,
    onChange,
    error,
    t
}) => {
    const [show, setShow] = useState(open);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (open) {
            setShow(true);
            setClosing(false);
        } else if (show) {
            setClosing(true);
            const timer = setTimeout(() => {
                setShow(false);
                setClosing(false);
            }, ANIMATION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            onClose();
        }, ANIMATION_DURATION);
    };

    if (!show) return null;

    return (
        <div className={styles.overlay}>
            <div
                className={`${styles.modal} ${closing ? styles.modalClosing : ''}`}
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
                <h3 className={styles.modalTitle}>{t('add_contragent')}</h3>
                <form onSubmit={onSubmit}>
                    <div className={styles.modalFormGroup}>
                        <label>{t('title')}</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            className={styles.modalInput}
                            required
                        />
                    </div>
                    <div className={styles.modalFormGroup}>
                        <label>{t('identification_code')}</label>
                        <input
                            type="text"
                            name="identification_code"
                            value={form.identification_code}
                            onChange={onChange}
                            className={styles.modalInput}
                            required
                        />
                    </div>
                    {error && <div className={styles.modalError}>{error}</div>}
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={handleClose}
                            className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
                        >
                            {t('add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContragentModal;
