import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import defaultInstance from '../api/defaultInstance';
import Pagination from './Pagination';
import TableFilter from './TableFilter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faBolt } from '@fortawesome/free-solid-svg-icons';
import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';

const MAX_PURPOSE_LENGTH = 20;
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

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

	const columns = [
		{
			key: 'contragent', label: t('contragent'),
			render: (value) => {
				if (value === 'ტერმინალით გადახდა') {
					return <span style={{ color: 'red' }}>{value}</span>;
				}
				return value;
			}
		},
		{ key: 'bank', label: t('bank') },
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
								<button className={(tableStatementStyles.showLessBtn)}
									onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: false }))}
								>
									{t('show_less')}
								</button>
							</>
						) : (
							<>
								<span>{value.slice(0, MAX_PURPOSE_LENGTH)}...</span>
								<button className={(tableStatementStyles.showoreBtn)}

									onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: true }))}
								>
									{t('show_more')}
								</button>
							</>
						)}
					</span>
				);
			}
		},
		{ key: 'syncDate', label: t('syncDate') }
	];

	const [filterOpen, setFilterOpen] = useState(false);
	const [liveMode, setLiveMode] = useState(false);
	const [installmentOnly, setInstallmentOnly] = useState(false);

	const getEndpoint = () => {
		if (currentBank === 'anta') return '/anta-transactions';
		return '/gorgia-transactions';
	};

	const loadDbData = async (filterParams = {}) => {
		setDbLoading(true);
		setError(null);

		try {
			const params = { ...filterParams };
			const endpoint = getEndpoint();
			const response = await defaultInstance.get(endpoint, { params });

			let combinedRows = [];

			if (response.data) {
				combinedRows = (response.data || []).map((item, idx) => ({
					id: `${item.bank_id === 1 ? 'tbc' : 'bog'}-${item.id || idx + 1}`,
					contragent: item.sender_name || 'ტერმინალით გადახდა',
					bank: item.bank_id === 1 ? 'TBC Bank' : 'Bank of Georgia',
					amount: (item.amount ?? 0) + ' ₾',
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.description || '-',
					syncDate: item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : '-'
				}));
			}

			combinedRows.sort((a, b) => {
				if (a.transferDate === b.transferDate) return 0;
				if (a.transferDate === '-') return 1;
				if (b.transferDate === '-') return -1;
				return new Date(b.transferDate) - new Date(a.transferDate);
			});

			setDbData(combinedRows);
			setData(combinedRows);
		} catch (err) {
			console.error("Error loading DB transactions:", err);
			setError(t('no_data_found'));
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

	const loadLiveData = async (filterParams = {}) => {
		setLoading(true);
		setError(null);
		try {
			const resp = await defaultInstance.get('/live/today-activities', { params: filterParams });
			const rows = (resp.data?.data || []).map(item => ({
				...item,
				amount: (item.amount ?? 0) + ' ₾'
			}));
			setData(rows);
			setDbData(rows);
			setPage(1);
		}
		finally {
			setLoading(false);
		}
	};

	const handleApplyFilters = () => {
		if (liveMode) {
			// Remove startDate and endDate for live mode
			const { startDate, endDate, ...rest } = pendingFilters;
			setFilters(rest);
			setPendingFilters(rest);
			loadLiveData(rest);
		} else {
			setFilters({ ...pendingFilters });
			setPage(1);
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
		if (liveMode) {
			const { startDate, endDate, ...rest } = resetFilters;
			setFilters(rest);
			setPendingFilters(rest);
			loadLiveData(rest);
		} else {
			setFilters(resetFilters);
			setPendingFilters(resetFilters);
			setPage(1);
		}
	};

	const handleBankSelect = (bank) => {
		setPendingFilters(f => ({ ...f, bank }));
		setBankDropdownOpen(false);
	};

	const handleLiveMode = async () => {
		if (loading) return;
		setLiveMode(true);
		// Remove startDate and endDate when switching to live mode
		const { startDate, endDate, ...rest } = pendingFilters;
		setFilters(rest);
		setPendingFilters(rest);
		await loadLiveData(rest);
	};

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

	const filteredData = useMemo(() => {
		let base = dbData;
		if (liveMode) base = data;
		if (!installmentOnly) return base;
		return base.filter(row =>
			(row.purpose || row.description || '').toLowerCase().includes('განვადებ')
		);
	}, [dbData, data, installmentOnly, liveMode]);

	const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

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
				<h2 className="table-heading">{t('statement')}</h2>
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
							{t('installment_tooltip') || 'განვადებების(თბს) ჩვენება/დამალვა'}
						</span>
					</div>
					<button className={tableStatementStyles.liveBtn}
						type="button"
						style={{
							background: liveMode ? "#2E8B57" : "#0173b1",
							cursor: loading ? "not-allowed" : "pointer",
						}}
						onClick={handleLiveMode}
						disabled={loading}
					>
						<FontAwesomeIcon icon={faBolt} style={{ marginRight: 6 }} />
						{t('live') || 'Live'}
						<span className={tableStatementStyles.tooltip}>
							{t('live_today_transactions') || 'დღევანდელი ტრანზაქციები'}
						</span>
					</button>
					<div className={tableStatementStyles.pageSizeDropdownWrapper} ref={pageSizeDropdownRef}>
						<button
							type="button"
							className={tableStatementStyles.pageSizeBtn}
							onClick={() => setPageSizeDropdownOpen(open => !open)}
							aria-haspopup="listbox"
							aria-expanded={pageSizeDropdownOpen}
						>
							{pageSize} <span className={tableStatementStyles.pageSizeArrow}>▼</span>
						</button>
						{pageSizeDropdownOpen && (
							<ul className={tableStatementStyles.pageSizeDropdown} role="listbox">
								{PAGE_SIZE_OPTIONS.map(opt => (
									<li key={opt} className={tableStatementStyles.pageSizeDropdownItem}>
										<button
											type="button"
											className={opt === pageSize ? tableStatementStyles.pageSizeDropdownBtnActive : tableStatementStyles.pageSizeDropdownBtn}
											onClick={() => {
												setPageSize(opt);
												setPage(1);
												setPageSizeDropdownOpen(false);
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
			{filterOpen && (
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
			)}
			<div className="table-wrapper">
				{error && <div style={{ color: 'red' }}>{error}</div>}
				<SortableTable
					columns={columns}
					data={pagedData}
					loading={loading || dbLoading}
					emptyText="ამონაწერი არ მოიძებნა"
				/>
			</div>
			<Pagination
				total={filteredData.length}
				page={page}
				pageSize={pageSize}
				onChange={setPage}
			/>
		</div>
	);
};

export default TableStatement;