import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import defaultInstance from '../api/defaultInstance';
import Pagination from './Pagination';
import TableFilter from './TableFilter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faBolt, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';

const MAX_PURPOSE_LENGTH = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const BANK_TYPE_MAP = {
	1: 'სს "თბს ბანკი"',
	2: 'სს "საქართველოს ბანკი"'
};

const INTERLEAVE_CHUNK_SIZE = 3;

function interleaveByBank(rows, chunkSize = INTERLEAVE_CHUNK_SIZE) {
	const tbcRows = rows.filter(r => r.bank === 'სს "თბს ბანკი"');
	const bogRows = rows.filter(r => r.bank === 'სს "საქართველოს ბანკი"');
	const result = [];
	let tbcIdx = 0, bogIdx = 0;
	while (tbcIdx < tbcRows.length || bogIdx < bogRows.length) {
		for (let i = 0; i < chunkSize && tbcIdx < tbcRows.length; i++, tbcIdx++) {
			result.push(tbcRows[tbcIdx]);
		}
		for (let i = 0; i < chunkSize && bogIdx < bogRows.length; i++, bogIdx++) {
			result.push(bogRows[bogIdx]);
		}
	}
	return result;
}

const TableStatement = () => {
	const { t } = useTranslation();
	const location = useLocation();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);
	const [expandedRows, setExpandedRows] = useState({});

	const [filters, setFilters] = useState({
		contragent: '',
		bank: '',
		amount: '',
		transferDate: '',
		purpose: '',
		startDate: '',
		endDate: ''
	});
	const [pendingFilters, setPendingFilters] = useState({
		contragent: '',
		bank: '',
		amount: '',
		transferDate: '',
		purpose: '',
		startDate: '',
		endDate: ''
	});
	const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
	const bankDropdownRef = useRef(null);
	const [dbLoading, setDbLoading] = useState(false);

	const [liveMode, setLiveMode] = useState(false);
	const [liveBankDropdownOpen, setLiveBankDropdownOpen] = useState(false);
	const [selectedLiveBank, setSelectedLiveBank] = useState(null);
	const liveBankDropdownRef = useRef(null);

	const [dbData, setDbData] = useState([]);
	const bankOptions = useMemo(() => {
		const setBanks = new Set();
		(data || []).forEach(row => {
			if (row.bank) {
				setBanks.add(row.bank);
			}
		});
		return Array.from(setBanks);
	}, [data]);

	const currentBank = useMemo(() => {
		if (location.pathname.startsWith('/anta')) return 'anta';
		return 'gorgia';
	}, [location.pathname]);

	const columns = useMemo(() => {
		const baseColumns = [
			{
				key: 'contragent', label: t('contragent'),
				render: (value) => {
					if (value === 'ტერმინალით გადახდა') {
						return <span style={{ color: '#0173b1' }}>{value}</span>;
					}
					return value;
				}
			},
			{
				key: 'bank',
				label: t('bank'),
				render: (value, row) => {
					if (row.bank) return row.bank;
					if (row.bank_id === 1) return 'Gorgia';
					if (row.bank_id === 2) return 'Anta';
					return '-';
				}
			},
			{ key: 'amount', label: t('amount') },
			{ key: 'transferDate', label: t('transferDate') },
			{
				key: 'purpose',
				label: t('purpose'),
				render: (value, row) => {
					if (!value) return '';
					const isExpanded = expandedRows[row.id];
					if (value.length <= MAX_PURPOSE_LENGTH) return value;
					return (
						<span style={{ display: 'inline-block', maxWidth: 350, verticalAlign: 'middle', wordBreak: 'break-word' }}>
							{isExpanded ? (
								<>
									<span>{value}</span>
									<button className={tableStatementStyles.showLessBtn}
										onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: false }))}
									>
										{t('show_less')}
									</button>
								</>
							) : (
								<>
									<span>{value.slice(0, MAX_PURPOSE_LENGTH)}...</span>
									<button className={tableStatementStyles.showoreBtn}
										onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: true }))}
									>
										{t('show_more')}
									</button>
								</>
							)}
						</span>
					);
				}
			}
		];
		if (!liveMode) {
			baseColumns.push({ key: 'syncDate', label: t('syncDate') });
		}
		return baseColumns;
		// eslint-disable-next-line
	}, [t, expandedRows, liveMode]);

	const [filterOpen, setFilterOpen] = useState(false);
	const [installmentOnly, setInstallmentOnly] = useState(false);
	const [transfersOnly, setTransfersOnly] = useState(false);

	const getEndpoint = () => {
		if (currentBank === 'anta') return '/anta-transactions';
		return '/gorgia-transactions';
	};

	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		pageSize: PAGE_SIZE_OPTIONS[0],
		totalPages: 0
	});
	const [livePagination, setLivePagination] = useState({
		total: 0,
		page: 1,
		pageSize: PAGE_SIZE_OPTIONS[0],
		totalPages: 0
	});

	const sortByBank = (rows) => {
		return [...rows].sort((a, b) => {
			const bankOrder = { 'სს "თბს ბანკი"': 0, 'სს "საქართველოს ბანკი"': 1 };
			return (bankOrder[a.bank] ?? 2) - (bankOrder[b.bank] ?? 2);
		});
	};

	const loadDbData = async (filterParams = {}) => {
		setDbLoading(true);
		setError(null);

		try {
			const params = {
				...filterParams,
				bank: currentBank === 'anta' ? 'anta' : 'gorgia',
				page: filterParams.page || page,
				pageSize: filterParams.pageSize || pageSize
			};
			const endpoint = getEndpoint();
			const response = await defaultInstance.get(endpoint, { params });

			const responseDataArray = Array.isArray(response.data?.data) ? response.data.data : [];

			if (response.data && response.data.pagination) {
				const formattedData = responseDataArray.map((item, idx) => ({
					id: `${item.bank_id === 1 ? 'tbc' : 'bog'}-${item.id || idx + 1}`,
					contragent: item.sender_name || 'ტერმინალით გადახდა',
					bank: BANK_TYPE_MAP[item.bank_type] || BANK_TYPE_MAP[item.bank_id] || '-',
					amount: (item.amount ?? 0) + ' ₾',
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.description || '-',
					syncDate: item.created_at
						? item.created_at.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
						: '-'
				}));
				const interleavedData = interleaveByBank(formattedData);
				setData(interleavedData);
				setDbData(interleavedData);
				setPagination(response.data.pagination);
				setPage(response.data.pagination.page);
			} else {
				let combinedRows = [];
				if (Array.isArray(response.data)) {
					combinedRows = response.data.map((item, idx) => ({
						id: `${item.bank_id === 1 ? 'tbc' : 'bog'}-${item.id || idx + 1}`,
						contragent: item.sender_name || 'ტერმინალით გადახდა',
						bank: BANK_TYPE_MAP[item.bank_type] || BANK_TYPE_MAP[item.bank_id] || '-',
						amount: (item.amount ?? 0) + ' ₾',
						transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
						purpose: item.description || '-',
						syncDate: item.created_at
							? item.created_at.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
							: '-'
					}));
				}
				const interleavedRows = interleaveByBank(combinedRows);
				setData(interleavedRows);
				setDbData(interleavedRows);
			}
		} catch (err) {
			console.error("Error loading DB transactions:", err);
		} finally {
			setDbLoading(false);
		}
	};

	useEffect(() => {
		if (!liveMode) {
			loadDbData(filters);
		}
		// eslint-disable-next-line
	}, [filters, currentBank, liveMode]);

	const handleFilterChange = (e) => {
		setPendingFilters({ ...pendingFilters, [e.target.name]: e.target.value });
	};

	const loadLiveData = async (bankType, page = 1, pageSize = PAGE_SIZE_OPTIONS[0]) => {
		if (!bankType) return;

		setLoading(true);
		setError(null);
		try {
			const params = {
				...filters,
				bank: currentBank,
				bankType: bankType,
				page,
				pageSize
			};
			let endpoint;
			if (bankType === 'BOG') {
				endpoint = '/bog/todayactivities';
			} else if (bankType === 'TBC') {
				endpoint = '/tbc/todayactivities';
			}
			const resp = await defaultInstance.get(endpoint, { params });
			const rows = (resp.data?.data || []).map((item, idx) => ({
				id: item.Id || item.DocKey || idx + 1,
				contragent: item?.Sender?.Name || 'ტერმინალით გადახდა',
				bank: item?.Sender?.BankName || 'სს "საქართველოს ბანკი"',
				bank_id: currentBank === 'anta' ? 2 : 1,
				amount: (item.Amount ?? 0) + ' ₾',
				transferDate: item.PostDate ? item.PostDate.slice(0, 10) : '-',
				purpose: item.EntryComment || item.EntryCommentEn || '-',
				syncDate: item.syncDate || '-',
			}));
			const interleavedRows = interleaveByBank(rows);
			setData(interleavedRows);
			setDbData(interleavedRows);
			setLivePagination({
				total: rows.length,
				page,
				pageSize,
				totalPages: Math.ceil(rows.length / pageSize)
			});
			setPage(page);
		} catch (error) {
			console.error("Error loading live data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectLiveBank = (bankType) => {
		setSelectedLiveBank(bankType);
		setLiveMode(true);
		setLiveBankDropdownOpen(false);
		setPage(1);
		setLivePagination(prev => ({
			...prev,
			page: 1
		}));
		loadLiveData(bankType, 1, livePagination.pageSize);
	};

	const handleApplyFilters = () => {
		if (liveMode && selectedLiveBank) {
			const { startDate, endDate, ...rest } = pendingFilters;
			setFilters(rest);
			setPendingFilters(rest);
			setPage(1);
			setLivePagination(prev => ({
				...prev,
				page: 1
			}));
			loadLiveData(selectedLiveBank, 1, livePagination.pageSize);
		} else {
			setFilters({ ...pendingFilters });
			setPage(1);
			loadDbData({ ...pendingFilters });
		}
	};

	const handleFilterReset = () => {
		const resetFilters = {
			contragent: '',
			bank: '',
			amount: '',
			transferDate: '',
			purpose: '',
			startDate: '',
			endDate: ''
		};
		if (liveMode && selectedLiveBank) {
			const { startDate, endDate, ...rest } = resetFilters;
			setFilters(rest);
			setPendingFilters(rest);
			setPage(1);
			setLivePagination(prev => ({
				...prev,
				page: 1
			}));
			loadLiveData(selectedLiveBank, 1, livePagination.pageSize);
		} else {
			setFilters(resetFilters);
			setPendingFilters(resetFilters);
			setPage(1);
		}
	};

	const handleExitLiveMode = () => {
		setLiveMode(false);
		setSelectedLiveBank(null);
		setPage(1);
		setLivePagination({
			total: 0,
			page: 1,
			pageSize: PAGE_SIZE_OPTIONS[0],
			totalPages: 0
		});
		loadDbData(filters);
	};

	const handleBankSelect = (bank) => {
		setPendingFilters(f => ({ ...f, bank }));
		setBankDropdownOpen(false);
	};

	useEffect(() => {
		if (!liveBankDropdownOpen) return;
		const handler = (e) => {
			if (liveBankDropdownRef.current && !liveBankDropdownRef.current.contains(e.target)) {
				setLiveBankDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [liveBankDropdownOpen]);

	useEffect(() => {
		if (!bankDropdownOpen) return;
		const handler = (e) => {
			if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target)) {
				setBankDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [bankDropdownOpen]);

	const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

	const sortedData = useMemo(() => {
		let base = dbData;
		if (liveMode) base = data;
		if (!sortConfig.key) return base;
		const sorted = [...base].sort((a, b) => {
			let aValue = a[sortConfig.key];
			let bValue = b[sortConfig.key];

			if (sortConfig.key === 'amount') {
				const parseAmount = val => {
					if (typeof val === 'number') return val;
					if (typeof val === 'string') {
						const num = parseFloat(val.replace(/[^\d.-]/g, ''));
						return isNaN(num) ? 0 : num;
					}
					return 0;
				};
				aValue = parseAmount(aValue);
				bValue = parseAmount(bValue);
				if (sortConfig.direction === 'asc') {
					return bValue - aValue;
				} else {
					return aValue - bValue;
				}
			}

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
	}, [dbData, data, liveMode, sortConfig]);

	const filteredData = useMemo(() => {
		let base = sortedData;
		if (installmentOnly) {
			base = base.filter(row =>
				(row.purpose || row.description || '').toLowerCase().includes('განვსაქონლის') || (row.purpose || row.description || '').toLowerCase().includes('განაწილება')
			);
		}
		if (transfersOnly) {
			base = base.filter(row => (row.contragent || row.contragent || '').toLowerCase().includes('შპს გორგია'));
		}
		return base;
	}, [sortedData, installmentOnly, transfersOnly]);

	const pagedData = useMemo(() => {
		if (liveMode) {
			const startIdx = (livePagination.page - 1) * livePagination.pageSize;
			const endIdx = startIdx + livePagination.pageSize;
			return Array.isArray(filteredData) ? filteredData.slice(startIdx, endIdx) : [];
		}
		if (pagination.total > 0) {
			return Array.isArray(data) ? data : [];
		}
		return Array.isArray(filteredData) ? filteredData.slice((page - 1) * pageSize, page * pageSize) : [];
	}, [liveMode, filteredData, livePagination, pagination, data, page, pageSize]);

	useEffect(() => {
		if (!pageSizeDropdownOpen) return;
		const handler = (e) => {
			if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(e.target)) {
				setPageSizeDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [pageSizeDropdownOpen]);

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<h2 className="table-heading">
					{t('statement')}
				</h2>
				<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
					<div
						className={tableStatementStyles.installmentBtnWrapper}
						tabIndex={0}
						role="button"
						aria-pressed={installmentOnly}
						onClick={() => setInstallmentOnly(v => !v)}
						onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setInstallmentOnly(v => !v); }}
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
							{t('installment') || 'განვადება'}
						</span>
						<span className={tableStatementStyles.installmentTooltip}>
							{t('installment_tooltip') || 'განვადებები/განაწილება(თბს) ჩვენება/დამალვა'}
						</span>
					</div>
					<div
						className={tableStatementStyles.installmentBtnWrapper}
						tabIndex={0}
						role="button"
						aria-pressed={transfersOnly}
						onClick={() => setTransfersOnly(v => !v)}
						onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setTransfersOnly(v => !v); }}
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
							{t('transfers') || 'გადარიცხვები'}
						</span>
						<span className={tableStatementStyles.installmentTooltip}>
							{t('transfers_tooltip') || 'გადარიცხვების ჩვენება/დამალვა'}
						</span>
					</div>
					{!liveMode ? (
						<div className={tableStatementStyles.liveBankDropdownWrapper} ref={liveBankDropdownRef}>
							<button className={tableStatementStyles.liveBtn}
								type="button"
								style={{
									background: "#0173b1",
									cursor: loading ? "not-allowed" : "pointer",
								}}
								onClick={() => setLiveBankDropdownOpen(!liveBankDropdownOpen)}
								disabled={loading}
							>
								<FontAwesomeIcon icon={faBolt} style={{ marginRight: 6 }} />
								{t('live') || 'Live'}
								<FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 6, fontSize: '0.8em' }} />
							</button>
							{liveBankDropdownOpen && (
								<ul className={tableStatementStyles.liveBankDropdown}>
									<li className={tableStatementStyles.liveBankDropdownItem}>
										<button
											type="button"
											className={tableStatementStyles.liveBankDropdownBtn}
											onClick={() => handleSelectLiveBank('BOG')}
										>
											Bank of Georgia
										</button>
									</li>
									<li className={tableStatementStyles.liveBankDropdownItem}>
										<button
											type="button"
											className={tableStatementStyles.liveBankDropdownBtn}
											onClick={() => handleSelectLiveBank('TBC')}
										>
											TBC Bank
										</button>
									</li>
								</ul>
							)}
						</div>
					) : (
						<button className={tableStatementStyles.liveBtn}
							type="button"
							style={{
								background: "#FF6347",
								cursor: loading ? "not-allowed" : "pointer",
							}}
							onClick={handleExitLiveMode}
							disabled={loading}
						>
							<FontAwesomeIcon icon={faXmark} style={{ marginRight: 6 }} />
							{t('exit_live') || 'Exit Live'}
						</button>
					)}

					<div className={tableStatementStyles.pageSizeDropdownWrapper} ref={pageSizeDropdownRef}>
						<button
							type="button"
							className={tableStatementStyles.pageSizeBtn}
							onClick={() => setPageSizeDropdownOpen(open => !open)}
							aria-haspopup="listbox"
							aria-expanded={pageSizeDropdownOpen}
						>
							{pageSize} <span className={tableStatementStyles.pageSizeArrow}><FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 6, fontSize: '0.8em' }} /></span>
						</button>
						{pageSizeDropdownOpen && (
							<ul className={tableStatementStyles.pageSizeDropdown} role="listbox">
								{PAGE_SIZE_OPTIONS.map(opt => (
									<li key={opt} className={tableStatementStyles.pageSizeDropdownItem}>
										<button
											type="button"
											className={opt === pageSize ? tableStatementStyles.pageSizeDropdownBtnActive : tableStatementStyles.pageSizeDropdownBtn}
											onClick={() => {
												const newPageSize = opt;
												setPageSizeDropdownOpen(false);
												loadDbData({ ...filters, page: 1, pageSize: newPageSize });
												setPageSize(newPageSize);
												setPage(1);
											}}
											aria-current={opt === pageSize ? 'true' : undefined}
										>
											{opt}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
					<button
						className={filterStyles.filterToggleBtn}
						onClick={() => setFilterOpen(open => !open)}
						type="button"
					>
						{filterOpen ? (
							<FontAwesomeIcon icon={faXmark} />
						) : (
							<FontAwesomeIcon icon={faFilter} />
						)}
					</button>
				</div>
			</div>
			{
				filterOpen && (
					<div className={filterStyles.filterDrawer}>
						<TableFilter
							filters={pendingFilters}
							onChange={handleFilterChange}
							onReset={handleFilterReset}
							onApply={handleApplyFilters}
							fields={[
								{ name: 'contragent', label: t('contragent'), placeholder: t('search_by_contragent') },
								{
									name: 'bank',
									label: t('bank'),
									placeholder: t('search_by_bank'),
									type: 'bankDropdown'
								},
								{ name: 'amount', label: t('amount'), placeholder: t('search_by_amount') },
								{ name: 'transferDate', label: t('transferDate'), placeholder: t('search_by_transferDate') },
								{ name: 'purpose', label: t('purpose'), placeholder: t('search_by_purpose') },
								...(!liveMode ? [
									{ name: 'startDate', label: t('Start Date'), type: 'date' },
									{ name: 'endDate', label: t('End Date'), type: 'date' }
								] : [])
							]}
							bankOptions={bankOptions}
							bankDropdownOpen={bankDropdownOpen}
							setBankDropdownOpen={setBankDropdownOpen}
							bankDropdownRef={bankDropdownRef}
							onBankSelect={handleBankSelect}
							t={t}
						/>
					</div>
				)
			}
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={pagedData}
					loading={loading || dbLoading}
					emptyText="ამონაწერი არ მოიძებნა"
					sortConfig={sortConfig}
					setSortConfig={setSortConfig}
				/>
			</div>
			<Pagination
				total={
					liveMode
						? filteredData.length
						: (pagination.total || filteredData.length)
				}
				page={
					liveMode
						? livePagination.page
						: (pagination.page || page)
				}
				pageSize={
					liveMode
						? livePagination.pageSize
						: (pagination.pageSize || pageSize)
				}
				onChange={(newPage) => {
					if (liveMode) {
						setLivePagination(prev => ({
							...prev,
							page: newPage
						}));
						setPage(newPage);
					} else {
						loadDbData({ ...filters, page: newPage });
					}
				}}
			/>
		</div >
	);
};

export default TableStatement;