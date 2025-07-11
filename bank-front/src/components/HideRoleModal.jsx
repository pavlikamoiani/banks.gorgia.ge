import { useEffect, useState } from 'react';
import styles from '../assets/css/modal.module.css';
import role from '../assets/css/HideRoleModal.module.css'; // используем role.*

const roleOptions = [
    { value: 'admin', label: 'ადმინისტრატორი' },
    { value: 'distribution_operator', label: 'დისტრიბუციის ოპერატორი' },
    { value: 'corporate_sales_manager', label: 'კორპორატიული გაყიდვების მენეჯერი' }
];

const ANIMATION_DURATION = 220;

const HideRoleModal = ({
    open,
    onClose,
    selectedContragents = [],
    onSubmit,
    t
}) => {
    const _t = typeof t === 'function' ? t : (s) => s;
    const [hideRoles, setHideRoles] = useState([]);
    const [show, setShow] = useState(open);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (open) {
            setShow(true);
            setClosing(false);
            const allHiddenRoles = selectedContragents.reduce((acc, c) => {
                if (Array.isArray(c.hidden_for_roles)) {
                    c.hidden_for_roles.forEach(role => {
                        if (!acc.includes(role)) acc.push(role);
                    });
                }
                return acc;
            }, []);
            setHideRoles(allHiddenRoles);
        } else if (show) {
            setClosing(true);
            const timer = setTimeout(() => {
                setShow(false);
                setClosing(false);
            }, ANIMATION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [open, selectedContragents, show]);

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setHideRoles(prev =>
            checked ? [...prev, value] : prev.filter(r => r !== value)
        );
    };

    const handleAllowRole = (roleValue) => {
        setHideRoles(prev => prev.filter(r => r !== roleValue));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (typeof onSubmit === 'function') {
            onSubmit(hideRoles);
        }
    };

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
                <h3 className={styles.modalTitle}>{_t('hide_for_roles') || 'დამალვა როლებისთვის'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalFormGroup}>
                        <label style={{ marginBottom: '15px' }}>{_t('select_roles_to_hide') || 'აირჩიეთ როლები, ვისთვისაც დამალავთ'}</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {roleOptions.map(opt => {
                                const checked = hideRoles.includes(opt.value);
                                return (
                                    <label
                                        key={opt.value}
                                        style={{
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <span className={role.checkboxWrapper}>
                                            <input
                                                type="checkbox"
                                                value={opt.value}
                                                checked={checked}
                                                onChange={handleCheckboxChange}
                                                className={`${role.checkbox} ${checked ? role.checkboxChecked : ''}`}
                                            />
                                            {checked && (
                                                <span className={role.checkmark}>
                                                    <svg width="14" height="14" viewBox="0 0 14 14">
                                                        <polyline
                                                            points="3,7 6,10 11,4"
                                                            style={{
                                                                fill: 'none',
                                                                stroke: '#0173b1',
                                                                strokeWidth: 2.5,
                                                                strokeLinecap: 'round',
                                                                strokeLinejoin: 'round'
                                                            }}
                                                        />
                                                    </svg>
                                                </span>
                                            )}
                                        </span>
                                        {opt.label}
                                        {checked && (
                                            <button
                                                type="button"
                                                className={role.allowViewBtn}
                                                onClick={() => handleAllowRole(opt.value)}
                                            >
                                                {_t('allow_view') || 'ნებართვა ნახვაზე'}
                                            </button>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={handleClose}
                            className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                        >
                            {_t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
                        >
                            {_t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default HideRoleModal;
