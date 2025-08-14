import { useSelector } from 'react-redux';
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
import HideRoleModal from './HideRoleModal';
import DeleteConfirmModal from './DeleteConfirmModal';

import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';
import '../assets/css/TableAccounts.css';

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const TableContragents = () => {
	const { t } = useTranslation();
	const [contragents, setContragents] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ name: '', identification_code: '', hidden_for_roles: [] });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({ name: '', identification_code: '' });
	const [filterDrafts, setFilterDrafts] = useState({ name: '', identification_code: '' });
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editContragent, setEditContragent] = useState(null);
	const [editForm, setEditForm] = useState({ name: '', identification_code: '', hidden_for_roles: [] });
	const [editError, setEditError] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);
	const user = useSelector(state => state.user.user);
	const [selectedIds, setSelectedIds] = useState([]);
	const [hideRolesModalOpen, setHideRolesModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState(null);
	const [deleteError, setDeleteError] = useState('');
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		pageSize: PAGE_SIZE_OPTIONS[0],
		totalPages: 0
	});

	const loadContragents = async (filterParams = {}) => {
		setLoading(true);
		try {
			const params = {
				...filterParams,
				page: filterParams.page || page,
				pageSize: pageSize
			};

			const response = await defaultInstance.get('/contragents', { params });

			// Check if response has paginated structure
			if (response.data && response.data.pagination) {
				setContragents(response.data.data || []);
				setPagination(response.data.pagination);
				// Update page state to match response
				setPage(response.data.pagination.page);
			} else {
				// Handle old format for backward compatibility
				setContragents(response.data || []);
			}
		} catch (err) {
			console.error("Error loading contragents:", err);
			setError(t('error_loading_data'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadContragents(filters);
		// eslint-disable-next-line
	}, [filters, pageSize]);

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

	const handleOpenModal = () => setModalOpen(true);
	const handleCloseModal = () => {
		setModalOpen(false);
		setForm({ name: '', identification_code: '' });
		setError('');
	};
	const handleChange = (e) => {
		const { name, value, checked } = e.target;
		if (name === 'hidden_for_roles') {
			let updated = [...form.hidden_for_roles];
			if (checked) {
				updated.push(value);
			} else {
				updated = updated.filter(r => r !== value);
			}
			setForm({ ...form, hidden_for_roles: updated });
		} else {
			setForm({ ...form, [name]: value });
		}
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.name.trim() || !form.identification_code.trim()) return;
		try {
			await defaultInstance.post('/contragents', {
				name: form.name,
				identification_code: form.identification_code,
				hidden_for_roles: form.hidden_for_roles,
			});
			handleCloseModal();
			loadContragents(filters);
		} catch (err) {
			setError('შეცდომა დამატებისას');
		}
	};

	const handleOpenEditModal = (contragent) => {
		setEditContragent(contragent);
		setEditForm({
			name: contragent.name || '',
			identification_code: contragent.identification_code || '',
			hidden_for_roles: contragent.hidden_for_roles || []
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
		const { name, value, checked } = e.target;
		if (name === 'hidden_for_roles') {
			let updated = [...editForm.hidden_for_roles];
			if (checked) {
				updated.push(value);
			} else {
				updated = updated.filter(r => r !== value);
			}
			setEditForm({ ...editForm, hidden_for_roles: updated });
		} else {
			setEditForm({ ...editForm, [name]: value });
		}
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
				identification_code: editForm.identification_code,
				hidden_for_roles: editForm.hidden_for_roles,
			});
			handleCloseEditModal();
			loadContragents(filters);
		} catch (err) {
			setEditError(t('error_editing'));
		}
	};

	const handleDeleteContragent = (contragentId) => {
		setDeleteId(contragentId);
		setDeleteError('');
		setDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			await defaultInstance.delete(`/contragents/${deleteId}`);
			setDeleteModalOpen(false);
			setDeleteId(null);
			loadContragents(filters);
		} catch (err) {
			setDeleteError(t('error_deleting'));
		}
	};

	const handleFilterChange = (e) => {
		setFilterDrafts({ ...filterDrafts, [e.target.name]: e.target.value });
	};
	const handleFilterReset = () => {
		setFilterDrafts({ name: '', identification_code: '' });
		setFilters({ name: '', identification_code: '' });
	};
	const handleFilterApply = () => {
		setFilters({ ...filterDrafts });
		setPage(1);
		loadContragents({ ...filterDrafts, page: 1 });
	};

	const handleSelectAll = (e) => {
		if (selectedIds.length === contragents.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(contragents.map(row => row.id));
		}
	};
	const handleSelectOne = (id) => {
		setSelectedIds(ids =>
			ids.includes(id) ? ids.filter(_id => _id !== id) : [...ids, id]
		);
	};

	const openHideRolesModal = () => {
		setHideRolesModalOpen(true);
	};
	const closeHideRolesModal = () => setHideRolesModalOpen(false);

	const columns = [
		...(user && (user.role === 'super_admin') ? [
			{
				key: 'select',
				label: (
					<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<input
							type="checkbox"
							checked={selectedIds.length === contragents.length && contragents.length > 0}
							onChange={handleSelectAll}
							aria-label={t('select_all')}
						/>
						{selectedIds.length > 0 && (
							<span style={{ fontWeight: 'bold', color: '#0173b1' }}>
								{selectedIds.length} {t('selected')}
							</span>
						)}
					</span>
				),
				render: (val, row) => (
					<input
						type="checkbox"
						checked={selectedIds.includes(row.id)}
						onChange={() => handleSelectOne(row.id)}
						aria-label={t('select')}
					/>
				),
				width: 32
			}
		] : []),
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
												loadContragents({ ...filters, page: 1, pageSize: opt });
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
					{user && user.role === 'super_admin' && selectedIds.length > 0 && (
						<button
							style={{
								background: "#e67e22",
								color: "#fff",
								border: "none",
								borderRadius: 6,
								padding: "8px 16px",
								cursor: "pointer",
								fontWeight: 500,
								minHeight: '40px',
							}}
							onClick={openHideRolesModal}
						>
							<FontAwesomeIcon icon={faXmark} style={{ marginRight: 5 }} />
							{t('hide_for_roles') || 'დამალვა როლებისთვის'}
						</button>
					)}
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
						filters={filterDrafts}
						onChange={handleFilterChange}
						onReset={handleFilterReset}
						onApply={handleFilterApply}
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
			{hideRolesModalOpen && (
				<HideRoleModal
					open={hideRolesModalOpen}
					onClose={closeHideRolesModal}
					selectedContragents={Array.isArray(contragents) ? contragents.filter(c => selectedIds.includes(c.id)) : []}
					onSubmit={async (newRoles) => {
						try {
							await Promise.all(
								selectedIds.map(async (id) => {
									const contragent = contragents.find(c => c.id === id);
									await defaultInstance.put(`/contragents/${id}`, {
										name: contragent.name,
										identification_code: contragent.identification_code,
										hidden_for_roles: newRoles,
									});
								})
							);
							setSelectedIds([]);
							setHideRolesModalOpen(false);
							setLoading(true);
							const res = await defaultInstance.get(`/contragents`);
							setContragents(res.data);
							setLoading(false);
						} catch (err) {
							alert(t('error_editing'));
						}
					}}
					t={t}
				/>
			)}
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={Array.isArray(contragents) ? contragents : []} // Ensure array
					loading={loading}
				/>
				<DeleteConfirmModal
					open={deleteModalOpen}
					onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }}
					onConfirm={handleDeleteConfirm}
					title={t('delete_title') || 'წაშლა'}
					text={t('delete_confirm_text') || 'დარწმუნებული ხართ, რომ გსურთ წაშლა?'}
					t={t}
				/>
				{deleteError && <div style={{ color: 'red', marginTop: 10 }}>{deleteError}</div>}
			</div>
			<Pagination
				total={pagination.total || 0}
				page={pagination.page || page}
				pageSize={pagination.pageSize || pageSize}
				onChange={(newPage) => {
					loadContragents({ ...filters, page: newPage });
				}}
			/>
		</div>
	);
};

export default TableContragents;