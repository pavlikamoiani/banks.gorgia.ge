import '../assets/css/Header.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/userSlice';
import defaultInstance from '../api/defaultInstance';
import Modal from './TbcPasswordModal';

const getCurrentVersion = (pathname) => {
	if (pathname.startsWith('/anta')) return 'Anta';
	return 'Gorgia';
};

const Header = () => {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [langDropdownOpen, setLangDropdownOpen] = useState(false);
	const [tbcPwInfo, setTbcPwInfo] = useState({ days_left: null, created_at: null });
	const [tbcPwModalOpen, setTbcPwModalOpen] = useState(false);
	const [tbcPwLoading, setTbcPwLoading] = useState(false);
	const dropdownRef = useRef(null);
	const langDropdownRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();
	const { t, i18n } = useTranslation();
	const currentVersion = getCurrentVersion(location.pathname);
	const dispatch = useDispatch();
	const user = useSelector(state => state.user.user);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false);
			}
		};
		if (dropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [dropdownOpen]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
				setLangDropdownOpen(false);
			}
		};
		if (langDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [langDropdownOpen]);

	useEffect(() => {
		if (user && user.role === 'super_admin') {
			defaultInstance.get('/tbc-password/info').then(res => {
				setTbcPwInfo(res.data);
			});
		}
	}, [user]);

	const handleDropdownClick = (version) => {
		setDropdownOpen(false);
		if (version === 'Gorgia') {
			navigate('/gorgia/statement');
		} else if (version === 'Anta') {
			navigate('/anta/statement');
		}
	};

	const handleLanguageChange = (lng) => {
		i18n.changeLanguage(lng);
		localStorage.setItem('language', lng);
	};

	const handleLogout = async () => {
		try {
			await defaultInstance.post('/logout');
		} catch (e) {
			// Ignore errors, proceed with logout
		}
		localStorage.removeItem('authToken');
		localStorage.removeItem('isLoggedIn');
		localStorage.removeItem('userEmail');
		localStorage.removeItem('role');
		localStorage.removeItem('department_id');
		sessionStorage.removeItem('authToken');
		sessionStorage.removeItem('isLoggedIn');
		sessionStorage.removeItem('userEmail');
		sessionStorage.removeItem('role');
		sessionStorage.removeItem('department_id');
		dispatch(setUser(null));
		navigate('/login');
	};

	const handleTbcPwModalOpen = () => setTbcPwModalOpen(true);
	const handleTbcPwModalClose = () => setTbcPwModalOpen(false);

	const handleTbcPwUpdated = () => {
		setTbcPwModalOpen(false);
		setTbcPwLoading(true);
		defaultInstance.get('/tbc-password/info').then(res => {
			setTbcPwInfo(res.data);
			setTbcPwLoading(false);
		});
	};

	return (
		<header className="main-header">
			<div className="header-container">
				<div className="left-header">
					<div className="logo-container">
						<img src={logo} alt="Banks Georgia Logo" className="logo" onClick={() => window.location.reload()} />
					</div>
					<nav className="header-nav">
						<ul className="nav-menu">
							{user && (user.role === 'super_admin' || user.bank === 'gorgia') && currentVersion === 'Gorgia' && (
								<>
									<li className="nav-item">
										<Link
											to="/gorgia/statement"
											className={`nav-link${location.pathname === "/gorgia/statement" ? " active" : ""}`}
										>
											{t('statement')}
										</Link>
									</li>
									<li className="nav-item">
										<Link
											to="/gorgia/contragents"
											className={`nav-link${location.pathname === "/gorgia/contragents" ? " active" : ""}`}
										>
											{t('contragents')}
										</Link>
									</li>
									{user && (user.role === 'super_admin' || user.role === "admin") && (
										<li className="nav-item">
											<Link
												to="/gorgia/users"
												className={`nav-link${location.pathname === "/gorgia/users" ? " active" : ""}`}
											>
												{t('users')}
											</Link>
										</li>
									)}

								</>
							)}

							{user && (user.role === 'super_admin' || user.bank === 'anta') && currentVersion === 'Anta' && (
								<>
									<li className="nav-item">
										<Link
											to="/anta/statement"
											className={`nav-link${location.pathname === "/anta/statement" ? " active" : ""}`}
										>
											{t('statement')}
										</Link>
									</li>
									<li className="nav-item">
										<Link
											to="/anta/contragents"
											className={`nav-link${location.pathname === "/anta/contragents" ? " active" : ""}`}
										>
											{t('contragents')}
										</Link>
									</li>
									{user && (user.role === 'super_admin' || user.role === "admin") && (
										<li className="nav-item">
											<Link
												to="/anta/users"
												className={`nav-link${location.pathname === "/anta/users" ? " active" : ""}`}
											>
												{t('users')}
											</Link>
										</li>
									)}
								</>
							)}
						</ul>
					</nav>
				</div>
				<div className="center-header">
					{user && (user.role === 'super_admin') && (
						<div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
							<p
								className={
									tbcPwInfo.days_left !== null && tbcPwInfo.days_left <= 3
										? "blinking-warning"
										: ""
								}
								style={{
									color:
										tbcPwInfo.days_left !== null && tbcPwInfo.days_left <= 3
											? 'red'
											: '#0173b1',
									fontWeight: 700,
									cursor: 'pointer',
									margin: 0,
								}}
								onClick={handleTbcPwModalOpen}
								title="Click to change TBC password"
							>
								TBC-ის პაროლის შეცვლა (დარჩა {tbcPwInfo.days_left !== null ? tbcPwInfo.days_left : '...'} დღე)
							</p>
						</div>
					)}
				</div>
				<div className="right-header">
					<div
						className="language-switcher"
						ref={langDropdownRef}
						style={{ position: 'relative', marginRight: '15px' }}
					>
						<button
							className="lang-btn"
							onClick={() => setLangDropdownOpen((open) => !open)}
							style={{ display: 'flex', alignItems: 'center', gap: 6 }}
						>
							<span
								className={`flag-animate${langDropdownOpen ? ' open' : ' closed'}`}
								style={{ fontWeight: 600 }}
							>
								{(i18n.language === 'ka') && (
									<svg width="22" height="16" viewBox="0 0 22 16">
										<rect width="22" height="16" fill="#fff" />
										<rect x="9" width="4" height="16" fill="#e8112d" />
										<rect y="6" width="22" height="4" fill="#e8112d" />
										<rect x="2" y="2" width="2" height="2" fill="#e8112d" />
										<rect x="18" y="2" width="2" height="2" fill="#e8112d" />
										<rect x="2" y="12" width="2" height="2" fill="#e8112d" />
										<rect x="18" y="12" width="2" height="2" fill="#e8112d" />
									</svg>
								)}
								{(i18n.language === 'en') && (
									<svg width="22" height="16" viewBox="0 0 22 16">
										<rect width="22" height="16" fill="#012169" />
										<polygon points="0,0 22,16 22,14.5 2.5,0 0,0" fill="#fff" />
										<polygon points="22,0 0,16 0,14.5 19.5,0 22,0" fill="#fff" />
										<rect x="9" width="4" height="16" fill="#fff" />
										<rect y="6" width="22" height="4" fill="#fff" />
										<rect x="10" width="2" height="16" fill="#c8102e" />
										<rect y="7" width="22" height="2" fill="#c8102e" />
										<polygon points="0,0 9,6 10,6 0,0" fill="#c8102e" />
										<polygon points="22,0 13,6 12,6 22,0" fill="#c8102e" />
										<polygon points="0,16 9,10 10,10 0,16" fill="#c8102e" />
										<polygon points="22,16 13,10 12,10 22,16" fill="#c8102e" />
									</svg>
								)}
								{(i18n.language === 'ru') && (
									<svg width="22" height="16" viewBox="0 0 22 16">
										<rect width="22" height="16" fill="#fff" />
										<rect y="5.33" width="22" height="5.33" fill="#0033a0" />
										<rect y="10.66" width="22" height="5.34" fill="#d52b1e" />
									</svg>
								)}
							</span>
							<span style={{ fontSize: 12, marginLeft: 2, transition: 'transform 0.3s', display: 'inline-block', transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#000' }}>▼</span>
						</button>
						{langDropdownOpen && (
							<ul className="lang-dropdown-list">
								<li>
									<button
										onClick={() => { handleLanguageChange('ka'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'ka' ? 'active' : ''}`}
									>
										<span className="flag-animate closed" style={{ marginRight: 6 }}>
											<svg width="22" height="16" viewBox="0 0 22 16">
												<rect width="22" height="16" fill="#fff" />
												<rect x="9" width="4" height="16" fill="#e8112d" />
												<rect y="6" width="22" height="4" fill="#e8112d" />
												<rect x="2" y="2" width="2" height="2" fill="#e8112d" />
												<rect x="18" y="2" width="2" height="2" fill="#e8112d" />
												<rect x="2" y="12" width="2" height="2" fill="#e8112d" />
												<rect x="18" y="12" width="2" height="2" fill="#e8112d" />
											</svg>
										</span>
										GE
									</button>
								</li>
								<li>
									<button
										onClick={() => { handleLanguageChange('en'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
									>
										<span className="flag-animate closed" style={{ marginRight: 6 }}>
											<svg width="22" height="16" viewBox="0 0 22 16">
												<rect width="22" height="16" fill="#012169" />
												<polygon points="0,0 22,16 22,14.5 2.5,0 0,0" fill="#fff" />
												<polygon points="22,0 0,16 0,14.5 19.5,0 22,0" fill="#fff" />
												<rect x="9" width="4" height="16" fill="#fff" />
												<rect y="6" width="22" height="4" fill="#fff" />
												<rect x="10" width="2" height="16" fill="#c8102e" />
												<rect y="7" width="22" height="2" fill="#c8102e" />
												<polygon points="0,0 9,6 10,6 0,0" fill="#c8102e" />
												<polygon points="22,0 13,6 12,6 22,0" fill="#c8102e" />
												<polygon points="0,16 9,10 10,10 0,16" fill="#c8102e" />
												<polygon points="22,16 13,10 12,10 22,16" fill="#c8102e" />
											</svg>
										</span>
										EN
									</button>
								</li>
								<li>
									<button
										onClick={() => { handleLanguageChange('ru'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'ru' ? 'active' : ''}`}
									>
										<span className="flag-animate closed" style={{ marginRight: 6 }}>
											<svg width="22" height="16" viewBox="0 0 22 16">
												<rect width="22" height="16" fill="#fff" />
												<rect y="5.33" width="22" height="5.33" fill="#0033a0" />
												<rect y="10.66" width="22" height="5.34" fill="#d52b1e" />
											</svg>
										</span>
										RU
									</button>
								</li>
							</ul>
						)}
					</div>
					<div ref={dropdownRef} style={{ marginLeft: '15px' }}>
						<div
							className="profile-icon"
							onClick={() => setDropdownOpen((open) => !open)}
							tabIndex={0}
							style={{ position: 'relative' }}
						>
							<i className="fas fa-user"></i>
							{dropdownOpen && (
								<div className="profile-dropdown">
									{user && user.role === 'super_admin' && (
										<>
											<div
												className="profile-dropdown-item"
												onClick={() => handleDropdownClick('Gorgia')}
											>
												Gorgia
											</div>
											<div
												className="profile-dropdown-item"
												onClick={() => handleDropdownClick('Anta')}
											>
												Anta
											</div>
										</>
									)}
									<div
										className="profile-dropdown-item"
										onClick={handleLogout}
										style={{ color: 'red', borderTop: '1px solid #eee', marginTop: 4 }}
									>
										{t('logout')}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<Modal
				open={tbcPwModalOpen}
				onClose={handleTbcPwModalClose}
				onUpdated={handleTbcPwUpdated}
			/>
		</header>
	);
};

export default Header;
