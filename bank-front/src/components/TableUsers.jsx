import '../assets/css/TableAccounts.css';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserPen, faTrash, faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import SortableTable from './SortableTable';
import defaultInstance from '../api/defaultInstance';
import UserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmModal from './DeleteConfirmModal';

import { fetchUsers } from '../store/userSlice';

import filterStyles from '../assets/css/filter.module.css';
import TableFilter from './TableFilter';

const TableUsers = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const users = useSelector(state => state.user.users);
	const [userModalOpen, setUserModalOpen] = useState(false);
	const [userForm, setUserForm] = useState({
		name: '',
		email: '',
		password: '',
		role: '',
		bank: ''
	});
	const [userError, setUserError] = useState('');
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editUser, setEditUser] = useState(null);
	const [editForm, setEditForm] = useState({
		name: '',
		email: '',
		role: '',
		bank: '',
		password: ''
	});
	const [editError, setEditError] = useState('');
	const [loading, setLoading] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState(null);
	const [deleteError, setDeleteError] = useState('');

	const [filterOpen, setFilterOpen] = useState(false);
	const [filters, setFilters] = useState({ name: '', email: '', role: '', bank: '' });
	const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
	const bankDropdownRef = useRef(null);
	const didFetch = useRef(false);

	const filteredNonSuperAdmins = useMemo(() => users.filter(u => u.role !== 'super_admin'), [users]);
	const bankOptions = useMemo(() => {
		const banks = filteredNonSuperAdmins.map(u => u.bank).filter(Boolean);
		return [...new Set(banks)];
	}, [filteredNonSuperAdmins]);
	const roleOptions = useMemo(() => {
		const roles = filteredNonSuperAdmins.map(u => u.role).filter(Boolean);
		return [...new Set(roles)];
	}, [filteredNonSuperAdmins]);

	const filteredUsers = useMemo(() => {
		let filtered = filteredNonSuperAdmins;
		if (filters.name) {
			filtered = filtered.filter(u =>
				u.name && u.name.toLowerCase().includes(filters.name.toLowerCase())
			);
		}
		if (filters.email) {
			filtered = filtered.filter(u =>
				u.email && u.email.toLowerCase().includes(filters.email.toLowerCase())
			);
		}
		if (filters.role) {
			filtered = filtered.filter(u => u.role === filters.role);
		}
		if (filters.bank) {
			filtered = filtered.filter(u => u.bank === filters.bank);
		}
		return filtered;
	}, [filteredNonSuperAdmins, filters]);

	useEffect(() => {
		if (didFetch.current) return;
		didFetch.current = true;
		setLoading(true);
		dispatch(fetchUsers()).finally(() => setLoading(false));
	}, [dispatch]);

	const handleOpenUserModal = () => setUserModalOpen(true);
	const handleCloseUserModal = () => {
		setUserModalOpen(false);
		setUserForm({ name: '', email: '', password: '', role: '', bank: '' });
		setUserError('');
	};
	const handleUserChange = (e) => {
		setUserForm({ ...userForm, [e.target.name]: e.target.value });
	};
	const handleUserSubmit = async (e) => {
		e.preventDefault();
		if (
			!userForm.name.trim() ||
			!userForm.email.trim() ||
			!userForm.password.trim() ||
			!userForm.role ||
			!userForm.bank
		) {
			setUserError(t('all_fields_required'));
			return;
		}
		try {
			await defaultInstance.post('/users', {
				name: userForm.name,
				email: userForm.email,
				password: userForm.password,
				role: userForm.role,
				bank: userForm.bank
			});
			handleCloseUserModal();
			dispatch(fetchUsers());
		} catch (err) {
			setUserError(t('error_adding'));
		}
	};

	const handleOpenEditModal = (user) => {
		setEditUser(user);
		setEditForm({
			name: user.name || '',
			email: user.email || '',
			role: user.role || '',
			bank: user.bank || '',
			password: ''
		});
		setEditError('');
		setEditModalOpen(true);
	};
	const handleCloseEditModal = () => {
		setEditModalOpen(false);
		setEditUser(null);
		setEditForm({ name: '', email: '', role: '', bank: '', password: '' });
		setEditError('');
	};
	const handleEditChange = (e) => {
		setEditForm({ ...editForm, [e.target.name]: e.target.value });
	};
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		if (!editForm.name.trim() || !editForm.email.trim() || !editForm.role) {
			setEditError(t('all_fields_required'));
			return;
		}
		try {
			await defaultInstance.put(`/users/${editUser.id}`, {
				name: editForm.name,
				email: editForm.email,
				role: editForm.role,
				bank: editForm.bank,
				password: editForm.password
			});
			handleCloseEditModal();
			setUserModalOpen(false);
			dispatch(fetchUsers());
		} catch (err) {
			setEditError(t('error_editing'));
		}
	};

	const handleDeleteUser = (userId) => {
		setDeleteId(userId);
		setDeleteError('');
		setDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			await defaultInstance.delete(`/users/${deleteId}`);
			setDeleteModalOpen(false);
			setDeleteId(null);
			dispatch(fetchUsers());
		} catch (err) {
			setDeleteError(t('error_deleting'));
		}
	};

	const handleFilterChange = (e) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
	};
	const handleFilterReset = () => {
		setFilters({ name: '', email: '', role: '', bank: '' });
	};
	const handleBankSelect = (bank) => {
		setFilters(f => ({ ...f, bank }));
		setBankDropdownOpen(false);
	};
	const handleRoleSelect = (role) => {
		setFilters(f => ({ ...f, role }));
	};

	const columns = [
		{ key: 'name', label: t('name') },
		{ key: 'email', label: t('email') },
		{
			key: 'role',
			label: t('role'),
			render: (value) =>
				value === 'super_admin'
					? 'მთავარი ადმინი'
					: value === 'admin'
						? 'ადმინისტრატორი'
						: value === 'distribution_operator'
							? 'დისტრიბუციის ოპერატორი'
							: value === 'corporate_sales_manager'
								? 'კორპორატიული გაყიდვების მენეჯერი'
								: value
		},
		{ key: 'bank', label: t('bank') },
		{
			key: 'created_at',
			label: t('registration_date'),
			render: (value) => new Date(value).toLocaleString()
		},
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
						<FontAwesomeIcon icon={faUserPen} color="#fff" />
					</button>
					<button
						className="icon-btn icon-btn-delete"
						onClick={() => handleDeleteUser(row.id)}
						title={t('delete_user_confirm')}
					>
						<FontAwesomeIcon icon={faTrash} color="#fff" />
					</button>
				</>
			)
		}
	];

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">{t('users_title')}</h2>
				<div style={{ display: 'flex', gap: 10 }}>
					<button
						style={{
							textAlign: "center",
							textJustify: "center",
							background: "#0173b1",
							color: "#fff",
							border: "none",
							borderRadius: 6,
							padding: "12px 14px",
							cursor: "pointer",
							fontWeight: 500,
						}}
						onClick={handleOpenUserModal}
					>
						<FontAwesomeIcon icon={faUserPlus} color='#fff' fontSize={'18px'} />
					</button>
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
							{ name: 'name', label: t('name'), placeholder: t('name') },
							{ name: 'email', label: t('email'), placeholder: t('email') },
							{
								name: 'role',
								label: t('role'),
								placeholder: t('select_role'),
								type: 'select',
								options: [
									{ value: '', label: t('all') },
									...roleOptions.map(role => ({
										value: role,
										label:
											role === 'super_admin'
												? 'მთავარი ადმინი'
												: role === 'admin'
													? 'ადმინისტრატორი'
													: role === 'distribution_operator'
														? 'დისტრიბუციის ოპერატორი'
														: role === 'corporate_sales_manager'
															? 'კორპორატიული გაყიდვების მენეჯერი'
															: role
									}))
								]
							},
							{
								name: 'bank',
								label: t('bank'),
								placeholder: t('search_by_bank'),
								type: 'bankDropdown'
							}
						]}
						bankOptions={bankOptions}
						bankDropdownOpen={bankDropdownOpen}
						setBankDropdownOpen={setBankDropdownOpen}
						bankDropdownRef={bankDropdownRef}
						onBankSelect={handleBankSelect}
						onRoleSelect={handleRoleSelect}
						t={t}
					/>
				</div>
			)}
			<UserModal
				open={userModalOpen}
				onClose={handleCloseUserModal}
				onSubmit={handleUserSubmit}
				form={userForm}
				onChange={handleUserChange}
				error={userError}
				t={t}
			/>
			<EditUserModal
				open={editModalOpen}
				onClose={handleCloseEditModal}
				onSubmit={handleEditSubmit}
				form={editForm}
				onChange={handleEditChange}
				error={editError}
				t={t}
			/>
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={filteredUsers}
					loading={loading}
					emptyText={t('no_data')}
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
		</div>
	);
};

export default TableUsers;