import '../assets/css/TableAccounts.css';
import { useState, useEffect } from 'react';
import defaultInstance from '../api/defaultInstance';
import styles from '../assets/css/modal.module.css';

const TableUsers = () => {
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
			setUserError('ყველა ველი სავალდებულოა');
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
			setUserError('შეცდომა დამატებისას');
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
			setEditError('ყველა ველი სავალდებულოა');
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
			setEditError('შეცდომა რედაქტირებისას');
		}
	};

	const handleDeleteUser = async (userId) => {
		if (!window.confirm('ნამდვილად გსურთ მომხმარებლის წაშლა?')) return;
		try {
			await defaultInstance.delete(`/users/${userId}`);
			// Refresh users
			setUsers(users.filter(u => u.id !== userId));
		} catch (err) {
			alert('შეცდომა წაშლისას');
		}
	};

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">მომხმარებლები</h2>
				<button
					style={{
						background: "#0173b1",
						color: "#fff",
						border: "none",
						borderRadius: 6,
						padding: "8px 16px",
						cursor: "pointer",
						fontWeight: 500,
						marginLeft: 12
					}}
					onClick={handleOpenUserModal}
				>
					მომხმარებლის დამატება
				</button>
			</div>
			{userModalOpen && (
				<div
					className={styles.overlay}
					onClick={handleCloseUserModal}
				>
					<div
						className={styles.modal}
						onClick={e => e.stopPropagation()}
					>
						<h3 className={styles.modalTitle}>მომხმარებლის დამატება</h3>
						<form onSubmit={handleUserSubmit}>
							<div className={styles.modalFormGroup}>
								<label>სახელი</label>
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
								<label>მომხმარებლის ელფოსტა</label>
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
								<label>პაროლი</label>
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
								<label>მომხმარებლის როლი</label>
								<select
									name="role"
									value={userForm.role}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								>
									<option value="">აირჩიეთ როლი</option>
									<option value="დისტრიბუციის ოპერატორი">დისტრიბუციის ოპერატორი</option>
									<option value="კორპორატიული გაყიდვების მენეჯერი">კორპორატიული გაყიდვების მენეჯერი</option>
									<option value="ადმინისტრატორი">ადმინისტრატორი</option>
								</select>
							</div>
							<div className={styles.modalFormGroup}>
								<label>დანიშნული ბანკი</label>
								<select
									name="bank"
									value={userForm.bank}
									onChange={handleUserChange}
									className={styles.modalInput}
									required
								>
									<option value="">აირჩიეთ ბანკი</option>
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
									გაუქმება
								</button>
								<button
									type="submit"
									className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
								>
									დამატება
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{editModalOpen && (
				<div
					className={styles.overlay}
					onClick={handleCloseEditModal}
				>
					<div
						className={styles.modal}
						onClick={e => e.stopPropagation()}
					>
						<h3 className={styles.modalTitle}>მომხმარებლის რედაქტირება</h3>
						<form onSubmit={handleEditSubmit}>
							<div className={styles.modalFormGroup}>
								<label>სახელი და გვარი</label>
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
								<label>მომხმარებლის ელფოსტა</label>
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
								<label>მომხმარებლის როლი</label>
								<select
									name="role"
									value={editForm.role}
									onChange={handleEditChange}
									className={styles.modalInput}
									required
								>
									<option value="">აირჩიეთ როლი</option>
									<option value="დისტრიბუციის ოპერატორი">დისტრიბუციის ოპერატორი</option>
									<option value="კორპორატიული გაყიდვების მენეჯერი">კორპორატიული გაყიდვების მენეჯერი</option>
									<option value="ადმინისტრატორი">ადმინისტრატორი</option>
								</select>
							</div>
							<div className={styles.modalFormGroup}>
								<label>პაროლის შეცვლა</label>
								<input
									type="password"
									name="password"
									value={editForm.password}
									onChange={handleEditChange}
									className={styles.modalInput}
									placeholder="ახალი პაროლი (სურვილისამებრ)"
								/>
							</div>
							{editError && <div className={styles.modalError}>{editError}</div>}
							<div className={styles.modalActions}>
								<button
									type="button"
									onClick={handleCloseEditModal}
									className={`${styles.modalButton} ${styles.modalButtonCancel}`}
								>
									გაუქმება
								</button>
								<button
									type="submit"
									className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
								>
									შენახვა
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
							<th>სახელი</th>
							<th>მომხმარებლის ელფოსტა</th>
							<th>მომხმარებლის როლი</th>
							<th>დანიშნული ბანკი</th>
							<th>რეგისტრაციის თარიღი</th>
							<th>ქმედებები</th>
						</tr>
					</thead>
					<tbody className="table-contragents">
						{loading ? (
							<tr>
								<td colSpan={6}>იტვირთება...</td>
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
											style={{
												background: "#f0ad4e",
												color: "#fff",
												border: "none",
												borderRadius: 4,
												padding: "4px 10px",
												marginRight: 6,
												cursor: "pointer"
											}}
											onClick={() => handleOpenEditModal(u)}
										>
											რედაქტირება
										</button>
										<button
											style={{
												background: "#d9534f",
												color: "#fff",
												border: "none",
												borderRadius: 4,
												padding: "4px 10px",
												cursor: "pointer"
											}}
											onClick={() => handleDeleteUser(u.id)}
										>
											წაშლა
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={6}>მონაცემები არ მოიძებნა</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableUsers;