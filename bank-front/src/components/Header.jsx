import '../assets/css/Header.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png'; // Adjust the path as necessary
import { useState, useRef, useEffect } from 'react';
import defaultInstance from '../api/defaultInstance';
import { useTranslation } from 'react-i18next';

const getCurrentVersion = (pathname) => {
	if (pathname.startsWith('/anta')) return 'Anta';
	return 'Gorgia';
};

const Header = () => {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [langDropdownOpen, setLangDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const langDropdownRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();
	const { t, i18n } = useTranslation();

	const currentVersion = getCurrentVersion(location.pathname);

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

	// Close language dropdown on outside click
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
		navigate('/login');
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
							<li className="nav-item">
								<Link
									to={currentVersion === 'Anta' ? "/anta/statement" : "/gorgia/statement"}
									className={`nav-link${(location.pathname === "/gorgia/statement" && currentVersion === "Gorgia") ||
										(location.pathname === "/anta/statement" && currentVersion === "Anta")
										? " active"
										: ""
										}`}
								>
									{t('statement')}
								</Link>
							</li>
							<li className="nav-item">
								<Link
									to={currentVersion === 'Anta' ? "/anta/contragents" : "/gorgia/contragents"}
									className={`nav-link${(location.pathname === "/gorgia/contragents" && currentVersion === "Gorgia") ||
										(location.pathname === "/anta/contragents" && currentVersion === "Anta")
										? " active"
										: ""
										}`}
								>
									{t('contragents')}
								</Link>
							</li>
							<li className="nav-item">
								<Link
									to={currentVersion === 'Anta' ? "/anta/users" : "/gorgia/users"}
									className={`nav-link${(location.pathname === "/gorgia/users" && currentVersion === "Gorgia") ||
										(location.pathname === "/anta/users" && currentVersion === "Anta")
										? " active"
										: ""
										}`}
								>
									{t('users')}
								</Link>
							</li>
						</ul>
					</nav>
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
							<span style={{ fontWeight: 600 }}>
								{i18n.language === 'ka' && 'GE'}
								{i18n.language === 'en' && 'EN'}
								{i18n.language === 'ru' && 'RU'}
							</span>
							<span style={{ fontSize: 12, marginLeft: 2 }}>▼</span>
						</button>
						{langDropdownOpen && (
							<ul className="lang-dropdown-list">
								<li>
									<button
										onClick={() => { handleLanguageChange('ka'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'ka' ? 'active' : ''}`}
									>
										<span role="img" aria-label="Georgian Flag"></span> GE
									</button>
								</li>
								<li>
									<button
										onClick={() => { handleLanguageChange('en'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
									>
										<span role="img" aria-label="UK Flag"></span> EN
									</button>
								</li>
								<li>
									<button
										onClick={() => { handleLanguageChange('ru'); setLangDropdownOpen(false); }}
										className={`lang-btn ${i18n.language === 'ru' ? 'active' : ''}`}
									>
										<span role="img" aria-label="Russian Flag"></span> RU
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
		</header>
	);
};

export default Header;
