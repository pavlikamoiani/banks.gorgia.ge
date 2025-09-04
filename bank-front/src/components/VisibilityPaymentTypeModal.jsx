import { useEffect, useState } from 'react';
import styles from '../assets/css/modal.module.css';
import roleStyles from '../assets/css/HideRoleModal.module.css';

const roleOptions = [
    { value: 'admin', label: 'ადმინისტრატორი' },
    { value: 'distribution_operator', label: 'დისტრიბუციის ოპერატორი' },
    { value: 'corporate_sales_manager', label: 'კორპორატიული გაყიდვების მენეჯერი' }
];

const paymentTypeOptions = [
    { value: 'terminal', label: 'ტერმინალით გადახდა' },
    { value: 'enrollments', label: 'ჩარიცხვები' },
    { value: 'transfers', label: 'გადარიცხვები' }
];

const ANIMATION_DURATION = 220;

const VisibilityPaymentTypeModal = ({
    open,
    onClose,
    selectedPaymentTypes = {},
    onSubmit,
    t
}) => {
    const _t = typeof t === 'function' ? t : (s) => s;
    const [rolePaymentTypes, setRolePaymentTypes] = useState({});
    const [selectedRole, setSelectedRole] = useState('');
    const [show, setShow] = useState(open);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        setRolePaymentTypes(selectedPaymentTypes || {});
        setSelectedRole('');
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
    }, [open, selectedPaymentTypes, show]);

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setRolePaymentTypes(prev => {
            const prevTypes = prev[selectedRole] || [];
            const newTypes = checked
                ? [...prevTypes, value]
                : prevTypes.filter(pt => pt !== value);
            return { ...prev, [selectedRole]: newTypes };
        });
    };

    const handleAllowType = (typeValue) => {
        setRolePaymentTypes(prev => {
            const prevTypes = prev[selectedRole] || [];
            const newTypes = prevTypes.filter(pt => pt !== typeValue);
            return { ...prev, [selectedRole]: newTypes };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (typeof onSubmit === 'function') {
            onSubmit(rolePaymentTypes);
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
                <h3 className={styles.modalTitle}>{_t('manage_payment_type_visibility') || 'გადახდის ტიპების მართვა'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalFormGroup}>
                        <label style={{ marginBottom: '15px' }}>
                            {_t('select_role_first') || 'აირჩიეთ როლი'}
                        </label>
                        <select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            style={{
                                marginBottom: '18px',
                                padding: '7px 12px',
                                borderRadius: 6,
                                border: '1px solid #d0d0d0',
                                fontSize: '1rem',
                                fontWeight: 500,
                                outline: 'none'
                            }}
                        >
                            <option value="">{_t('select_role') || 'აირჩიეთ როლი'}</option>
                            {roleOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {selectedRole && (
                            <>
                                <label style={{ marginBottom: '15px' }}>
                                    {_t('select_payment_types_to_show') || 'აირჩიეთ გადახდის ტიპები, რომლებიც გამოჩნდება'}
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {paymentTypeOptions.map(opt => {
                                        const checked = (rolePaymentTypes[selectedRole] || []).includes(opt.value);
                                        return (
                                            <label
                                                key={opt.value}
                                                style={{
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0,
                                                    cursor: 'pointer',
                                                    userSelect: 'none',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                <span className={roleStyles.checkboxWrapper}>
                                                    <input
                                                        type="checkbox"
                                                        value={opt.value}
                                                        checked={checked}
                                                        onChange={handleCheckboxChange}
                                                        className={`${roleStyles.checkbox} ${checked ? roleStyles.checkboxChecked : ''}`}
                                                    />
                                                    {checked && (
                                                        <span className={roleStyles.checkmark}>
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
                                                        className={roleStyles.allowViewBtn}
                                                        onClick={() => handleAllowType(opt.value)}
                                                    >
                                                        {_t('remove_view') || 'მოხსნა ნახვაზე'}
                                                    </button>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </>
                        )}
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
                            disabled={!selectedRole}
                        >
                            {_t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default VisibilityPaymentTypeModal;
