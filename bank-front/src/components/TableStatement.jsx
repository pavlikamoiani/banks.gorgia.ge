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