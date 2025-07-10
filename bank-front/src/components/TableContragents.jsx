import '../assets/css/TableAccounts.css';
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import defaultInstance from '../api/defaultInstance';
import TableFilter from './TableFilter';
import SortableTable from './SortableTable';
import AddContragentModal from './AddContragentModal';

import filterStyles from '../assets/css/filter.module.css';

let company = '';
if (typeof window !== "undefined") {
	if (window.location.pathname.startsWith('/anta')) company = 'anta';
	else company = 'gorgia';
}

const TableContragents = () => {
	const [contragents, setContragents] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ name: '', identification_code: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({ name: '', identification_code: '' });
	const [filteredContragents, setFilteredContragents] = useState([]);
	const didFetch = useRef(false);

	const { t } = useTranslation();

	useEffect(() => {
		if (didFetch.current) return;
		didFetch.current = true;
		setLoading(true);
		defaultInstance.get(`/contragents?company=${company}`)
			.then(res => {
				setContragents(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	useEffect(() => {
		let filtered = contragents;
		if (filters.name) {
			filtered = filtered.filter(c =>
				c.name && c.name.toLowerCase().includes(filters.name.toLowerCase())
			);
		}
		if (filters.identification_code) {
			filtered = filtered.filter(c =>
				c.identification_code && c.identification_code.includes(filters.identification_code)
			);
		}
		setFilteredContragents(filtered);
	}, [contragents, filters]);

	const handleOpenModal = () => setModalOpen(true);
	const handleCloseModal = () => {
		setModalOpen(false);
		setForm({ name: '', identification_code: '' });
		setError('');
	};
	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.name.trim() || !form.identification_code.trim()) return;
		try {
			await defaultInstance.post('/contragents', {
				name: form.name,
				identification_code: form.identification_code,
				company
			});
			handleCloseModal();
			setLoading(true);
			defaultInstance.get(`/contragents?company=${company}`)
				.then(res => {
					setContragents(res.data);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} catch (err) {
			setError('შეცდომა დამატებისას');
		}
	};

	const handleFilterChange = (e) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
	};
	const handleFilterReset = () => {
		setFilters({ name: '', identification_code: '' });
	};

	const columns = [
		{ key: 'name', label: t('title') },
		{ key: 'identification_code', label: t('identification_code') },
		{
			key: 'created_at',
			label: t('registration_date'),
			render: (val) => new Date(val).toLocaleString()
		}
	];

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">{t('contragents')}</h2>
				<div style={{ display: 'flex', gap: 10 }}>
					<button
						style={{
							background: "#0173b1",
							color: "#fff",
							border: "none",
							borderRadius: 6,
							padding: "8px 16px",
							cursor: "pointer",
							fontWeight: 500
						}}
						onClick={handleOpenModal}
					>
						<FontAwesomeIcon icon={faPlus} style={{ marginRight: 5 }} />
						{t('add_contragent')}
					</button>
					<button
						className={filterStyles.filterToggleBtn}
						onClick={() => setFilterOpen(open => !open)}
						type="button"
					>
						{filterOpen ? (
							<FontAwesomeIcon icon={faXmark} />) : (
							<FontAwesomeIcon icon={faFilter} />)}
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
							{ name: 'name', label: t('title'), placeholder: t('search_by_title') },
							{ name: 'identification_code', label: t('identification_code'), placeholder: t('search_by_code') }
						]}
					/>
				</div>
			)}
			{modalOpen && (
				<AddContragentModal
					open={modalOpen}
					onClose={handleCloseModal}
					onSubmit={handleSubmit}
					form={form}
					onChange={handleChange}
					error={error}
					t={t}
				/>
			)}
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={filteredContragents}
					loading={loading}
					emptyText={t('no_data_found') || 'მონაცემები არ მოიძებნა'}
				/>
			</div>
		</div>
	);
};

export default TableContragents;