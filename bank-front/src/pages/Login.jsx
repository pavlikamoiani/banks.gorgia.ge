import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../assets/css/Login.module.css';
import logo from '../assets/images/logo.png';
import defaultInstance from '../api/defaultInstance';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await defaultInstance.post('/login', { email, password });
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', response.data.user?.email);
      localStorage.setItem('role', response.data.user?.role);
      localStorage.setItem('department_id', response.data.user?.department_id);
      localStorage.setItem('bank', response.data.user?.bank); // save assigned bank

      // Redirect to dashboard by role
      const role = response.data.user?.role;
      const bank = response.data.user?.bank;
      if (role === 'super_admin') {
        navigate('/gorgia/statement');
      } else if (bank === 'gorgia') {
        navigate('/gorgia/statement');
      } else if (bank === 'anta') {
        navigate('/anta/statement');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContainer}>
        <div className={styles.leftContainer}>
          <img src={logo} alt="Logo" />
        </div>
        <div className={styles.rightContainer}>
          <form onSubmit={handleLogin}>
            <b>მეილი</b>
            <input
              type="email"
              name="email"
              placeholder="შეიყვანე მეილი"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <b>პაროლი</b>
            <input
              type="password"
              name="password"
              placeholder="შეიყვანე პაროლი"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit">შესვლა</button>
          </form>
        </div>
      </div>
    </div>
  );
}