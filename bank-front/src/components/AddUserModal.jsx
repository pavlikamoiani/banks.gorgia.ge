import styles from '../assets/css/modal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';

const UserModal = ({
    open,
    onClose,
    onSubmit,
    form,
    onChange,
    error,
    t
}) => {

    const user = useSelector(state => state.user.user);
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
                <h3 className={styles.modalTitle}>{t('add_user')}</h3>
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
                        <label>{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
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
                            <option value="distribution_operator">{t('distribution_operator')}</option>
                            <option value="corporate_sales_manager">{t('corporate_sales_manager')}</option>
                            {user && user.role === 'super_admin' && (
                                <option value="admin">{t('administrator')}</option>
                            )}
                        </select>
                    </div>
                    <div className={styles.modalFormGroup}>
                        <label>{t('bank')}</label>
                        <select
                            name="bank"
                            value={form.bank}
                            onChange={onChange}
                            className={styles.modalInput}
                            required
                        >
                            <option value="">{t('select_bank')}</option>
                            {((user && user.bank === 'gorgia' && user.role === 'admin') || (user && user.role === 'super_admin')) && (
                                <option value="gorgia">gorgia</option>
                            )}
                            {((user && user.bank === 'anta' && user.role === 'admin') || (user && user.role === 'super_admin')) && (
                                <option value="anta">anta</option>
                            )}
                        </select>
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
                            <FontAwesomeIcon icon={faUserPlus} color='#fff' fontSize={'18px'} style={{ marginRight: 6 }} />
                            {t('add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
