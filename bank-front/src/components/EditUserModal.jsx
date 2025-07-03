import styles from '../assets/css/modal.module.css';

const EditUserModal = ({
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
                <h3 className={styles.modalTitle}>{t('edit_user')}</h3>
                <form onSubmit={onSubmit}>
                    <div className={styles.modalFormGroup}>
                        <label>{t('name')}</label>
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
                        <label>{t('email')}</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            className={styles.modalInput}
                            required
                        />
                    </div>
                    <div className={styles.modalFormGroup}>
                        <label>{t('role')}</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={onChange}
                            className={styles.modalInput}
                            required
                        >
                            <option value="">{t('select_role')}</option>
                            <option value="დისტრიბუციის ოპერატორი">{t('distribution_operator')}</option>
                            <option value="კორპორატიული გაყიდვების მენეჯერი">{t('corporate_sales_manager')}</option>
                            <option value="ადმინისტრატორი">{t('administrator')}</option>
                        </select>
                    </div>
                    <div className={styles.modalFormGroup}>
                        <label>{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={onChange}
                            className={styles.modalInput}
                            placeholder={t('new_password')}
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

export default EditUserModal;
