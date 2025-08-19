import { useSelector } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faPlus, faTrash, faPencil, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import defaultInstance from '../api/defaultInstance';
import TableFilter from './TableFilter';
import SortableTable from './SortableTable';
import AddContragentModal from './AddContragentModal';
import EditContragentModal from './EditContragentModal';
import Pagination from './Pagination';
import DeleteConfirmModal from './DeleteConfirmModal';
import HideRoleModal from './VisibilityRoleModal';

import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';
import '../assets/css/TableAccounts.css';

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const TableContragents = () => {
	const { t } = useTranslation();
	const [contragents, setContragents] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ name: '', identification_code: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({ name: '', identification_code: '' });
	const [filterDrafts, setFilterDrafts] = useState({ name: '', identification_code: '' });
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editContragent, setEditContragent] = useState(null);
	const [editForm, setEditForm] = useState({ name: '', identification_code: '' });
	const [editError, setEditError] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);
	const user = useSelector(state => state.user.user);
	const [selectedIds, setSelectedIds] = useState([]);
	const [allContragentIds, setAllContragentIds] = useState([]);
	const [selectAllChecked, setSelectAllChecked] = useState(false);
	const [totalContragents, setTotalContragents] = useState(0);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState(null);
	const [deleteError, setDeleteError] = useState('');
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		pageSize: PAGE_SIZE_OPTIONS[0],
		totalPages: 0
	});
	const [hideRoleModalOpen, setHideRoleModalOpen] = useState(false);
	const [selectedContragentForRole, setSelectedContragentForRole] = useState(null);
	const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);
	const [roleUpdateError, setRoleUpdateError] = useState('');

	const getCurrentBank = () => {
		const pathname = window.location.pathname;
		if (pathname.startsWith('/anta/contragents')) return 'anta';
		return 'gorgia';
	};

	const loadAllContragentIds = async () => {
		try {
			const params = {
				bank: getCurrentBank(),
				getAllIds: true
			};

			const response = await defaultInstance.get('/contragents/all-ids', { params });
			if (response.data && Array.isArray(response.data)) {
				setAllContragentIds(response.data);
				setTotalContragents(response.data.length);
			}
		} catch (err) {
			console.error("Error loading all contragent IDs:", err);
		}
	};

	const loadContragents = async (filterParams = {}) => {
		setLoading(true);
		try {
			const params = {
				...filterParams,
				bank: getCurrentBank(),
				page: filterParams.page || page,
				pageSize: pageSize
			};

			const response = await defaultInstance.get('/contragents', { params });

			if (response.data && response.data.pagination) {
				setContragents(Array.isArray(response.data.data) ? response.data.data : []);
				setPagination(response.data.pagination);
				setPage(response.data.pagination.page);
				setTotalContragents(response.data.pagination.total);

				// Check if all contragents are selected
				if (selectedIds.length > 0 && selectedIds.length === response.data.pagination.total) {
					setSelectAllChecked(true);
				} else {
					setSelectAllChecked(false);
				}
			} else {
				setContragents(Array.isArray(response.data) ? response.data : []);
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
		loadAllContragentIds();
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
		const { name, value } = e.target;
		setForm({ ...form, [name]: value });
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
			loadContragents(filters);
			loadAllContragentIds();
			// eslint-disable-next-line
		} catch (err) {
			setError('შეცდომა დამატებისას');
		}
	};

	const handleOpenEditModal = (contragent) => {
		setEditContragent(contragent);
		setEditForm({
			name: contragent.name || '',
			identification_code: contragent.identification_code || '',
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
		const { name, value } = e.target;
		setEditForm({ ...editForm, [name]: value });
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
			});
			handleCloseEditModal();
			loadContragents(filters);
			// eslint-disable-next-line
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
			loadAllContragentIds();
			setSelectedIds(prev => prev.filter(id => id !== deleteId));
			// eslint-disable-next-line
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
		loadContragents({ name: '', identification_code: '', bank: getCurrentBank() });
	};
	const handleFilterApply = () => {
		setFilters({ ...filterDrafts });
		setPage(1);
		loadContragents({ ...filterDrafts, page: 1, bank: getCurrentBank() });
	};

	const handleSelectAll = async (e) => {
		if (selectAllChecked) {
			setSelectedIds([]);
			setSelectAllChecked(false);
		} else {
			try {
				const params = {
					bank: getCurrentBank(),
					getAllIds: true,
					...filters
				};
				const response = await defaultInstance.get('/contragents/all-ids', { params });
				if (response.data && Array.isArray(response.data)) {
					setSelectedIds(response.data);
					setSelectAllChecked(true);
				}
			} catch (err) {
				console.error("Error selecting all contragents:", err);
			}
		}
	};

	const handleSelectOne = (id) => {
		setSelectedIds(ids => {
			const newIds = ids.includes(id)
				? ids.filter(_id => _id !== id)
				: [...ids, id];

			if (newIds.length === totalContragents) {
				setSelectAllChecked(true);
			} else {
				setSelectAllChecked(false);
			}

			return newIds;
		});
	};

	const handleOpenHideRoleModal = async (contragentsToEdit) => {
		setRoleUpdateError('');
		setSelectedContragentForRole(contragentsToEdit);
		setHideRoleModalOpen(true);
	};

	const handleCloseHideRoleModal = () => {
		setHideRoleModalOpen(false);
		setSelectedContragentForRole(null);
		setRoleUpdateError('');
	};

	const handleSubmitHideRoleModal = async (roles) => {
		if (!selectedContragentForRole || !Array.isArray(selectedContragentForRole)) return;
		setRoleUpdateLoading(true);
		setRoleUpdateError('');
		try {
			// eslint-disable-next-line
			const ids = selectedContragentForRole.map(c => c.id);
			await defaultInstance.put('/contragents/batch-roles', {
				ids: selectedIds,
				visible_for_roles: roles
			});
			await loadContragents(filters);
			setHideRoleModalOpen(false);
			setSelectedContragentForRole(null);
			// eslint-disable-next-line
		} catch (err) {
			setRoleUpdateError('შეცდომა როლების განახლებაში');
		} finally {
			setRoleUpdateLoading(false);
		}
	};

	const columns = [
		...(user && (user.role === 'super_admin') ? [
			{
				key: 'select',
				label: (
					<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<input
							type="checkbox"
							checked={selectAllChecked}
							onChange={handleSelectAll}
							aria-label={t('select_all')}
							style={{
								width: 18,
								height: 18,
								accentColor: "#0173b1",
								cursor: "pointer",
								boxShadow: selectAllChecked ? "0 0 0 2px #0173b1" : "none",
								border: "2px solid #0173b1",
								borderRadius: 4,
								outline: "none",
								transition: "box-shadow 0.2s"
							}}
						/>
						<span
							style={{
								fontWeight: 'bold',
								color: selectAllChecked ? '#0173b1' : '#fff',
								background: selectAllChecked ? '#e6f4fa' : 'transparent',
								borderRadius: 4,
								padding: "2px 8px",
								fontSize: 13,
								transition: "background 0.2s"
							}}
						>
							{t('select_all')}
						</span>
						{selectedIds.length > 0 && (
							<span style={{
								fontWeight: 'bold',
								color: '#0173b1',
								fontSize: 13,
								marginLeft: 4
							}}>
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
						style={{
							width: 18,
							height: 18,
							accentColor: "#0173b1",
							cursor: "pointer",
							border: "2px solid #0173b1",
							borderRadius: 4,
							outline: "none"
						}}
					/>
				),
				width: 60
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
							{pageSize}<FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 6, fontSize: '0.8em' }} />
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
			{user && user.role === 'super_admin' && selectedIds.length > 0 && (
				<div style={{ margin: '10px 0' }}>
					<button
						type="button"
						style={{
							background: "#0173b1",
							color: "#fff",
							border: "none",
							borderRadius: 6,
							padding: "8px 16px",
							cursor: "pointer",
							fontWeight: 500,
						}}
						onClick={() => {
							const selectedContragents = contragents.filter(c => selectedIds.includes(c.id));
							if (selectedContragents.length > 0) {
								handleOpenHideRoleModal(selectedContragents);
							}
						}}
					>
						<FontAwesomeIcon icon={faFilter} style={{ marginRight: 5 }} />
						{t('manage_role_visibility') || 'როლების მართვა'}
					</button>
				</div>
			)}
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
			{hideRoleModalOpen && selectedContragentForRole && (
				<HideRoleModal
					open={hideRoleModalOpen}
					onClose={handleCloseHideRoleModal}
					selectedContragents={selectedContragentForRole}
					onSubmit={handleSubmitHideRoleModal}
					t={t}
				/>
			)}
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={Array.isArray(contragents) ? contragents : []}
					loading={loading}
					emptyText={t('no_contragents_found') || 'კონტრაგენტები ვერ მოიძებნა'}
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
					loadContragents({ ...filters, page: newPage, bank: getCurrentBank() }); // <-- ensure bank is passed
				}}
			/>
		</div>
	);
};

export default TableContragents;