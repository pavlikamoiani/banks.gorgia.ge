import { useTranslation } from 'react-i18next';
import styles from '../assets/css/SortableTable.module.css';

const SortableTable = ({ columns, data, loading, emptyText, sortConfig, setSortConfig }) => {
    const { t } = useTranslation();

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    return (
        <table className={styles.sortableTable}>
            <thead>
                <tr>
                    {columns.map(col => (
                        <th
                            key={col.key}
                            onClick={() => (col.key !== 'actions' && col.key !== 'select') && handleSort(col.key)}
                            className={styles.sortableTh}
                        >
                            <span className={styles.thContent}>
                                <span>
                                    {col.label}
                                </span>
                                {(col.key !== 'actions' && col.key !== 'select') && (
                                    <span className={styles['sort-icons']}>
                                        <span
                                            className={`${styles['sort-arrow']} ${sortConfig?.key === col.key && sortConfig?.direction === 'asc' ? styles.active : ''}`}
                                        >
                                            ▲
                                        </span>
                                        <span
                                            className={`${styles['sort-arrow']} ${sortConfig?.key === col.key && sortConfig?.direction === 'desc' ? styles.active : ''}`}
                                        >
                                            ▼
                                        </span>
                                    </span>
                                )}
                            </span>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan={columns.length}>{t('loading')}</td>
                    </tr>
                ) : data.length > 0 ? (
                    data.map((row, idx) => (
                        <tr key={row.id || idx}>
                            {columns.map(col => (
                                <td key={col.key}>
                                    {col.render
                                        ? col.render(row[col.key], row)
                                        : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={columns.length}>{emptyText || 'Нет данных'}</td>
                    </tr>
                )}
            </tbody>
        </table >
    );
};

export default SortableTable;
