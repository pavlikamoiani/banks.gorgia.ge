import styles from '../assets/css/modal.module.css';
import { useState } from 'react';
import defaultInstance from '../api/defaultInstance';

const TbcPasswordModal = ({ open, onClose, onUpdated }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await defaultInstance.post('/tbc-password/update', { password });
            setSuccess(true);
            setPassword('');
            if (onUpdated) onUpdated();
        } catch (err) {
            setError('შეცდომა პაროლის განახლებაში');
        }
        setLoading(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button
                    type="button"
                    className={styles.modalClose}
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <h3 className={styles.modalTitle}>TBC-ის პაროლის შეცვლა</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalFormGroup}>
                        <label>ახალი პაროლი</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={styles.modalInput}
                            required
                        />
                    </div>
                    {error && <div className={styles.modalError}>{error}</div>}
                    {success && <div style={{ color: 'green', marginBottom: 10 }}>პაროლი წარმატებით განახლდა</div>}
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                            disabled={loading}
                        >
                            გაუქმება
                        </button>
                        <button
                            type="submit"
                            className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
                            disabled={loading}
                        >
                            {loading ? 'იტვირთება...' : 'განახლება'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TbcPasswordModal;
