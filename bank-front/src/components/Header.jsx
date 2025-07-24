import '../assets/css/Header.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/userSlice';
import defaultInstance from '../api/defaultInstance';
import Modal from './TbcPasswordModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Flag from 'react-world-flags';

const getCurrentVersion = (pathname) => {
	if (pathname.startsWith('/anta')) return 'Anta';
	return 'Gorgia';
};

const Header = () => {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [langDropdownOpen, setLangDropdownOpen] = useState(false);
	const [tbcPwInfo, setTbcPwInfo] = useState({ days_left: null, created_at: null });
	const [tbcPwModalOpen, setTbcPwModalOpen] = useState(false);
	// eslint-disable-next-line
	const [tbcPwLoading, setTbcPwLoading] = useState(false);
	const dropdownRef = useRef(null);
	const langDropdownRef = useRef(null);
	const tbcPwFetchedRef = useRef(false);
	const navigate = useNavigate();
	const location = useLocation();
	const { t, i18n } = useTranslation();
	const currentVersion = getCurrentVersion(location.pathname);
	const dispatch = useDispatch();
	const user = useSelector(state => state.user.user);
	const getBankNameId = (pathname) => pathname.startsWith('/anta') ? 2 : 1;

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
		if (
			user &&
			user.role === 'super_admin' &&
			!tbcPwFetchedRef.current
		) {
			tbcPwFetchedRef.current = true;
			defaultInstance.get('/tbc-password/info').then(res => {
				setTbcPwInfo(res.data);
			});
		}
		// eslint-disable-next-line
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
			// eslint-disable-next-line
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
								{t('tbc_password_change')} ({t('')} {tbcPwInfo.days_left !== null ? tbcPwInfo.days_left : '...'} {t('days')})
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
								{(i18n.language === 'ka') && <Flag code="GE" height="16" style={{ width: 22, objectFit: 'cover' }} />}
								{(i18n.language === 'en') && <Flag code="GB" height="16" style={{ width: 22, objectFit: 'cover' }} />}
								{(i18n.language === 'ru') && <Flag code="RU" height="16" style={{ width: 22, objectFit: 'cover' }} />}
							</span>
							<FontAwesomeIcon
								icon={faChevronDown}
								style={{
									marginLeft: 6,
									fontSize: '0.8em',
									transition: 'transform 0.3s ease',
									transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
									color: '#000',
								}}
							/>
						</button>
						{langDropdownOpen && (
							<ul className="lang-dropdown-list">
								<li>
									<button
										onClick={() => { handleLanguageChange('ka'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'ka' ? 'active' : ''}`}
									>
										<span className="flag-animate closed" style={{ marginRight: 6 }}>
											<Flag code="GE" height="16" style={{ width: 22, objectFit: 'cover' }} />
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
											<Flag code="GB" height="16" style={{ width: 22, objectFit: 'cover' }} />
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
											<Flag code="RU" height="16" style={{ width: 22, objectFit: 'cover' }} />
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
										style={{ color: 'red', borderTop: '1px solid #eee' }}
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
				bankNameId={getBankNameId(location.pathname)}
			/>
		</header>
	);
};

export default Header;
