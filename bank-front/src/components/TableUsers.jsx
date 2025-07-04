import '../assets/css/TableAccounts.css';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

import SortableTable from './SortableTable';
import defaultInstance from '../api/defaultInstance';
import UserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

// Import Redux actions
import { fetchUsers, setUsers } from '../store/userSlice';

const TableUsers = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const users = useSelector(state => state.user.users); // users from redux
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

	useEffect(() => {
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
			dispatch(fetchUsers()); // fetch after add
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
			dispatch(fetchUsers()); // fetch after edit
		} catch (err) {
			setEditError(t('error_editing'));
		}
	};

	const handleDeleteUser = async (userId) => {
		if (!window.confirm(t('delete_user_confirm'))) return;
		try {
			await defaultInstance.delete(`/users/${userId}`);
			dispatch(fetchUsers()); // fetch after delete
		} catch (err) {
			alert(t('error_deleting'));
		}
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
			</div>
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
					data={users}
					loading={loading}
					emptyText={t('no_data')}
				/>
			</div>
		</div>
	);
};

export default TableUsers;