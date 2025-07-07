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
		purpose: ''
	});
	const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
	const bankDropdownRef = useRef(null);
	const [statementLoading, setStatementLoading] = useState(false);
	const [dbLoading, setDbLoading] = useState(false); // new state for db loading

	const bankOptions = useMemo(() => {
		const setBanks = new Set();
		data.forEach(row => {
			if (row.bank) setBanks.add(row.bank);
		});
		return Array.from(setBanks);
	}, [data]);

	const handleFilterChange = (e) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
	};
	const handleFilterReset = () => {
		setFilters({
			contragent: '',
			bank: '',
			amount: '',
			transferDate: '',
			purpose: ''
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
		let filtered = data;
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
		return filtered;
	}, [data, filters]);

	const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

	useEffect(() => {
		setLoading(true);
		defaultInstance.get('/bog/todayactivities')
			.then(res => {
				const rows = (res.data?.activities || res.data || []).map((item, idx) => ({
					id: idx + 1,
					contragent:
						item.Sender?.Name ||
						'',
					bank:
						item.Sender?.BankName ||
						'ბანკი არ არის მითითებული',
					amount:
						item.Amount ||
						'',
					transferDate:
						item.PostDate ||
						item.ValueDate ||
						'',
					purpose:
						item.EntryComment ||
						'',
					syncDate: item.syncDate || '',
				}));
				setData(rows);
			})
			.catch(() => {
				setError(t('no_data_found'));
			})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		setPage(1);
	}, [filters]);

	const parseStatementRecords = (records = []) => {
		return records.map((item, idx) => ({
			id: idx + 1,
			contragent: item.SenderDetails?.Name || '',
			bank: item.SenderDetails?.BankName || item.DocumentCorrespondentBankName || '',
			amount: item.EntryAmount || item.EntryAmountDebit || item.EntryAmountCredit || item.DocumentSourceAmount || '',
			transferDate: item.EntryDate ? item.EntryDate.slice(0, 10) : '',
			purpose: item.EntryComment || item.DocumentInformation || '',
			syncDate: item.DocumentReceiveDate ? item.DocumentReceiveDate.slice(0, 19).replace('T', ' ') : '',
		}));
	};

	const fetchStatement = () => {
		setStatementLoading(true);
		setError(null);
		const account = 'GE07BG0000000967345600';
		const currency = 'GEL';
		const today = new Date();
		const endDate = today.toISOString().slice(0, 10);
		const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		const includeToday = 'true';
		const orderByDate = 'false';
		defaultInstance.get(`/bog/statement/${account}/${currency}/${startDate}/${endDate}/${includeToday}/${orderByDate}`)
			.then(res => {
				let rows = [];
				if (res.data?.data && Array.isArray(res.data.data)) {
					rows = res.data.data.map((item, idx) => ({
						id: item.id || idx + 1,
						contragent: item.contragent || '',
						bank: item.bank || '',
						amount: item.amount || '',
						transferDate: item.transferDate || '',
						purpose: item.purpose || '',
						syncDate: item.syncDate || '',
					}));
				} else if (res.data?.Records && Array.isArray(res.data.Records)) {
					rows = parseStatementRecords(res.data.Records);
				}
				setData(rows);
			})
			.catch(() => {
				setError(t('no_data_found'));
			})
			.finally(() => setStatementLoading(false));
	};

	const fetchFromDb = () => {
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
				setData(rows);
			})
			.catch(() => {
				setError(t('no_data_found'));
			})
			.finally(() => setDbLoading(false));
	};

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
					<button
						style={{ padding: '0 10px' }}
						onClick={fetchStatement}
						disabled={statementLoading}
						type="button"
					>
						{statementLoading ? t('loading') : t('get_statement')}
					</button>
					<button
						style={{ padding: '0 10px' }}
						onClick={fetchFromDb}
						disabled={dbLoading}
						type="button"
					>
						{dbLoading ? t('loading') : 'DB'}
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
							{ name: 'purpose', label: t('purpose'), placeholder: t('search_by_purpose') }
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
					loading={loading}
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