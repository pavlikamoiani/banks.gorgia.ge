import React from 'react';
import '../assets/css/Header.css';

const Header = () => {
	return (
		<header className="main-header">
			<div className="header-container">
				<div className="logo-container">
					<img src="/logo.png" alt="Banks Georgia Logo" className="logo" />
				</div>
			</div>
		</header>
	);
};

export default Header;
