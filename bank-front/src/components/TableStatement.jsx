import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useRef } from 'react';
import defaultInstance from '../api/defaultInstance';
import Pagination from './Pagination';
import TableFilter from './TableFilter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import filterStyles from '../assets/css/filter.module.css';

const TableStatement = () => {

	const { t } = useTranslation();

	const columns = [
		{ key: 'contragent', label: t('contragent') },
		{ key: 'bank', label: t('bank') },
		{ key: 'amount', label: t('amount') },
		{ key: 'transferDate', label: t('transferDate') },
		{ key: 'purpose', label: t('purpose') },
		{ key: 'syncDate', label: t('syncDate') }
	];

	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const pageSize = 20;

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
	const [statementLoading, setStatementLoading] = useState(false);
	const [dbLoading, setDbLoading] = useState(false);

	const [dbData, setDbData] = useState([]);
	const [lastSyncDate, setLastSyncDate] = useState('');

	const bankOptions = useMemo(() => {
		const setBanks = new Set();
		data.forEach(row => {
			if (row.bank) setBanks.add(row.bank);
		});
		return Array.from(setBanks);
	}, [data]);

	const initialLoadedRef = useRef(false);

	const loadTodayActivities = () => {
		setLoading(true);
		setError(null);
		const now = new Date();
		const formattedNow = now.toLocaleString({ hour12: false }).replace('T', ' ');
		setLastSyncDate(formattedNow);
		defaultInstance.get('/bog/todayactivities')
			.then(res => {
				const rows = (res.data?.activities || res.data || []).map((item, idx) => ({
					id: idx + 1,
					contragent: item.Sender?.Name || '',
					bank: item.Sender?.BankName || 'ბანკი არ არის მითითებული',
					amount: (item.Amount || '') + '₾',
					transferDate: (item.PostDate || item.ValueDate || '').split('T')[0],
					purpose: item.EntryComment || '',
					syncDate: formattedNow,
				}));
				setData(rows);
			})
			.catch(() => {
				setError(t('no_data_found'));
			})
			.finally(() => setLoading(false));
	};

	const loadDbData = () => {
		setDbLoading(true);
		setError(null);
		defaultInstance.get('/gorgia-bog-transactions')
			.then(res => {
				const rows = (res.data || []).map((item, idx) => ({
					id: item.id || idx + 1,
					contragent: item.sender_name || item.beneficiary_name || '-',
					bank: item.sender_bank_name || item.beneficiary_bank_name || '-',
					amount: item.amount ?? 0,
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.entry_comment || '-',
					syncDate: item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : '-',
				}));
				setDbData(rows);
				setData(rows);
			})
			.catch(() => {
				setError(t('no_data_found'));
			})
			.finally(() => setDbLoading(false));
	};

	useEffect(() => {
		if (!initialLoadedRef.current) {
			loadTodayActivities();
			initialLoadedRef.current = true;
		}
	}, []);

	useEffect(() => {
		const hasFilter = Object.values(filters).some(val => val && val !== '');
		if (hasFilter) {
			loadDbData();
		} else {
			setData(prev => prev);
		}
	}, [filters]);

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

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">{t('statement')}</h2>
				<div style={{ display: 'flex', gap: 10 }}>
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