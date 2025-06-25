import '../assets/css/Header.css';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png'; // Adjust the path as necessary

const Header = () => {
	return (
		<header className="main-header">
			<div className="header-container">
				<div className="left-header">
					<div className="logo-container">
						<img src={logo} alt="Banks Georgia Logo" className="logo" />
					</div>
					<nav className="header-nav">
						<ul className="nav-menu">
							<li className="nav-item">
								<Link to="/statement" className="nav-link">ამონაწერი</Link>
							</li>
							<li className="nav-item">
								<Link to="/contragents" className="nav-link">კონტრაგენტები</Link>
							</li>
							<li className="nav-item">
								<Link to="/users" className="nav-link">მომხმარებლები</Link>
							</li>
						</ul>
					</nav>
				</div>
				<div className="right-header">
					<div className="profile-icon">
						<i className="fas fa-user"></i>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
