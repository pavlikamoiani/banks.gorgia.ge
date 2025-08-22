import { useTranslation } from 'react-i18next';
import styles from '../assets/css/SortableTable.module.css';

const SortableTable = ({
    columns,
    data,
    loading,
    emptyText,
    sortConfig,
    setSortConfig,
    onSortChange,
    onRowClick // <-- add this prop
}) => {
    const { t } = useTranslation();

    const handleSort = (key) => {
        // Only trigger sort if not actions/select
        if (key === 'actions' || key === 'select') return;
        const newSortConfig = sortConfig?.key === key
            ? { key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }
            : { key, direction: 'asc' };
        setSortConfig && setSortConfig(newSortConfig);
        onSortChange && onSortChange(newSortConfig); // <-- trigger parent to reload data from backend
    };

    return (
        <table className={styles.sortableTable}>
            <thead>
                <tr>
                    {columns.map(col => (
                        <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
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
                        <tr
                            key={row.id || idx}
                            onClick={e => onRowClick && onRowClick(row, e)}
                            style={{ cursor: onRowClick ? 'pointer' : undefined }}
                        >
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