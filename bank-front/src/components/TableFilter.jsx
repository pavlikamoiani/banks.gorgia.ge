import styles from '../assets/css/filter.module.css';
import { useTranslation } from 'react-i18next';


const TableFilter = ({
    filters,
    onChange,
    onReset,
    fields = []
}) => {

    const { t } = useTranslation();

    return (
        <div className={styles.filterContainer}>
            <form
                className={styles.filterForm}
                onSubmit={e => { e.preventDefault(); }}
                autoComplete="off"
            >
                <div className={styles.filterFieldsRow}>
                    {fields.map(field => (
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
                    ))}
                </div>
                <div className={styles.filterActions}>
                    <button
                        type="button"
                        className={styles.filterButton}
                        onClick={onReset}
                    >
                        {t('reset')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TableFilter;