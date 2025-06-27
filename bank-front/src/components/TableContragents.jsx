import '../assets/css/TableAccounts.css';
import { useState, useEffect } from 'react';
import defaultInstance from '../api/defaultInstance';
import styles from '../assets/css/modal.module.css'; 

const TableContragents = () => {
	const [contragents, setContragents] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ name: '', identification_code: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	let company = '';
	if (typeof window !== "undefined") {
		if (window.location.pathname.startsWith('/anta')) company = 'anta';
		else company = 'gorgia';
	}

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

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">კონტრაგენტები</h2>
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
					კონტრაგენტის დამატება
				</button>
			</div>
			{modalOpen && (
				<div
					className={styles.overlay}
					onClick={handleCloseModal}
				>
					<div
						className={styles.modal}
						onClick={e => e.stopPropagation()}
					>
						<h3 className={styles.modalTitle}>კონტრაგენტის დამატება</h3>
						<form onSubmit={handleSubmit}>
							<div className={styles.modalFormGroup}>
								<label>დასახელება</label>
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
								<label>საიდენფიკაციო კოდი</label>
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
			<div className="table-wrapper">
				<table className="accounts-table">
					<thead>
						<tr>
							<th>დასახელება</th>
							<th>საიდენფიკაციო კოდი</th>
							<th>რეგისტრაციის თარიღი</th>
						</tr>
					</thead>
					<tbody className="table-contragents">
						{loading ? (
							<tr>
								<td colSpan={3}>იტვირთება...</td>
							</tr>
						) : contragents.length > 0 ? (
							contragents.map((c, idx) => (
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