import { useState } from 'react';
import styles from '../assets/css/SortableTable.module.css';
import { useTranslation } from 'react-i18next';

const SortableTable = ({ columns, data, loading, emptyText }) => {
    const { t } = useTranslation();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const sortedData = (() => {
        if (!sortConfig.key) return data;
        const sorted = [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue === undefined || bValue === undefined) return 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();
            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    })();

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
                            onClick={() => col.key !== 'actions' && handleSort(col.key)}
                            className={styles.sortableTh}
                        >
                            <span className={styles.thContent}>
                                <span>
                                    {col.label}
                                </span>
                                {col.key !== 'actions' && (
                                    <span className={styles['sort-icons']}>
                                        <span
                                            className={`${styles['sort-arrow']} ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? styles.active : ''}`}
                                        >
                                            ▲
                                        </span>
                                        <span
                                            className={`${styles['sort-arrow']} ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? styles.active : ''}`}
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
                ) : sortedData.length > 0 ? (
                    sortedData.map((row, idx) => (
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
        </table>
    );
};


export default SortableTable;
