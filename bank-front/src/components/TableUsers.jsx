import '../assets/css/TableAccounts.css';
import { useState, useEffect } from 'react';
import defaultInstance from '../api/defaultInstance';
import styles from '../assets/css/modal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const TableUsers = () => {
	const { t } = useTranslation();
	const [users, setUsers] = useState([]);
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
		password: ''
	});
	const [editError, setEditError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setLoading(true);
		defaultInstance.get('/users')
			.then(res => {
				setUsers(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [userModalOpen, editModalOpen]);

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
			password: ''
		});
		setEditError('');
		setEditModalOpen(true);
	};
	const handleCloseEditModal = () => {
		setEditModalOpen(false);
		setEditUser(null);
		setEditForm({ name: '', email: '', role: '', password: '' });
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
				password: editForm.password // send empty string if not changing
			});
			handleCloseEditModal();
			setUserModalOpen(false);
			// Refresh users
			setLoading(true);
			const res = await defaultInstance.get('/users');
			setUsers(res.data);
			setLoading(false);
		} catch (err) {
			setEditError(t('error_editing'));
		}
	};

	const handleDeleteUser = async (userId) => {
		if (!window.confirm(t('delete_user_confirm'))) return;
		try {
			await defaultInstance.delete(`/users/${userId}`);
			// Refresh users
			setUsers(users.filter(u => u.id !== userId));
		} catch (err) {
			alert(t('error_deleting'));
		}
	};

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
			{userModalOpen && (
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
							onClick={handleCloseUserModal}
							aria-label="Close"
						>
							&times;
						</button>
						<h3 className={styles.modalTitle}>{t('add_user')}</h3>
						<form onSubmit={handleUserSubmit}>
							<div className={styles.modalFormGroup}>
								<label>{t('name')}</label>
								<input
									type="text"
									name="name"
									value={userForm.name}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								/>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('email')}</label>
								<input
									type="email"
									name="email"
									value={userForm.email}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								/>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('password')}</label>
								<input
									type="password"
									name="password"
									value={userForm.password}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								/>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('role')}</label>
								<select
									name="role"
									value={userForm.role}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								>
									<option value="">{t('select_role')}</option>
									<option value="დისტრიბუციის ოპერატორი">{t('distribution_operator')}</option>
									<option value="კორპორატიული გაყიდვების მენეჯერი">{t('corporate_sales_manager')}</option>
									<option value="ადმინისტრატორი">{t('administrator')}</option>
								</select>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('bank')}</label>
								<select
									name="bank"
									value={userForm.bank}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								>
									<option value="">{t('select_bank')}</option>
									<option value="gorgia">gorgia</option>
									<option value="anta">anta</option>
								</select>
							</div>
							{userError && <div className={styles.modalError}>{userError}</div>}
							<div className={styles.modalActions}>
								<button
									type="button"
									onClick={handleCloseUserModal}
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
			{editModalOpen && (
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
							onClick={handleCloseEditModal}
							aria-label="Close"
						>
							&times;
						</button>
						<h3 className={styles.modalTitle}>{t('edit_user')}</h3>
						<form onSubmit={handleEditSubmit}>
							<div className={styles.modalFormGroup}>
								<label>{t('name')}</label>
								<input
									type="text"
									name="name"
									value={editForm.name}
									onChange={handleEditChange}
									className={styles.modalInput}
									required
								/>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('email')}</label>
								<input
									type="email"
									name="email"
									value={editForm.email}
									onChange={handleEditChange}
									className={styles.modalInput}
									required
								/>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('role')}</label>
								<select
									name="role"
									value={editForm.role}
									onChange={handleEditChange}
									className={styles.modalInput}
									required
								>
									<option value="">{t('select_role')}</option>
									<option value="დისტრიბუციის ოპერატორი">{t('distribution_operator')}</option>
									<option value="კორპორატიული გაყიდვების მენეჯერი">{t('corporate_sales_manager')}</option>
									<option value="ადმინისტრატორი">{t('administrator')}</option>
								</select>
							</div>
							<div className={styles.modalFormGroup}>
								<label>{t('password')}</label>
								<input
									type="password"
									name="password"
									value={editForm.password}
									onChange={handleEditChange}
									className={styles.modalInput}
									placeholder={t('new_password')}
								/>
							</div>
							{editError && <div className={styles.modalError}>{editError}</div>}
							<div className={styles.modalActions}>
								<button
									type="button"
									onClick={handleCloseEditModal}
									className={`${styles.modalButton} ${styles.modalButtonCancel}`}
								>
									{t('cancel')}
								</button>
								<button
									type="submit"
									className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
								>
									{t('save')}
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
							<th>{t('name')}</th>
							<th>{t('email')}</th>
							<th>{t('role')}</th>
							<th>{t('bank')}</th>
							<th>{t('registration_date')}</th>
							<th>{t('actions')}</th>
						</tr>
					</thead>
					<tbody className="table-contragents">
						{loading ? (
							<tr>
								<td colSpan={6}>{t('loading')}</td>
							</tr>
						) : users.length > 0 ? (
							users.map((u, idx) => (
								<tr key={u.id || idx}>
									<td>{u.name}</td>
									<td>{u.email}</td>
									<td>{u.role}</td>
									<td>{u.bank}</td>
									<td>{new Date(u.created_at).toLocaleString()}</td>
									<td>
										<button
											className="icon-btn icon-btn-edit"
											onClick={() => handleOpenEditModal(u)}
											title={t('edit_user')}
										>
											<FontAwesomeIcon icon={faUserPen} color="#fff" />
										</button>
										<button
											className="icon-btn icon-btn-delete"
											onClick={() => handleDeleteUser(u.id)}
											title={t('delete_user_confirm')}
										>
											<FontAwesomeIcon icon={faTrash} color="#fff" />
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={6}>{t('no_data')}</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableUsers;