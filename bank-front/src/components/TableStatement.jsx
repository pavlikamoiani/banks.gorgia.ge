import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import defaultInstance from '../api/defaultInstance';
import Pagination from './Pagination';
import TableFilter from './TableFilter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';

const MAX_PURPOSE_LENGTH = 20;
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const TableStatement = () => {
	const { t } = useTranslation();
	const location = useLocation();

	const [expandedRows, setExpandedRows] = useState({});

	const currentBank = useMemo(() => {
		if (location.pathname.startsWith('/anta')) return 'anta';
		return 'gorgia';
	}, [location.pathname]);

	const columns = [
		{ key: 'contragent', label: t('contragent') },
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

	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);

	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({
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
	// eslint-disable-next-line
	const [lastSyncDate, setLastSyncDate] = useState('');

	const bankOptions = useMemo(() => {
		const setBanks = new Set();
		(data || []).forEach(row => {
			if (row.bank) setBanks.add(row.bank);
		});
		return Array.from(setBanks);
	}, [data]);

	const initialLoadedRef = useRef(false);

	const loadTodayActivities = async () => {
		setLoading(true);
		setError(null);
		const now = new Date();
		const formattedNow = now.toLocaleString({ hour12: false }).replace('T', ' ');
		setLastSyncDate(formattedNow);

		try {
			// Параллельно загружаем оба банка
			const [tbcResponse, bogResponse] = await Promise.all([
				defaultInstance.get(
					currentBank === 'gorgia'
						? '/gorgia/tbc/todayactivities'
						: '/anta/tbc/todayactivities'
				),
				defaultInstance.get(
					currentBank === 'gorgia'
						? '/gorgia/bog/todayactivities'
						: '/anta/bog/todayactivities'
				)
			]);

			let combinedRows = [];

			// TBC
			if (tbcResponse.data?.activities) {
				const tbcRows = (tbcResponse.data.activities || []).map((item, idx) => ({
					id: `tbc-${idx + 1}`,
					contragent: item.Sender?.Name || '',
					bank: item.Sender?.BankName || 'TBC Bank',
					amount: (item.Amount || '') + ' ₾',
					transferDate: (item.PostDate || item.ValueDate || '').split('T')[0],
					purpose: item.EntryComment || '',
					syncDate: formattedNow
				}));
				combinedRows = [...combinedRows, ...tbcRows];
			}

			// BOG
			if (bogResponse.data?.activities || bogResponse.data) {
				const bogRows = (bogResponse.data?.activities || bogResponse.data || []).map((item, idx) => ({
					id: `bog-${idx + 1}`,
					contragent: item.Sender?.Name || '',
					bank: item.Sender?.BankName || 'ბანკი არ არის მითითებული',
					amount: (item.Amount || '') + ' ₾',
					transferDate: (item.PostDate || item.ValueDate || '').split('T')[0],
					purpose: item.EntryComment || '',
					syncDate: formattedNow
				}));
				combinedRows = [...combinedRows, ...bogRows];
			}

			// Сортировка по дате (новые сверху)
			combinedRows.sort((a, b) => {
				return new Date(b.transferDate) - new Date(a.transferDate);
			});

			setData(combinedRows);
		} catch (err) {
			console.error("Error loading transactions:", err);
			setError(t('failed_to_load_transactions'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!initialLoadedRef.current) {
			loadTodayActivities();
			initialLoadedRef.current = true;
		}
	}, [currentBank]);

	const loadDbData = async () => {
		setDbLoading(true);
		setError(null);

		try {
			// Параллельно загружаем оба банка
			const [tbcResponse, bogResponse] = await Promise.all([
				defaultInstance.get(
					currentBank === 'gorgia'
						? '/gorgia-tbc-transactions'
						: '/anta-tbc-transactions'
				),
				defaultInstance.get(
					currentBank === 'gorgia'
						? '/gorgia-bog-transactions'
						: '/anta-bog-transactions'
				)
			]);

			let combinedRows = [];

			// TBC
			if (tbcResponse.data) {
				const tbcRows = (tbcResponse.data || []).map((item, idx) => ({
					id: `tbc-${item.id || idx + 1}`,
					contragent: item.sender_name || '-',
					bank: 'TBC Bank',
					amount: (item.amount ?? 0) + ' ₾',
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.description || '-',
					syncDate: item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : '-'
				}));
				combinedRows = [...combinedRows, ...tbcRows];
			}

			// BOG
			if (bogResponse.data) {
				const bogRows = (bogResponse.data || []).map((item, idx) => ({
					id: `bog-${item.id || idx + 1}`,
					contragent: item.sender_name || item.beneficiary_name || '-',
					bank: item.sender_bank_name || item.beneficiary_bank_name || '-',
					amount: (item.amount ?? 0) + ' ₾',
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.entry_comment || item.entry_comment_en || '-',
					syncDate: item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : '-'
				}));
				combinedRows = [...combinedRows, ...bogRows];
			}

			// Сортировка по дате (новые сверху)
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
		const hasFilter = Object.values(filters).some(val => val && val !== '');
		if (hasFilter) {
			loadDbData();
		} else {
			setData(prev => prev);
		}
	}, [filters, currentBank]);

	const handleFilterChange = (e) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
	};

	const handleFilterReset = () => {
		setFilters({
			contragent: '',
			bank: '',
			amount: '',
			transferDate: '',
			purpose: '',
			startDate: '',
			endDate: ''
		});
	};

	const handleBankSelect = (bank) => {
		setFilters(f => ({ ...f, bank }));
		setBankDropdownOpen(false);
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
		const hasFilter = Object.values(filters).some(val => val && val !== '');
		let source = hasFilter ? dbData : data;
		let filtered = source;
		if (filters.contragent) {
			filtered = filtered.filter(row =>
				row.contragent && row.contragent.toLowerCase().includes(filters.contragent.toLowerCase())
			);
		}
		if (filters.bank) {
			filtered = filtered.filter(row =>
				row.bank && row.bank === filters.bank
			);
		}
		if (filters.amount) {
			filtered = filtered.filter(row =>
				String(row.amount).includes(filters.amount)
			);
		}
		if (filters.transferDate) {
			filtered = filtered.filter(row =>
				row.transferDate && row.transferDate.includes(filters.transferDate)
			);
		}
		if (filters.purpose) {
			filtered = filtered.filter(row =>
				row.purpose && row.purpose.toLowerCase().includes(filters.purpose.toLowerCase())
			);
		}
		if (filters.startDate) {
			filtered = filtered.filter(row =>
				row.transferDate && row.transferDate >= filters.startDate
			);
		}
		if (filters.endDate) {
			filtered = filtered.filter(row =>
				row.transferDate && row.transferDate <= filters.endDate
			);
		}
		return filtered;
	}, [data, dbData, filters]);

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
						filters={filters}
						onChange={handleFilterChange}
						onReset={handleFilterReset}
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
							{ name: 'startDate', label: t('Start Date'), type: 'date' },
							{ name: 'endDate', label: t('End Date'), type: 'date' }
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