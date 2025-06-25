import '../assets/css/Header.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png'; // Adjust the path as necessary
import { useState, useRef, useEffect } from 'react';

const getCurrentVersion = (pathname) => {
	if (pathname.startsWith('/anta')) return 'Anta';
	return 'Gorgia';
};

const Header = () => {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();

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

	const handleDropdownClick = (version) => {
		setDropdownOpen(false);
		if (version === 'Gorgia') {
			navigate('/gorgia/statement');
		} else if (version === 'Anta') {
			navigate('/anta/statement');
		}
	};

	return (
		<header className="main-header">
			<div className="header-container">
				<div className="left-header">
					<div className="logo-container">
						<img src={logo} alt="Banks Georgia Logo" className="logo" />
					</div>
					{/* <span className="current-version" style={{
						marginLeft: 16,
						fontWeight: 700,
						fontSize: 18,
						color: '#0173b1'
					}}>
						{currentVersion}
					</span> */}
					<nav className="header-nav">
						<ul className="nav-menu">
							<li className="nav-item">
								<Link to={currentVersion === 'Anta' ? "/anta/statement" : "/gorgia/statement"} className="nav-link">ამონაწერი</Link>
							</li>
							<li className="nav-item">
								<Link to={currentVersion === 'Anta' ? "/anta/contragents" : "/gorgia/contragents"} className="nav-link">კონტრაგენტები</Link>
							</li>
							<li className="nav-item">
								<Link to={currentVersion === 'Anta' ? "/anta/users" : "/gorgia/users"} className="nav-link">მომხმარებლები</Link>
							</li>
						</ul>
					</nav>
				</div>
				<div className="right-header" ref={dropdownRef}>
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
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
