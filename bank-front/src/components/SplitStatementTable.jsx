import { useState, useMemo, useRef, useEffect } from 'react';
import SortableTable from './SortableTable';
import tableStatementStyles from '../assets/css/TableStatement.module.css';
import { FaSearch } from 'react-icons/fa';
import { IoMdSync } from "react-icons/io";

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
                                    <span style={{ color: '#0173b1', display: 'flex', alignItems: 'center', gap: 5, fontWeight: "bold" }}>
                                        <IoMdSync fontSize={20} /> {value}
                                    </span>
                                );
                            } else {
                                cellContent = (
                                    <span style={{ color: 'red', display: 'flex', alignItems: 'center', fontWeight: "bold" }}>
                                        - {value}
                                    </span>
                                );
                            }
                        } else if (row._isLeft === false) {
                            if (isExchange) {
                                cellContent = (
                                    <span style={{ color: '#0173b1', display: 'flex', alignItems: 'center', gap: 5, fontWeight: "bold" }}>
                                        {value}
                                    </span>
                                );
                            } else {
                                cellContent = (
                                    <span style={{ color: 'green', display: 'flex', alignItems: 'center', fontWeight: "bold" }}>
                                        + {value}
                                    </span>
                                );
                            }
                        } else {
                            cellContent = value;
                        }
                        return (
                            <span style={{ fontWeight: "bold", color: 'green' }}>
                                {cellContent}
                            </span>
                        );
                    }
                };
            }
            return col;
        });
    }, [splitColumns]);

    const [localLeftContragent, setLocalLeftContragent] = useState(leftSearchContragent);
    const [localLeftAmount, setLocalLeftAmount] = useState(leftSearchAmount);
    const [localRightContragent, setLocalRightContragent] = useState(rightSearchContragent);
    const [localRightAmount, setLocalRightAmount] = useState(rightSearchAmount);

    const leftDebounceRef = useRef(null);
    const rightDebounceRef = useRef(null);

    useEffect(() => {
        if (leftDebounceRef.current) clearTimeout(leftDebounceRef.current);
        leftDebounceRef.current = setTimeout(() => {
            onSearch('left', { contragent: localLeftContragent, amount: localLeftAmount });
        }, 3000);
        return () => {
            if (leftDebounceRef.current) clearTimeout(leftDebounceRef.current);
        };
    }, [localLeftContragent, localLeftAmount]);

    useEffect(() => {
        if (rightDebounceRef.current) clearTimeout(rightDebounceRef.current);
        rightDebounceRef.current = setTimeout(() => {
            onSearch('right', { contragent: localRightContragent, amount: localRightAmount });
        }, 3000);
        return () => {
            if (rightDebounceRef.current) clearTimeout(rightDebounceRef.current);
        };
    }, [localRightContragent, localRightAmount]);

    useEffect(() => {
        setLocalLeftContragent(leftSearchContragent);
    }, [leftSearchContragent]);
    useEffect(() => {
        setLocalLeftAmount(leftSearchAmount);
    }, [leftSearchAmount]);
    useEffect(() => {
        setLocalRightContragent(rightSearchContragent);
    }, [rightSearchContragent]);
    useEffect(() => {
        setLocalRightAmount(rightSearchAmount);
    }, [rightSearchAmount]);

    const handleLeftSearchEnter = (e) => {
        if (e.key === 'Enter') {
            onSearch('left', { contragent: localLeftContragent, amount: localLeftAmount });
        }
    };

    const handleRightSearchEnter = (e) => {
        if (e.key === 'Enter') {
            onSearch('right', { contragent: localRightContragent, amount: localRightAmount });
        }
    };

    const handleRowClick = (row, e) => {
        e.stopPropagation();
        handleAmountClick(row, e);
    };

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
                        value: localRightContragent,
                        onChange: e => setLocalRightContragent(e.target.value),
                        onKeyDown: handleRightSearchEnter,
                        flex: 1,
                        minWidth: 0
                    })}
                    {renderSearchInput({
                        type: "text",
                        placeholder: t('search_by_amount') || 'Amount',
                        value: localRightAmount,
                        onChange: e => setLocalRightAmount(e.target.value),
                        onKeyDown: handleRightSearchEnter,
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
                        onRowClick={handleRowClick}
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
                        value: localLeftContragent,
                        onChange: e => setLocalLeftContragent(e.target.value),
                        onKeyDown: handleLeftSearchEnter,
                        flex: 1,
                        minWidth: 0
                    })}
                    {renderSearchInput({
                        type: "text",
                        placeholder: t('search_by_amount') || 'Amount',
                        value: localLeftAmount,
                        onChange: e => setLocalLeftAmount(e.target.value),
                        onKeyDown: handleLeftSearchEnter,
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
                        onRowClick={handleRowClick}
                    />
                    {leftLoading && (
                        <div className={tableStatementStyles.infiniteLoader}>
                            <span className={tableStatementStyles.spinnerIcon}></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SplitStatementTable;
