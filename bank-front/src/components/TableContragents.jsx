import '../assets/css/TableAccounts.css';
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faPlus, faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import defaultInstance from '../api/defaultInstance';
import TableFilter from './TableFilter';
import SortableTable from './SortableTable';
import AddContragentModal from './AddContragentModal';
import EditContragentModal from './EditContragentModal';
import Pagination from './Pagination';

import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';

import { useSelector } from 'react-redux';

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const TableContragents = () => {
	const [contragents, setContragents] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ name: '', identification_code: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({ name: '', identification_code: '' });
	const [filteredContragents, setFilteredContragents] = useState([]);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editContragent, setEditContragent] = useState(null);
	const [editForm, setEditForm] = useState({ name: '', identification_code: '' });
	const [editError, setEditError] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);
	const didFetch = useRef(false);
	const user = useSelector(state => state.user.user);


	const { t } = useTranslation();

	useEffect(() => {
		if (didFetch.current) return;
		didFetch.current = true;
		setLoading(true);
		defaultInstance.get(`/contragents`)
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

	useEffect(() => {
		setPage(1); // Reset to first page on filter change
	}, [contragents, filters]);

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

	const pagedData = filteredContragents.slice((page - 1) * pageSize, page * pageSize);

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
			});
			handleCloseModal();
			setLoading(true);
			defaultInstance.get(`/contragents`)
				.then(res => {
					setContragents(res.data);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} catch (err) {
			setError('შეცდომა დამატებისას');
		}
	};

	const handleOpenEditModal = (contragent) => {
		setEditContragent(contragent);
		setEditForm({
			name: contragent.name || '',
			identification_code: contragent.identification_code || ''
		});
		setEditError('');
		setEditModalOpen(true);
	};
	const handleCloseEditModal = () => {
		setEditModalOpen(false);
		setEditContragent(null);
		setEditForm({ name: '', identification_code: '' });
		setEditError('');
	};
	const handleEditChange = (e) => {
		setEditForm({ ...editForm, [e.target.name]: e.target.value });
	};
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		if (!editForm.name.trim() || !editForm.identification_code.trim()) {
			setEditError(t('all_fields_required'));
			return;
		}
		try {
			await defaultInstance.put(`/contragents/${editContragent.id}`, {
				name: editForm.name,
				identification_code: editForm.identification_code
			});
			handleCloseEditModal();
			setLoading(true);
			defaultInstance.get(`/contragents`)
				.then(res => {
					setContragents(res.data);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} catch (err) {
			setEditError(t('error_editing'));
		}
	};

	const handleDeleteContragent = async (contragentId) => {
		if (!window.confirm(t('delete_user_confirm'))) return;
		try {
			await defaultInstance.delete(`/contragents/${contragentId}`);
			setLoading(true);
			defaultInstance.get(`/contragents`)
				.then(res => {
					setContragents(res.data);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} catch (err) {
			alert(t('error_deleting'));
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
		},
		...(user && (user.role === 'super_admin' || user.role === "admin") ? [
			{
				key: 'actions',
				label: t('actions'),
				render: (value, row) => (
					<>
						<button
							className="icon-btn icon-btn-edit"
							onClick={() => handleOpenEditModal(row)}
							title={t('edit_user')}
						>
							<FontAwesomeIcon icon={faPencil} color="#fff" />
						</button>
						<button
							className="icon-btn icon-btn-delete"
							onClick={() => handleDeleteContragent(row.id)}
							title={t('delete_user_confirm')}
						>
							<FontAwesomeIcon icon={faTrash} color="#fff" />
						</button>
					</>
				)
			}
		] : [])
	];

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<h2 className="table-heading">{t('contragents')}</h2>
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
						style={{
							background: "#0173b1",
							color: "#fff",
							border: "none",
							borderRadius: 6,
							padding: "8px 16px",
							cursor: "pointer",
							fontWeight: 500,
							minHeight: '40px',
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
			{editModalOpen && (
				<EditContragentModal
					open={editModalOpen}
					onClose={handleCloseEditModal}
					onSubmit={handleEditSubmit}
					form={editForm}
					onChange={handleEditChange}
					error={editError}
					t={t}
				/>
			)}
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={pagedData}
					loading={loading}
					emptyText={t('no_data_found') || 'მონაცემები არ მოიძებნა'}
				/>
			</div>
			<Pagination
				total={filteredContragents.length}
				page={page}
				pageSize={pageSize}
				onChange={setPage}
			/>
		</div>
	);
};

export default TableContragents;