import styles from '../assets/css/modal.module.css';

const EditContragentModal = ({
    open,
    onClose,
    onSubmit,
    form,
    onChange,
    error,
    t
}) => {
    if (!open) return null;

    return (
        <div className={styles.overlay}>
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.modalClose}
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <h3 className={styles.modalTitle}>{t('edit_contragent')}</h3>
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
                            onClick={onClose}
                            className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditContragentModal;
