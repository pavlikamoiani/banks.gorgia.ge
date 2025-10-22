"use client"

import "../assets/css/Header.css"
import { Link, useNavigate, useLocation } from "react-router-dom"
import logo from "../assets/images/logo.png"
import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import { setUser } from "../store/userSlice"
import defaultInstance from "../api/defaultInstance"
import Modal from "./TBCPasswordModal"
import { IoChevronDown, IoPersonCircle, IoWarning, IoTime } from "react-icons/io5"
import { HiOutlineGlobeAlt } from "react-icons/hi"
import Flag from "react-world-flags"

const getCurrentVersion = (pathname) => {
	if (pathname.startsWith("/anta")) return "Anta"
	return "Gorgia"
}

const Header = () => {
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [langDropdownOpen, setLangDropdownOpen] = useState(false)
	const [tbcPwInfo, setTbcPwInfo] = useState({ days_left: null, created_at: null })
	const [tbcPwModalOpen, setTbcPwModalOpen] = useState(false)
	const [tbcPwLoading, setTbcPwLoading] = useState(false)
	const dropdownRef = useRef(null)
	const langDropdownRef = useRef(null)
	const tbcPwFetchedRef = useRef(false)
	const navigate = useNavigate()
	const location = useLocation()
	const { t, i18n } = useTranslation()
	const currentVersion = getCurrentVersion(location.pathname)
	const dispatch = useDispatch()
	const user = useSelector((state) => state.user.user)
	const getBankNameId = (pathname) => (pathname.startsWith("/anta") ? 2 : 1)

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false)
			}
		}
		if (dropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		} else {
			document.removeEventListener("mousedown", handleClickOutside)
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [dropdownOpen])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
				setLangDropdownOpen(false)
			}
		}
		if (langDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [langDropdownOpen])

	useEffect(() => {
		if (user && user.role === "super_admin" && !tbcPwFetchedRef.current) {
			tbcPwFetchedRef.current = true
			defaultInstance.get("/tbc-password/info").then((res) => {
				setTbcPwInfo(res.data)
			})
		}
		// eslint-disable-next-line
	}, [user])

	const handleDropdownClick = (version) => {
		setDropdownOpen(false)
		if (version === "Gorgia") {
			navigate("/gorgia/statement")
		} else if (version === "Anta") {
			navigate("/anta/statement")
		}
	}

	const handleLanguageChange = (lng) => {
		i18n.changeLanguage(lng)
		localStorage.setItem("language", lng)
	}

	const handleLogout = async () => {
		try {
			await defaultInstance.post("/logout")
			// eslint-disable-next-line
		} catch (e) {
			// Ignore errors, proceed with logout
		}
		localStorage.removeItem("authToken")
		localStorage.removeItem("isLoggedIn")
		localStorage.removeItem("userEmail")
		localStorage.removeItem("role")
		localStorage.removeItem("department_id")
		sessionStorage.removeItem("authToken")
		sessionStorage.removeItem("isLoggedIn")
		sessionStorage.removeItem("userEmail")
		sessionStorage.removeItem("role")
		sessionStorage.removeItem("department_id")
		dispatch(setUser(null))
		navigate("/login")
	}

	const handleTbcPwModalOpen = () => setTbcPwModalOpen(true)
	const handleTbcPwModalClose = () => setTbcPwModalOpen(false)

	const handleTbcPwUpdated = () => {
		setTbcPwModalOpen(false)
		setTbcPwLoading(true)
		defaultInstance.get("/tbc-password/info").then((res) => {
			setTbcPwInfo(res.data)
			setTbcPwLoading(false)
		})
	}

	return (
		<header className="header">
			<div className="header-inner">
				<div className="header-left">
					<div
						className="header-logo"
						onClick={() => window.location.reload()}
					>
						<img
							src={logo || "/placeholder.svg"}
							alt="Banks Georgia Logo"
							className="header-logo-img"
						/>
					</div>

					<nav className="header-nav">
						<ul className="header-nav-ul">
							{user && (user.role === "super_admin" || user.bank === "gorgia") && currentVersion === "Gorgia" && (
								<>
									<li>
										<Link
											to="/gorgia/statement"
											className={`header-link${location.pathname === "/gorgia/statement" ? " active" : ""}`}
										>
											{t("statement")}
										</Link>
									</li>
									<li>
										<Link
											to="/gorgia/contragents"
											className={`header-link${location.pathname === "/gorgia/contragents" ? " active" : ""}`}
										>
											{t("contragents")}
										</Link>
									</li>
									{user && (user.role === "super_admin" || user.role === "admin") && (
										<li>
											<Link
												to="/gorgia/users"
												className={`header-link${location.pathname === "/gorgia/users" ? " active" : ""}`}
											>
												{t("users")}
											</Link>
										</li>
									)}
								</>
							)}

							{user && (user.role === "super_admin" || user.bank === "anta") && currentVersion === "Anta" && (
								<>
									<li>
										<Link
											to="/anta/statement"
											className={`header-link${location.pathname === "/anta/statement" ? " active" : ""}`}
										>
											{t("statement")}
										</Link>
									</li>
									<li>
										<Link
											to="/anta/contragents"
											className={`header-link${location.pathname === "/anta/contragents" ? " active" : ""}`}
										>
											{t("contragents")}
										</Link>
									</li>
									{user && (user.role === "super_admin" || user.role === "admin") && (
										<li>
											<Link
												to="/anta/users"
												className={`header-link${location.pathname === "/anta/users" ? " active" : ""}`}
											>
												{t("users")}
											</Link>
										</li>
									)}
								</>
							)}
						</ul>
					</nav>
				</div>

				<div className="header-right">
					{/* TBC Password Button */}
					{user && user.role === "super_admin" && (
						<div
							className={`tbc-pw-btn${tbcPwInfo.days_left !== null && tbcPwInfo.days_left <= 3 ? " critical" : ""}`}
							onClick={handleTbcPwModalOpen}
							title="Click to change TBC password"
						>
							{tbcPwInfo.days_left !== null && tbcPwInfo.days_left <= 3 ? (
								<IoWarning style={{ color: "#dc2626", fontSize: "18px" }} />
							) : (
								<IoTime style={{ color: "#2563eb", fontSize: "18px" }} />
							)}
							<span className={`tbc-pw-text${tbcPwInfo.days_left !== null && tbcPwInfo.days_left <= 3 ? " critical" : " normal"}`}>
								{t("tbc_password_change")} ({tbcPwInfo.days_left !== null ? tbcPwInfo.days_left : "..."} {t("days")})
							</span>
						</div>
					)}

					{/* Language Switcher */}
					<div ref={langDropdownRef} className="lang-switcher">
						<button
							onClick={() => setLangDropdownOpen((open) => !open)}
							className={`lang-btn${langDropdownOpen ? " open" : ""}`}
						>
							<HiOutlineGlobeAlt style={{ fontSize: "16px", color: "#64748b" }} />
							<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
								{i18n.language === "ka" && (
									<Flag code="GE" height="16" style={{ width: 22, objectFit: "cover", borderRadius: "2px" }} />
								)}
								{i18n.language === "en" && (
									<Flag code="GB" height="16" style={{ width: 22, objectFit: "cover", borderRadius: "2px" }} />
								)}
								{i18n.language === "ru" && (
									<Flag code="RU" height="16" style={{ width: 22, objectFit: "cover", borderRadius: "2px" }} />
								)}
								<span>{i18n.language.toUpperCase()}</span>
							</div>
							<IoChevronDown
								style={{
									fontSize: "14px",
									color: "#64748b",
									transition: "transform 0.2s ease",
									transform: langDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
								}}
							/>
						</button>
						{langDropdownOpen && (
							<div className="lang-dropdown">
								{[
									{ code: "ka", flag: "GE", label: "GE" },
									{ code: "en", flag: "GB", label: "EN" },
									{ code: "ru", flag: "RU", label: "RU" },
								].map((lang) => (
									<button
										key={lang.code}
										onClick={() => {
											handleLanguageChange(lang.code)
											setLangDropdownOpen(false)
										}}
										className={`lang-dropdown-btn${i18n.language === lang.code ? " selected" : ""}`}
									>
										<Flag code={lang.flag} height="16" style={{ width: 22, objectFit: "cover", borderRadius: "2px" }} />
										{lang.label}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Profile Dropdown */}
					<div ref={dropdownRef} className="profile-dropdown">
						<button
							onClick={() => setDropdownOpen((open) => !open)}
							className={`profile-btn${dropdownOpen ? " open" : ""}`}
						>
							<IoPersonCircle style={{ fontSize: "24px" }} />
						</button>
						{dropdownOpen && (
							<div className="profile-dropdown-menu">
								{user && user.role === "super_admin" && (
									<>
										<button
											onClick={() => handleDropdownClick("Gorgia")}
											className="profile-dropdown-btn"
										>
											Gorgia
										</button>
										<button
											onClick={() => handleDropdownClick("Anta")}
											className="profile-dropdown-btn border"
										>
											Anta
										</button>
									</>
								)}
								<button
									onClick={handleLogout}
									className="profile-dropdown-btn logout"
								>
									{t("logout")}
								</button>
							</div>
						)}
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
	)
}

export default Header
