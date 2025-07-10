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
import HideRoleModal from './HideRoleModal';
import DeleteConfirmModal from './DeleteConfirmModal';

import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';

import { useSelector } from 'react-redux';

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
	const [filteredContragents, setFilteredContragents] = useState([]);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editContragent, setEditContragent] = useState(null);
	const [editForm, setEditForm] = useState({ name: '', identification_code: '', hidden_for_roles: [] });
	const [editError, setEditError] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);
	const didFetch = useRef(false);
	const user = useSelector(state => state.user.user);
	const [selectedIds, setSelectedIds] = useState([]);
	const [hideRolesModalOpen, setHideRolesModalOpen] = useState(false);
	const [hideRoles, setHideRoles] = useState([]);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState(null);
	const [deleteError, setDeleteError] = useState('');
	const roleOptions = [
		{ value: 'admin', label: t('administrator') || 'ადმინისტრატორი' },
		{ value: 'distribution_operator', label: t('distribution_operator') || 'დისტრიბუციის ოპერატორი' },
		{ value: 'corporate_sales_manager', label: t('corporate_sales_manager') || 'კორპორატიული გაყიდვების მენეჯერი' }
	];

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
		if (user && user.role !== 'super_admin') {
			filtered = filtered.filter(c =>
				!Array.isArray(c.hidden_for_roles) || !c.hidden_for_roles.includes(user.role)
			);
		}
		setFilteredContragents(filtered);
	}, [contragents, filters, user]);

	useEffect(() => {
		setPage(1);
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
		const { name, value, type, checked } = e.target;
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
		const { name, value, type, checked } = e.target;
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
			setLoading(true);
			defaultInstance.get(`/contragents`)
				.then(res => {
					setContragents(res.data);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} catch (err) {
			setDeleteError(t('error_deleting'));
		}
	};

	const handleFilterChange = (e) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
	};
	const handleFilterReset = () => {
		setFilters({ name: '', identification_code: '' });
	};

	const handleSelectAll = (e) => {
		if (e.target.checked) {
			setSelectedIds(filteredContragents.map(c => c.id));
		} else {
			setSelectedIds([]);
		}
	};
	const handleSelectOne = (id) => {
		setSelectedIds(ids =>
			ids.includes(id) ? ids.filter(_id => _id !== id) : [...ids, id]
		);
	};

	const openHideRolesModal = () => {
		const selectedContragents = contragents.filter(c => selectedIds.includes(c.id));
		setHideRolesModalOpen(true);
	};
	const closeHideRolesModal = () => setHideRolesModalOpen(false);

	const handleHideRolesChange = (e) => {
		const { value, checked } = e.target;
		setHideRoles(prev =>
			checked ? [...prev, value] : prev.filter(r => r !== value)
		);
	};

	const handleHideForRolesSubmit = async (e) => {
		e.preventDefault();
		try {
			await Promise.all(
				selectedIds.map(async (id) => {
					const contragent = contragents.find(c => c.id === id);
					const prevHidden = Array.isArray(contragent.hidden_for_roles) ? contragent.hidden_for_roles : [];
					const merged = Array.from(new Set([...prevHidden, ...hideRoles]));
					await defaultInstance.put(`/contragents/${id}`, {
						name: contragent.name,
						identification_code: contragent.identification_code,
						hidden_for_roles: merged,
					});
				})
			);
			setSelectedIds([]);
			setHideRoles([]);
			setHideRolesModalOpen(false);
			setLoading(true);
			const res = await defaultInstance.get(`/contragents`);
			setContragents(res.data);
			setLoading(false);
		} catch (err) {
			alert(t('error_editing'));
		}
	};

	const columns = [
		...(user && (user.role === 'super_admin') ? [
			{
				key: 'select',
				label: (
					<input
						type="checkbox"
						checked={selectedIds.length === pagedData.length && pagedData.length > 0}
						onChange={handleSelectAll}
						aria-label={t('select_all')}
					/>
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
			{hideRolesModalOpen && (
				<HideRoleModal
					open={hideRolesModalOpen}
					onClose={closeHideRolesModal}
					selectedContragents={contragents.filter(c => selectedIds.includes(c.id))}
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
					data={pagedData}
					loading={loading}
					emptyText={t('no_data_found') || 'მონაცემები არ მოიძებნა'}
				/>
				<DeleteConfirmModal
					open={deleteModalOpen}
					onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }}
					onConfirm={handleDeleteConfirm}
					title={t('delete_title') || 'წაშლა'}
					text={t('delete_confirm_text') || 'დარწმუნებული ხართ, რომ გსურთ წაშლა?'}
					t={t}
				/>
				{/* Можно вывести ошибку удаления, если нужно */}
				{deleteError && <div style={{ color: 'red', marginTop: 10 }}>{deleteError}</div>}
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