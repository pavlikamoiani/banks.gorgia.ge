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
    popupOpen,
    selectedTransaction,
    popupPos,
    closePopup,
    leftSearchContragent,
    leftSearchAmount,
    rightSearchContragent,
    rightSearchAmount,
    onSearch
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
                        columns={splitColumns}
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
                        columns={splitColumns}
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
            {popupOpen && selectedTransaction && (
                <div
                    style={{
                        position: 'fixed',
                        top: popupPos.y + 12,
                        left: popupPos.x + 12,
                        background: '#fff',
                        borderRadius: 10,
                        padding: '18px 20px',
                        boxShadow: '0 4px 24px rgba(1,115,177,0.18)',
                        zIndex: 9999,
                        minWidth: 260,
                        maxWidth: 340,
                        border: '1.5px solid #0173b1',
                        cursor: 'default'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <h4 style={{ marginBottom: 10, color: '#0173b1', textAlign: 'center' }}>
                        {t('details') || 'დეტალური ინფორმაცია'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div><b>{t('contragent') || 'Contragent'}:</b> {selectedTransaction.contragent}</div>
                        <div><b>{t('bank') || 'Bank'}:</b> {selectedTransaction.bank}</div>
                        <div><b>{t('amount') || 'Amount'}:</b> {selectedTransaction.amount}</div>
                        <div><b>{t('transferDate') || 'Transfer Date'}:</b> {selectedTransaction.transferDate}</div>
                        <div><b>{t('purpose') || 'Purpose'}:</b> {selectedTransaction.purpose}</div>
                        {selectedTransaction.syncDate && (
                            <div><b>{t('syncDate') || 'Sync Date'}:</b> {selectedTransaction.syncDate}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SplitStatementTable;
