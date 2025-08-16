import styles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const TableFilter = ({
    filters,
    onChange,
    onReset,
    fields = [],
    bankOptions = [],
    bankDropdownOpen,
    setBankDropdownOpen,
    bankDropdownRef,
    onBankSelect,
    onRoleSelect,
    t,
    onApply,
    installmentOnly,
    transfersOnly,
    onInstallmentToggle,
    onTransfersToggle,
    showStatementButtons // <-- add this prop
}) => {
    const { t: tHook } = useTranslation();
    const translate = t || tHook;

    const renderField = (field) => {
        if (field.type === 'bankDropdown' && bankOptions.length) {
            return (
                <div
                    className={styles.filterField}
                    ref={bankDropdownRef}
                    style={{ position: 'relative' }}
                    key="bank"
                >
                    <label className={styles.filterLabel}>{translate('bank')}</label>
                    <div
                        className={styles.filterInput}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                        onClick={() => setBankDropdownOpen(open => !open)}
                        tabIndex={0}
                    >
                        <span style={{ flex: 1, color: filters.bank ? '#222' : '#aaa' }}>
                            {filters.bank || (translate('search_by_bank') || 'ბანკი...')}
                        </span>
                        <FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 8 }} />
                    </div>
                    {bankDropdownOpen && (
                        <ul
                            className={styles.filterDropdown}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                background: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                maxHeight: 180,
                                overflowY: 'auto',
                                margin: 0,
                                padding: 0,
                                listStyle: 'none'
                            }}
                        >
                            <li
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    color: '#888'
                                }}
                                onClick={() => onBankSelect('')}
                            >
                                {translate('all')}
                            </li>
                            {bankOptions.map(bank => (
                                <li
                                    key={bank}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: filters.bank === bank ? '#f0f8ff' : '#fff'
                                    }}
                                    onClick={() => onBankSelect(bank)}
                                >
                                    {bank}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        }
        if (field.type === 'select' && field.options) {
            return (
                <div className={styles.filterField} key={field.name}>
                    <label className={styles.filterLabel}>{field.label}</label>
                    <select
                        className={styles.filterInput}
                        name={field.name}
                        value={filters[field.name] || ''}
                        onChange={e => {
                            onChange(e);
                            if (field.name === 'role' && typeof onRoleSelect === 'function') {
                                onRoleSelect(e.target.value);
                            }
                        }}
                    >
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }
        return (
            <div className={styles.filterField} key={field.name}>
                <label className={styles.filterLabel}>{field.label}</label>
                <input
                    className={styles.filterInput}
                    type={field.type || 'text'}
                    name={field.name}
                    value={filters[field.name] || ''}
                    onChange={onChange}
                    placeholder={field.placeholder || ''}
                />
            </div>
        );
    };

    const defaultFields = [
        { name: 'contragent', label: translate('contragent'), placeholder: translate('search_by_contragent') || 'კონტრაგენტი...' },
        { name: 'bank', label: translate('bank'), placeholder: translate('search_by_bank') || 'ბანკი...' },
        { name: 'amount', label: translate('amount'), placeholder: translate('search_by_amount') || 'თანხა...' },
        { name: 'transferDate', label: translate('transferDate'), placeholder: translate('search_by_transferDate') || 'თარიღი...' },
        { name: 'purpose', label: translate('purpose'), placeholder: translate('search_by_purpose') || 'დანიშნულება...' }
    ];

    const usedFields = fields.length ? fields : defaultFields;

    return (
        <div className={styles.filterContainer}>
            <form
                className={styles.filterForm}
                onSubmit={e => { e.preventDefault(); }}
                autoComplete="off"
            >
                <div className={styles.filterFieldsRow}>
                    {usedFields.map(renderField)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className={styles.filterActions} style={{ display: 'flex' }}>
                        <button
                            type="button"
                            className={styles.filterButton}
                            onClick={onApply}
                        >
                            {translate('apply') || 'Apply'}
                        </button>
                        <button
                            type="button"
                            className={styles.filterButton}
                            onClick={onReset}
                        >
                            {translate('reset')}
                        </button>
                    </div>
                    {showStatementButtons && (
                        <div style={{ display: 'flex', gap: 10, }}>
                            <div
                                className={tableStatementStyles.installmentBtnWrapper}
                                tabIndex={0}
                                role="button"
                                aria-pressed={installmentOnly}
                                onClick={onInstallmentToggle}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onInstallmentToggle(); }}
                                style={{ outline: 'none' }}
                            >
                                <span
                                    className={
                                        installmentOnly
                                            ? tableStatementStyles.installmentBtnActive
                                            : tableStatementStyles.installmentBtn
                                    }
                                >
                                    {installmentOnly ? (
                                        <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
                                            <rect x="2" y="2" width="14" height="14" rx="5" fill="#fff" stroke="#0173b1" strokeWidth="2" />
                                            <path d="M6 10l2 2 4-4" stroke="#0173b1" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
                                            <rect x="2" y="2" width="14" height="14" rx="5" fill="#fff" stroke="#0173b1" strokeWidth="2" />
                                        </svg>
                                    )}
                                    {translate('installment') || 'განვადება'}
                                </span>
                                <span className={tableStatementStyles.installmentTooltip}>
                                    {translate('installment_tooltip') || 'განვადებები/განაწილება(თბს) ჩვენება/დამალვა'}
                                </span>
                            </div>
                            <div
                                className={tableStatementStyles.installmentBtnWrapper}
                                tabIndex={0}
                                role="button"
                                aria-pressed={transfersOnly}
                                onClick={onTransfersToggle}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onTransfersToggle(); }}
                                style={{ outline: 'none' }}
                            >
                                <span
                                    className={
                                        transfersOnly
                                            ? tableStatementStyles.installmentBtnActive
                                            : tableStatementStyles.installmentBtn
                                    }
                                >
                                    {transfersOnly ? (
                                        <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
                                            <rect x="2" y="2" width="14" height="14" rx="5" fill="#fff" stroke="#0173b1" strokeWidth="2" />
                                            <path d="M6 10l2 2 4-4" stroke="#0173b1" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
                                            <rect x="2" y="2" width="14" height="14" rx="5" fill="#fff" stroke="#0173b1" strokeWidth="2" />
                                        </svg>
                                    )}
                                    {translate('transfers') || 'გადარიცხვები'}
                                </span>
                                <span className={tableStatementStyles.installmentTooltip}>
                                    {translate('transfers_tooltip') || 'გადარიცხვების ჩვენება/დამალვა'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default TableFilter;