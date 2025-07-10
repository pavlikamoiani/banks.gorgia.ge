import { useEffect, useState } from 'react';
import styles from '../assets/css/modal.module.css';

const roleOptions = [
    { value: 'admin', label: 'ადმინისტრატორი' },
    { value: 'distribution_operator', label: 'დისტრიბუციის ოპერატორი' },
    { value: 'corporate_sales_manager', label: 'კორპორატიული გაყიდვების მენეჯერი' }
];

const checkboxStyle = {
    appearance: 'none',
    width: 20,
    height: 20,
    border: '2px solid #b0b8c1',
    borderRadius: 6,
    background: '#f8fafc',
    marginRight: 10,
    outline: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'border 0.18s, box-shadow 0.18s, background 0.18s'
};

const checkboxCheckedStyle = {
    border: '2px solid #0173b1',
    background: '#e6f2fa',
};

const checkmarkStyle = {
    position: 'absolute',
    left: 4,
    top: 2,
    width: 12,
    height: 12,
    pointerEvents: 'none',
    color: '#0173b1',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const HideRoleModal = ({
    open,
    onClose,
    selectedContragents = [],
    onSubmit,
    t
}) => {
    const _t = typeof t === 'function' ? t : (s) => s;
    const [hideRoles, setHideRoles] = useState([]);

    // При открытии модалки вычисляем объединение ролей
    useEffect(() => {
        if (open) {
            const allHiddenRoles = selectedContragents.reduce((acc, c) => {
                if (Array.isArray(c.hidden_for_roles)) {
                    c.hidden_for_roles.forEach(role => {
                        if (!acc.includes(role)) acc.push(role);
                    });
                }
                return acc;
            }, []);
            setHideRoles(allHiddenRoles);
        }
    }, [open, selectedContragents]);

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setHideRoles(prev =>
            checked ? [...prev, value] : prev.filter(r => r !== value)
        );
    };

    const handleAllowRole = (role) => {
        setHideRoles(prev => prev.filter(r => r !== role));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (typeof onSubmit === 'function') {
            onSubmit(hideRoles);
        }
    };

    if (!open) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button
                    type="button"
                    className={styles.modalClose}
                    onClick={onClose}
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
                                        <span style={{ position: 'relative', display: 'inline-block' }}>
                                            <input
                                                type="checkbox"
                                                value={opt.value}
                                                checked={checked}
                                                onChange={handleCheckboxChange}
                                                style={{
                                                    ...checkboxStyle,
                                                    ...(checked ? checkboxCheckedStyle : {})
                                                }}
                                            />
                                            {checked && (
                                                <span style={checkmarkStyle}>
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
                                                style={{
                                                    marginLeft: 8,
                                                    background: '#f3f6fa',
                                                    color: '#0173b1',
                                                    border: '1px solid #e6eaf0',
                                                    borderRadius: 4,
                                                    padding: '2px 8px',
                                                    fontSize: 13,
                                                    cursor: 'pointer'
                                                }}
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
                            onClick={onClose}
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
