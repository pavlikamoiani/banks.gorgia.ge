import { useState, useMemo } from 'react';
import SortableTable from './SortableTable';
import tableStatementStyles from '../assets/css/TableStatement.module.css';
import { FaSearch } from 'react-icons/fa'; // Add search icon

const SplitStatementTable = ({
    t,
    splitColumns,
    leftData,
    rightData,
    leftLoading,
    rightLoading,
    leftTableRef,
    rightTableRef,
    sortConfig,
    setSortConfig,
    leftSearchContragent,
    leftSearchAmount,
    rightSearchContragent,
    rightSearchAmount,
    onSearch,
    handleAmountClick
}) => {
    // Helper for styled input
    const renderSearchInput = (props) => (
        <div style={{
            position: 'relative',
            flex: props.flex ? 1 : undefined,
            width: props.width || undefined,
            minWidth: props.minWidth || undefined,
            display: 'flex',
            alignItems: 'center',
        }}>
            <input
                {...props}
                style={{
                    width: '100%',
                    padding: '8px 36px 8px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #0173b1',
                    fontSize: '1rem',
                    color: '#222',
                    outline: 'none',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    ...props.style,
                }}
                onFocus={e => e.target.style.borderColor = '#0173b1'}
                onBlur={e => e.target.style.borderColor = '#0173b1'}
            />
            <FaSearch
                style={{
                    position: 'absolute',
                    right: 12,
                    color: '#0173b1',
                    fontSize: '1em',
                    pointerEvents: 'none',
                    opacity: 0.7
                }}
            />
        </div>
    );

    const patchedSplitColumns = useMemo(() => {
        return splitColumns.map(col => {
            if (col.key === 'amount') {
                return {
                    ...col,
                    render: (value, row) => {
                        const isExchange = (row.purpose || row.description || '').includes('გაცვლითი ოპერაცია');
                        let cellContent;
                        if (row._isLeft) {
                            if (isExchange) {
                                cellContent = (
                                    <span style={{ color: '#0173b1', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {value}
                                    </span>
                                );
                            } else {
                                cellContent = (
                                    <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                                        - {value}
                                    </span>
                                );
                            }
                        } else {
                            cellContent = value;
                        }
                        return (
                            <span
                                style={{ cursor: 'pointer' }}
                                onClick={e => handleAmountClick(row, e)}
                                title="დეტალური ინფორმაცია"
                            >
                                {cellContent}
                            </span>
                        );
                    }
                };
            }
            return col;
        });
    }, [splitColumns, handleAmountClick]);

    return (
        <div className={tableStatementStyles.splitTableContainer}>
            <div className={tableStatementStyles.splitTableSection}>
                <div className={tableStatementStyles.splitTableHeader}>
                    {t('incoming') || 'ჩარიცხვები'}
                </div>
                <div
                    className={tableStatementStyles.splitTableSearchWrapper}
                    style={{
                        marginBottom: 12,
                        display: 'flex',
                        gap: 12,
                        borderRadius: 10,
                        padding: '10px 0px',
                        boxShadow: '0 1px 4px rgba(1,115,177,0.04)'
                    }}
                >
                    {renderSearchInput({
                        type: "text",
                        placeholder: t('search_by_contragent') || 'Contragent',
                        value: rightSearchContragent,
                        onChange: e => onSearch('right', { contragent: e.target.value, amount: rightSearchAmount }),
                        flex: 1,
                        minWidth: 0
                    })}
                    {renderSearchInput({
                        type: "text",
                        placeholder: t('search_by_amount') || 'Amount',
                        value: rightSearchAmount,
                        onChange: e => onSearch('right', { contragent: rightSearchContragent, amount: e.target.value }),
                        width: 180
                    })}
                </div>
                <div
                    className={tableStatementStyles.splitTableTableWrapper}
                    ref={rightTableRef}
                    style={{ position: 'relative' }}
                >
                    <SortableTable
                        columns={patchedSplitColumns}
                        data={rightData.map(row => ({ ...row, _isLeft: false }))}
                        loading={rightLoading}
                        emptyText={t('no_statement_found') || "ამონაწერი არ მოიძებნა"}
                        sortConfig={sortConfig}
                        setSortConfig={setSortConfig}
                    />
                    {rightLoading && (
                        <div className={tableStatementStyles.infiniteLoader}>
                            <span className={tableStatementStyles.spinnerIcon}></span>
                        </div>
                    )}
                </div>
            </div>
            <div className={tableStatementStyles.splitTableSection}>
                <div className={tableStatementStyles.splitTableHeader}>
                    {t('outgoing') || 'გადარიცხვები'}
                </div>
                <div
                    className={tableStatementStyles.splitTableSearchWrapper}
                    style={{
                        marginBottom: 12,
                        display: 'flex',
                        gap: 12,
                        borderRadius: 10,
                        padding: '10px 0px',
                        boxShadow: '0 1px 4px rgba(1,115,177,0.04)'
                    }}
                >
                    {renderSearchInput({
                        type: "text",
                        placeholder: t('search_by_contragent') || 'Contragent',
                        value: leftSearchContragent,
                        onChange: e => onSearch('left', { contragent: e.target.value, amount: leftSearchAmount }),
                        flex: 1,
                        minWidth: 0
                    })}
                    {renderSearchInput({
                        type: "text",
                        placeholder: t('search_by_amount') || 'Amount',
                        value: leftSearchAmount,
                        onChange: e => onSearch('left', { contragent: leftSearchContragent, amount: e.target.value }),
                        width: 180
                    })}
                </div>
                <div
                    className={tableStatementStyles.splitTableTableWrapper}
                    ref={leftTableRef}
                    style={{ position: 'relative' }}
                >
                    <SortableTable
                        columns={patchedSplitColumns}
                        data={leftData.map(row => ({ ...row, _isLeft: true }))}
                        loading={leftLoading}
                        emptyText={t('no_statement_found') || "ამონაწერი არ მოიძებნა"}
                        sortConfig={sortConfig}
                        setSortConfig={setSortConfig}
                    />
                    {leftLoading && (
                        <div className={tableStatementStyles.infiniteLoader}>
                            <span className={tableStatementStyles.spinnerIcon}></span>
                        </div>
                    )}
                </div>
            </div>
            {/* Remove modal rendering here, it's handled by TableStatement */}
        </div>
    );
};

export default SplitStatementTable;
