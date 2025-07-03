import '../assets/css/TableAccounts.css';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import defaultInstance from '../api/defaultInstance';
import TableFilter from './TableFilter';

import styles from '../assets/css/modal.module.css';
import filterStyles from '../assets/css/filter.module.css';


const TableContragents = () => {
	const [contragents, setContragents] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ name: '', identification_code: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({ name: '', identification_code: '' });
	const [filteredContragents, setFilteredContragents] = useState([]);
	let company = '';
	if (typeof window !== "undefined") {
		if (window.location.pathname.startsWith('/anta')) company = 'anta';
		else company = 'gorgia';
	}

	const { t } = useTranslation();

	// Fetch contragents from API
	useEffect(() => {
		setLoading(true);
		defaultInstance.get(`/contragents?company=${company}`)
			.then(res => {
				setContragents(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
		// eslint-disable-next-line
	}, [company, modalOpen]);

	// Фильтрация контрагентов
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
			// eslint-disable-next-line
		} catch (err) {
			setError('შეცდომა დამატებისას');
		}
	};

	// Фильтр: обработчики
	const handleFilterChange = (e) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
	};
	const handleFilterReset = () => {
		setFilters({ name: '', identification_code: '' });
	};

	const columns = [
		{ key: 'name', label: t('title') },
		{ key: 'identification_code', label: t('identification_code') },
		{ key: 'created_at', label: t('registration_date') }
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
							{ name: 'name', label: 'დასახელება', placeholder: 'Поиск по названию' },
							{ name: 'identification_code', label: 'საიდენფიკაციო კოდი', placeholder: 'Поиск по коду' }
						]}
					/>
				</div>
			)}
			{modalOpen && (
				<div
					className={styles.overlay}
				>
					<div
						className={styles.modal}
						onClick={e => e.stopPropagation()}
					>
						<button
							type="button"
							className={styles.modalClose}
							onClick={handleCloseModal}
							aria-label="Close"
						>
							&times;
						</button>
						<h3 className={styles.modalTitle}>{t('add_contragent')}</h3>
						<form onSubmit={handleSubmit}>
							<div className={styles.modalFormGroup}>
								<label>{t('title')}</label>
								<input
									type="text"
									name="name"
									value={form.name}
									onChange={handleChange}
									className={styles.modalInput}
									required
								/>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('identification_code')}</label>
								<input
									type="text"
									name="identification_code"
									value={form.identification_code}
									onChange={handleChange}
									className={styles.modalInput}
									required
								/>
							</div>
							{error && <div className={styles.modalError}>{error}</div>}
							<div className={styles.modalActions}>
								<button
									type="button"
									onClick={handleCloseModal}
									className={`${styles.modalButton} ${styles.modalButtonCancel}`}
								>
									{t('cancel')}
								</button>
								<button
									type="submit"
									className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
								>
									{t('add')}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			<div className="table-wrapper">
				<table className="accounts-table">
					<thead>
						<tr>
							<th>{t('title')}</th>
							<th>{t('identification_code')}</th>
							<th>{t('registration_date')}</th>
						</tr>
					</thead>
					<tbody className="table-contragents">
						{loading ? (
							<tr>
								<td colSpan={3}>იტვირთება...</td>
							</tr>
						) : filteredContragents.length > 0 ? (
							filteredContragents.map((c, idx) => (
								<tr key={c.id || idx}>
									<td>{c.name}</td>
									<td>{c.identification_code}</td>
									<td>{new Date(c.created_at).toLocaleString()}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={3}>მონაცემები არ მოიძებნა</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableContragents;