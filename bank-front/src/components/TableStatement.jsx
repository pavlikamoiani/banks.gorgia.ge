import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import defaultInstance from '../api/defaultInstance';
import Pagination from './Pagination';
import TableFilter from './TableFilter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark, faBolt, faChevronDown, } from '@fortawesome/free-solid-svg-icons';
import { MdSync } from "react-icons/md";
import { FaTableColumns } from "react-icons/fa6";
import filterStyles from '../assets/css/filter.module.css';
import tableStatementStyles from '../assets/css/TableStatement.module.css';
import SplitStatementTable from './SplitStatementTable';

const MAX_PURPOSE_LENGTH = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const BANK_TYPE_MAP = {
	1: 'სს "თბს ბანკი"',
	2: 'სს "საქართველოს ბანკი"'
};

const INTERLEAVE_CHUNK_SIZE = 3;

function interleaveByBank(rows, chunkSize = INTERLEAVE_CHUNK_SIZE) {
	const tbcRows = rows.filter(r => r.bank === 'სს "თბს ბანკი"');
	const bogRows = rows.filter(r => r.bank === 'სს "საქართველოს ბანკი"');
	const result = [];
	let tbcIdx = 0, bogIdx = 0;
	while (tbcIdx < tbcRows.length || bogIdx < bogRows.length) {
		for (let i = 0; i < chunkSize && tbcIdx < tbcRows.length; i++, tbcIdx++) {
			result.push(tbcRows[tbcIdx]);
		}
		for (let i = 0; i < chunkSize && bogIdx < bogRows.length; i++, bogIdx++) {
			result.push(bogRows[bogIdx]);
		}
	}
	return result;
}

const TableStatement = () => {
	const { t } = useTranslation();
	const location = useLocation();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
	const pageSizeDropdownRef = useRef(null);
	const [expandedRows, setExpandedRows] = useState({});

	const [filters, setFilters] = useState({
		contragent: '',
		bank: '',
		amount: '',
		transferDate: '',
		purpose: '',
		startDate: '',
		endDate: '',
		installmentOnly: false,
		transfersOnly: false
	});
	const [pendingFilters, setPendingFilters] = useState({
		contragent: '',
		bank: '',
		amount: '',
		transferDate: '',
		purpose: '',
		startDate: '',
		endDate: '',
		installmentOnly: false,
		transfersOnly: false
	});
	const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
	const bankDropdownRef = useRef(null);
	const [dbLoading, setDbLoading] = useState(false);

	const [liveMode, setLiveMode] = useState(false);
	const [liveBankDropdownOpen, setLiveBankDropdownOpen] = useState(false);
	const [selectedLiveBank, setSelectedLiveBank] = useState(null);
	const liveBankDropdownRef = useRef(null);

	const [dbData, setDbData] = useState([]);
	const bankOptions = useMemo(() => {
		const setBanks = new Set();
		(data || []).forEach(row => {
			if (row.bank) {
				setBanks.add(row.bank);
			}
		});
		return Array.from(setBanks);
	}, [data]);

	const currentBank = useMemo(() => {
		if (location.pathname.startsWith('/anta')) return 'anta';
		return 'gorgia';
	}, [location.pathname]);

	const [modalOpen, setModalOpen] = useState(false);
	const [selectedTransaction, setSelectedTransaction] = useState(null);

	const handleAmountClick = (row, event) => {
		event.stopPropagation();
		setSelectedTransaction(row);
		setModalOpen(true); // <-- open modal instead of popup
	};

	const closePopup = () => {
		setSelectedTransaction(null);
		setModalOpen(false); // <-- close modal
	};

	const columns = useMemo(() => {
		const baseColumns = [
			{
				key: 'contragent', label: t('contragent'),
				render: (value) => {
					if (value === 'ტერმინალით გადახდა') {
						return <span style={{ color: '#0173b1' }}>{value}</span>;
					}
					return value;
				}
			},
			{
				key: 'bank',
				label: t('bank'),
				render: (value, row) => {
					if (row.bank) return row.bank;
					if (row.bank_id === 1) return 'Gorgia';
					if (row.bank_id === 2) return 'Anta';
					return '-';
				}
			},
			{
				key: 'amount',
				label: t('amount'),
				render: (value, row) => {
					// Remove all styles for main table
					if (filters.transfersOnly) {
						const isExchange = (row.purpose || row.description || '').includes('გაცვლითი ოპერაცია');
						if (isExchange) {
							return (
								<span>
									<MdSync />
									{value}
								</span>
							);
						}
						return (
							<span>
								- {value}
							</span>
						);
					}
					return value;
				}
			},
			{ key: 'transferDate', label: t('transferDate') },
			{
				key: 'purpose',
				label: t('purpose'),
				render: (value, row) => {
					if (!value) return '';
					const isExpanded = expandedRows[row.id];
					if (value.length <= MAX_PURPOSE_LENGTH) return value;
					return (
						<span style={{ display: 'inline-block', maxWidth: 350, verticalAlign: 'middle', wordBreak: 'break-word' }}>
							{isExpanded ? (
								<>
									<span>{value}</span>
									<button className={tableStatementStyles.showLessBtn}
										onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: false }))}
									>
										{t('show_less')}
									</button>
								</>
							) : (
								<>
									<span>{value.slice(0, MAX_PURPOSE_LENGTH)}...</span>
									<button className={tableStatementStyles.showoreBtn}
										onClick={() => setExpandedRows(prev => ({ ...prev, [row.id]: true }))}
									>
										{t('show_more')}
									</button>
								</>
							)}
						</span>
					);
				}
			}
		];
		if (!liveMode) {
			baseColumns.push({ key: 'syncDate', label: t('syncDate') });
		}
		return baseColumns;
		// eslint-disable-next-line
	}, [t, expandedRows, liveMode, filters.transfersOnly]);

	const splitColumns = useMemo(() => [
		{
			key: 'bank',
			label: 'დანიშნული ბანკი',
			render: (value, row) => (
				<div>
					{value}
					<br />
					<small style={{ color: '#888', fontSize: '0.95em' }}>
						{row.transferDate}
					</small>
				</div>
			)
		},
		{
			key: 'amount',
			label: 'თანხა',
			render: (value, row) => {
				const isExchange = (row.purpose || row.description || '').includes('გაცვლითი ოპერაცია');
				let cellContent;
				if (row._isLeft) {
					if (isExchange) {
						cellContent = (
							<span style={{ color: '#0173b1', display: 'flex', alignItems: 'center', gap: 5 }}>
								<MdSync />
								{value}
							</span>
						);
					} else {
						cellContent = (
							<span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
								- {value}
							</span>
						);
					}
				} else {
					cellContent = value;
				}
				return (
					<span
						style={{ cursor: 'pointer' }}
						onClick={e => handleAmountClick(row, e)}
						title="დეტალური ინფორმაცია"
					>
						{cellContent}
					</span>
				);
			}
		}
	], []);

	const [filterOpen, setFilterOpen] = useState(false);

	const getEndpoint = () => {
		if (currentBank === 'anta') return '/anta-transactions';
		return '/gorgia-transactions';
	};

	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		pageSize: PAGE_SIZE_OPTIONS[0],
		totalPages: 0
	});
	const [livePagination, setLivePagination] = useState({
		total: 0,
		page: 1,
		pageSize: PAGE_SIZE_OPTIONS[0],
		totalPages: 0
	});

	const loadDbData = async (filterParams = {}) => {
		setDbLoading(true);
		setError(null);

		try {
			const params = {
				...filterParams,
				bank: filterParams.bank || '',
				page: filterParams.page || page,
				pageSize: filterParams.pageSize || pageSize,
				installmentOnly: filterParams.installmentOnly || false,
				transfersOnly: filterParams.transfersOnly || false
			};
			const endpoint = getEndpoint();
			const response = await defaultInstance.get(endpoint, { params });

			const responseDataArray = Array.isArray(response.data?.data) ? response.data.data : [];

			if (response.data && response.data.pagination) {
				const formattedData = responseDataArray.map((item, idx) => ({
					id: `${item.bank_id === 1 ? 'tbc' : 'bog'}-${item.id || idx + 1}`,
					contragent: item.sender_name || 'ტერმინალით გადახდა',
					bank: BANK_TYPE_MAP[item.bank_type] || BANK_TYPE_MAP[item.bank_id] || '-',
					amount: (item.amount ?? 0) + ' ₾',
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.description || '-',
					syncDate: item.created_at
						? item.created_at.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
						: '-'
				}));
				const interleavedData = interleaveByBank(formattedData);
				setData(interleavedData);
				setDbData(interleavedData);
				setPagination(response.data.pagination);
				setPage(response.data.pagination.page);
			} else {
				let combinedRows = [];
				if (Array.isArray(response.data)) {
					combinedRows = response.data.map((item, idx) => ({
						id: `${item.bank_id === 1 ? 'tbc' : 'bog'}-${item.id || idx + 1}`,
						contragent: item.sender_name || 'ტერმინალით გადახდა',
						bank: BANK_TYPE_MAP[item.bank_type] || BANK_TYPE_MAP[item.bank_id] || '-',
						amount: (item.amount ?? 0) + ' ₾',
						transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
						purpose: item.description || '-',
						syncDate: item.created_at
							? item.created_at.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
							: '-'
					}));
				}
				const interleavedRows = interleaveByBank(combinedRows);
				setData(interleavedRows);
				setDbData(interleavedRows);
			}
		} catch (err) {
			console.error("Error loading DB transactions:", err);
		} finally {
			setDbLoading(false);
		}
	};

	useEffect(() => {
		if (!liveMode) {
			loadDbData(filters);
		}
		// eslint-disable-next-line
	}, [filters, currentBank, liveMode]);

	const handleFilterChange = (e) => {
		setPendingFilters({ ...pendingFilters, [e.target.name]: e.target.value });
	};

	const loadLiveData = async (bankType, page = 1, pageSize = PAGE_SIZE_OPTIONS[0]) => {
		if (!bankType) return;

		setLoading(true);
		setError(null);
		try {
			const params = {
				...filters,
				bank: currentBank,
				bankType: bankType,
				page,
				pageSize,
				installmentOnly: filters.installmentOnly || false,
				transfersOnly: filters.transfersOnly || false
			};
			let endpoint;
			if (bankType === 'BOG') {
				endpoint = '/bog/todayactivities';
			} else if (bankType === 'TBC') {
				endpoint = '/tbc/todayactivities';
			}
			const resp = await defaultInstance.get(endpoint, { params });
			const rows = (resp.data?.data || []).map((item, idx) => ({
				id: item.Id || item.DocKey || idx + 1,
				contragent: item?.Sender?.Name || 'ტერმინალით გადახდა',
				bank: item?.Sender?.BankName || 'სს "საქართველოს ბანკი"',
				bank_id: currentBank === 'anta' ? 2 : 1,
				amount: (item.Amount ?? 0) + ' ₾',
				transferDate: item.PostDate ? item.PostDate.slice(0, 10) : '-',
				purpose: item.EntryComment || item.EntryCommentEn || '-',
				syncDate: item.syncDate || '-',
			}));
			const interleavedRows = interleaveByBank(rows);
			setData(interleavedRows);
			setDbData(interleavedRows);
			setLivePagination({
				total: rows.length,
				page,
				pageSize,
				totalPages: Math.ceil(rows.length / pageSize)
			});
			setPage(page);
		} catch (error) {
			console.error("Error loading live data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectLiveBank = (bankType) => {
		setSelectedLiveBank(bankType);
		setLiveMode(true);
		setLiveBankDropdownOpen(false);
		setPage(1);
		setLivePagination(prev => ({
			...prev,
			page: 1
		}));
		loadLiveData(bankType, 1, livePagination.pageSize);
	};

	const handleApplyFilters = () => {
		if (liveMode && selectedLiveBank) {
			const { startDate, endDate, ...rest } = pendingFilters;
			setFilters(rest);
			setPendingFilters(rest);
			setPage(1);
			setLivePagination(prev => ({
				...prev,
				page: 1
			}));
			loadLiveData(selectedLiveBank, 1, livePagination.pageSize);
		} else {
			setFilters({ ...pendingFilters });
			setPage(1);
			loadDbData({ ...pendingFilters });
		}
	};

	const handleFilterReset = () => {
		const resetFilters = {
			contragent: '',
			bank: '',
			amount: '',
			transferDate: '',
			purpose: '',
			startDate: '',
			endDate: ''
		};
		if (liveMode && selectedLiveBank) {
			const { startDate, endDate, ...rest } = resetFilters;
			setFilters(rest);
			setPendingFilters(rest);
			setPage(1);
			setLivePagination(prev => ({
				...prev,
				page: 1
			}));
			loadLiveData(selectedLiveBank, 1, livePagination.pageSize);
		} else {
			setFilters(resetFilters);
			setPendingFilters(resetFilters);
			setPage(1);
		}
	};

	const handleExitLiveMode = () => {
		setLiveMode(false);
		setSelectedLiveBank(null);
		setPage(1);
		setLivePagination({
			total: 0,
			page: 1,
			pageSize: PAGE_SIZE_OPTIONS[0],
			totalPages: 0
		});
		loadDbData(filters);
	};

	const handleBankSelect = (bank) => {
		setPendingFilters(f => ({ ...f, bank }));
		setBankDropdownOpen(false);
	};

	useEffect(() => {
		if (!liveBankDropdownOpen) return;
		const handler = (e) => {
			if (liveBankDropdownRef.current && !liveBankDropdownRef.current.contains(e.target)) {
				setLiveBankDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [liveBankDropdownOpen]);

	useEffect(() => {
		if (!bankDropdownOpen) return;
		const handler = (e) => {
			if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target)) {
				setBankDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [bankDropdownOpen]);

	const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

	const sortedData = useMemo(() => {
		let base = dbData;
		if (liveMode) base = data;
		if (!sortConfig.key) return base;
		const sorted = [...base].sort((a, b) => {
			let aValue = a[sortConfig.key];
			let bValue = b[sortConfig.key];

			if (sortConfig.key === 'amount') {
				const parseAmount = val => {
					if (typeof val === 'number') return val;
					if (typeof val === 'string') {
						const num = parseFloat(val.replace(/[^\d.-]/g, ''));
						return isNaN(num) ? 0 : num;
					}
					return 0;
				};
				aValue = parseAmount(aValue);
				bValue = parseAmount(bValue);
				if (sortConfig.direction === 'asc') {
					return bValue - aValue;
				} else {
					return aValue - bValue;
				}
			}

			if (aValue === undefined || bValue === undefined) return 0;
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
			}
			const aStr = String(aValue).toLowerCase();
			const bStr = String(bValue).toLowerCase();
			if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
		return sorted;
	}, [dbData, data, liveMode, sortConfig]);

	const filteredData = useMemo(() => {
		let base = sortedData;
		if (filters.installmentOnly) {
			base = base.filter(row =>
				(row.purpose || row.description || '').toLowerCase().includes('განვსაქონლის') ||
				(row.purpose || row.description || '').toLowerCase().includes('განაწილება')
			);
		}
		if (filters.transfersOnly) {
			base = base.filter(row =>
				(row.contragent || row.contragent || '').toLowerCase().includes('შპს გორგია')
			);
		}
		return base;
	}, [sortedData, filters.installmentOnly, filters.transfersOnly]);

	const pagedData = useMemo(() => {
		if (liveMode) {
			const startIdx = (livePagination.page - 1) * livePagination.pageSize;
			const endIdx = startIdx + livePagination.pageSize;
			return Array.isArray(data) ? data.slice(startIdx, endIdx) : [];
		}
		if (pagination.total > 0) {
			return Array.isArray(data) ? data : [];
		}
		return Array.isArray(data) ? data.slice((page - 1) * pageSize, page * pageSize) : [];
	}, [liveMode, data, livePagination, pagination, page, pageSize]);

	useEffect(() => {
		if (!pageSizeDropdownOpen) return;
		const handler = (e) => {
			if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(e.target)) {
				setPageSizeDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [pageSizeDropdownOpen]);

	const handleInstallmentOnlyChange = () => {
		const newValue = !filters.installmentOnly;
		if (newValue && filters.transfersOnly) {
			toast.warning('გადარიცხვები და განვადება ერთად შეუძლებელია!', {
				position: 'bottom-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				style: { background: '#0173b1', color: '#fff' }
			});
			return;
		}
		const newFilters = {
			...filters,
			installmentOnly: newValue
		};
		setFilters(newFilters);
		setPendingFilters(newFilters);

		if (liveMode && selectedLiveBank) {
			loadLiveData(selectedLiveBank, 1, livePagination.pageSize);
		} else {
			setPage(1);
			loadDbData({ ...newFilters, page: 1 });
		}
	};

	const handleTransfersOnlyChange = () => {
		const newValue = !filters.transfersOnly;
		if (newValue && filters.installmentOnly) {
			toast.warning('გადარიცხვები და განვადება ერთად შეუძლებელია!', {
				position: 'bottom-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				style: { background: '#0173b1', color: '#fff' }
			});
			return;
		}
		const newFilters = {
			...filters,
			transfersOnly: newValue
		};
		setFilters(newFilters);
		setPendingFilters(newFilters);

		if (liveMode && selectedLiveBank) {
			loadLiveData(selectedLiveBank, 1, livePagination.pageSize);
		} else {
			setPage(1);
			loadDbData({ ...newFilters, page: 1 });
		}
	};

	const [splitMode, setSplitMode] = useState(false);
	const [leftData, setLeftData] = useState([]);
	const [rightData, setRightData] = useState([]);
	const [leftLoading, setLeftLoading] = useState(false);
	const [rightLoading, setRightLoading] = useState(false);
	const [leftPagination, setLeftPagination] = useState({
		total: 0, page: 1, pageSize: PAGE_SIZE_OPTIONS[0], totalPages: 0
	});
	const [rightPagination, setRightPagination] = useState({
		total: 0, page: 1, pageSize: PAGE_SIZE_OPTIONS[0], totalPages: 0
	});

	const [leftHasMore, setLeftHasMore] = useState(true);
	const [rightHasMore, setRightHasMore] = useState(true);

	const leftTableRef = useRef(null);
	const rightTableRef = useRef(null);

	const loadSplitData = async (
		filters = {},
		leftPage = 1,
		rightPage = 1,
		pageSize = PAGE_SIZE_OPTIONS[0],
		append = false,
		leftExtra = {},
		rightExtra = {}
	) => {
		setLeftLoading(true);
		setRightLoading(true);
		try {
			const endpoint = getEndpoint();
			const leftParams = { ...filters, transfersOnly: true, page: leftPage, pageSize, ...leftExtra };
			const rightParams = { ...filters, transfersOnly: false, page: rightPage, pageSize, ...rightExtra };

			const [leftResp, rightResp] = await Promise.all([
				defaultInstance.get(endpoint, { params: leftParams }),
				defaultInstance.get(endpoint, { params: rightParams })
			]);

			const formatRows = (response) => {
				const arr = Array.isArray(response.data?.data) ? response.data.data : [];
				return arr.map((item, idx) => ({
					id: `${item.bank_id === 1 ? 'tbc' : 'bog'}-${item.id || idx + 1}`,
					contragent: item.sender_name || 'ტერმინალით გადახდა',
					bank: BANK_TYPE_MAP[item.bank_type] || BANK_TYPE_MAP[item.bank_id] || '-',
					amount: (item.amount ?? 0) + ' ₾',
					transferDate: item.transaction_date ? item.transaction_date.slice(0, 10) : '-',
					purpose: item.description || '-',
					syncDate: item.created_at
						? item.created_at.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
						: '-'
				}));
			};

			const leftRows = formatRows(leftResp);
			const rightRows = formatRows(rightResp);

			if (append) {
				setLeftData(prev => [...prev, ...leftRows]);
				setRightData(prev => [...prev, ...rightRows]);
			} else {
				setLeftData(leftRows);
				setRightData(rightRows);
			}

			const leftTotal = leftResp.data.pagination?.total || 0;
			const rightTotal = rightResp.data.pagination?.total || 0;

			setLeftPagination(leftResp.data.pagination || { total: 0, page: leftPage, pageSize, totalPages: 0 });
			setRightPagination(rightResp.data.pagination || { total: 0, page: rightPage, pageSize, totalPages: 0 });

			setLeftHasMore(leftRows.length > 0 && leftData.length + leftRows.length < leftTotal);
			setRightHasMore(rightRows.length > 0 && rightData.length + rightRows.length < rightTotal);
		} catch (err) {
			console.error("Error loading split data:", err);
		} finally {
			setLeftLoading(false);
			setRightLoading(false);
		}
	};

	useEffect(() => {
		if (splitMode) {
			loadSplitData(filters, 1, 1, pageSize);
		}
		// eslint-disable-next-line
	}, [splitMode, filters, pageSize]);

	// Infinite scroll handlers
	const handleLeftScroll = useCallback(() => {
		if (!leftHasMore || leftLoading) return;
		const el = leftTableRef.current;
		if (!el) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
			const nextPage = leftPagination.page + 1;
			loadSplitData(filters, nextPage, rightPagination.page, leftPagination.pageSize, true);
			setLeftPagination(prev => ({ ...prev, page: nextPage }));
		}
	}, [filters, leftHasMore, leftLoading, leftPagination, rightPagination]);

	const handleRightScroll = useCallback(() => {
		if (!rightHasMore || rightLoading) return;
		const el = rightTableRef.current;
		if (!el) return;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
			const nextPage = rightPagination.page + 1;
			loadSplitData(filters, leftPagination.page, nextPage, rightPagination.pageSize, true);
			setRightPagination(prev => ({ ...prev, page: nextPage }));
		}
	}, [filters, rightHasMore, rightLoading, leftPagination, rightPagination]);

	useEffect(() => {
		if (splitMode) {
			const leftEl = leftTableRef.current;
			const rightEl = rightTableRef.current;
			if (leftEl) leftEl.addEventListener('scroll', handleLeftScroll);
			if (rightEl) rightEl.addEventListener('scroll', handleRightScroll);
			return () => {
				if (leftEl) leftEl.removeEventListener('scroll', handleLeftScroll);
				if (rightEl) rightEl.removeEventListener('scroll', handleRightScroll);
			};
		}
	}, [splitMode, handleLeftScroll, handleRightScroll]);

	const [leftSearchContragent, setLeftSearchContragent] = useState('');
	const [leftSearchAmount, setLeftSearchAmount] = useState('');
	const [rightSearchContragent, setRightSearchContragent] = useState('');
	const [rightSearchAmount, setRightSearchAmount] = useState('');

	const handleSplitSearch = (side, { contragent, amount }) => {
		if (side === 'left') {
			setLeftSearchContragent(contragent);
			setLeftSearchAmount(amount);
			loadSplitData(
				{ ...filters },
				leftPagination.page,
				rightPagination.page,
				leftPagination.pageSize,
				false,
				{ contragent, amount },
				{ contragent: rightSearchContragent, amount: rightSearchAmount }
			);
		} else {
			setRightSearchContragent(contragent);
			setRightSearchAmount(amount);
			loadSplitData(
				{ ...filters },
				leftPagination.page,
				rightPagination.page,
				rightPagination.pageSize,
				false,
				{ contragent: leftSearchContragent, amount: leftSearchAmount },
				{ contragent, amount }
			);
		}
	};

	const handleSortChange = (newSortConfig) => {
		setSortConfig(newSortConfig);
		// Reload data from backend with new sort params
		loadDbData({ ...filters, sortKey: newSortConfig.key, sortDirection: newSortConfig.direction, page: 1 });
		setPage(1);
	};

	return (
		<div className="table-accounts-container" onClick={closePopup}>
			<ToastContainer />
			<div className="table-accounts-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<h2 className="table-heading">
					{t('statement') || 'Statement'}
				</h2>
				<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
					<button
						type="button"
						style={{
							background: "#fff",
							border: "1.5px solid #0173b1",
							borderRadius: "6px",
							padding: "8px 12px",
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							color: "#0173b1"
						}}
						onClick={() => {
							setSplitMode(prev => !prev);
						}}
					>
						<FaTableColumns size={22} />
					</button>
					{!liveMode ? (
						<div className={tableStatementStyles.liveBankDropdownWrapper} ref={liveBankDropdownRef}>
							<button className={tableStatementStyles.liveBtn}
								type="button"
								style={{
									background: "#0173b1",
									cursor: loading ? "not-allowed" : "pointer",
								}}
								onClick={() => setLiveBankDropdownOpen(open => !open)}
								disabled={loading}
							>
								<FontAwesomeIcon icon={faBolt} style={{ marginRight: 6 }} />
								{t('live') || 'Live'}
								<FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 6, fontSize: '0.8em' }} />
							</button>
							{liveBankDropdownOpen && (
								<ul className={tableStatementStyles.liveBankDropdown}>
									<li className={tableStatementStyles.liveBankDropdownItem}>
										<button
											type="button"
											className={tableStatementStyles.liveBankDropdownBtn}
											onClick={() => handleSelectLiveBank('BOG')}
										>
											{t('bank_of_georgia') || 'Bank of Georgia'}
										</button>
									</li>
									<li className={tableStatementStyles.liveBankDropdownItem}>
										<button
											type="button"
											className={tableStatementStyles.liveBankDropdownBtn}
											onClick={() => handleSelectLiveBank('TBC')}
										>
											{t('tbc_bank') || 'TBC Bank'}
										</button>
									</li>
								</ul>
							)}
						</div>
					) : (
						<button className={tableStatementStyles.liveBtn}
							type="button"
							style={{
								background: "#FF6347",
								cursor: loading ? "not-allowed" : "pointer",
							}}
							onClick={handleExitLiveMode}
							disabled={loading}
						>
							<FontAwesomeIcon icon={faXmark} style={{ marginRight: 6 }} />
							{t('exit_live') || 'Exit Live'}
						</button>
					)}

					<div className={tableStatementStyles.pageSizeDropdownWrapper} ref={pageSizeDropdownRef}>
						<button
							type="button"
							className={tableStatementStyles.pageSizeBtn}
							onClick={() => setPageSizeDropdownOpen(open => !open)}
							aria-haspopup="listbox"
							aria-expanded={pageSizeDropdownOpen}
						>
							{pageSize} <span className={tableStatementStyles.pageSizeArrow}><FontAwesomeIcon icon={faChevronDown} style={{ marginLeft: 6, fontSize: '0.8em' }} /></span>
						</button>
						{pageSizeDropdownOpen && (
							<ul className={tableStatementStyles.pageSizeDropdown} role="listbox">
								{PAGE_SIZE_OPTIONS.map(opt => (
									<li key={opt} className={tableStatementStyles.pageSizeDropdownItem}>
										<button
											type="button"
											className={opt === pageSize ? tableStatementStyles.pageSizeDropdownBtnActive : tableStatementStyles.pageSizeDropdownBtn}
											onClick={() => {
												const newPageSize = opt;
												setPageSizeDropdownOpen(false);
												loadDbData({ ...filters, page: 1, pageSize: newPageSize });
												setPageSize(newPageSize);
												setPage(1);
											}}
											aria-current={opt === pageSize ? 'true' : undefined}
										>
											{opt}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
					<button
						className={filterStyles.filterToggleBtn}
						onClick={() => setFilterOpen(open => !open)}
						type="button"
					>
						{filterOpen ? (
							<FontAwesomeIcon icon={faXmark} />
						) : (
							<FontAwesomeIcon icon={faFilter} />
						)}
					</button>
				</div>
			</div>
			{
				filterOpen && (
					<div className={filterStyles.filterDrawer}>
						<TableFilter
							filters={pendingFilters}
							onChange={handleFilterChange}
							onReset={handleFilterReset}
							onApply={handleApplyFilters}
							fields={[
								{ name: 'contragent', label: t('contragent') || 'Contragent', placeholder: t('search_by_contragent') || 'Search by contragent' },
								{
									name: 'bank',
									label: t('bank') || 'Bank',
									placeholder: t('search_by_bank') || 'Search by bank',
									type: 'bankDropdown'
								},
								{ name: 'amount', label: t('amount') || 'Amount', placeholder: t('search_by_amount') || 'Search by amount' },
								{ name: 'transferDate', label: t('transferDate') || 'Transfer Date', placeholder: t('search_by_transferDate') || 'Search by transfer date' },
								{ name: 'purpose', label: t('purpose') || 'Purpose', placeholder: t('search_by_purpose') || 'Search by purpose' },
								...(!liveMode ? [
									{ name: 'startDate', label: t('Start Date') || 'Start Date', type: 'date' },
									{ name: 'endDate', label: t('End Date') || 'End Date', type: 'date' }
								] : [])
							]}
							bankOptions={bankOptions}
							bankDropdownOpen={bankDropdownOpen}
							setBankDropdownOpen={setBankDropdownOpen}
							bankDropdownRef={bankDropdownRef}
							onBankSelect={handleBankSelect}
							t={t}
							installmentOnly={filters.installmentOnly}
							transfersOnly={filters.transfersOnly}
							onInstallmentToggle={handleInstallmentOnlyChange}
							onTransfersToggle={handleTransfersOnlyChange}
							showStatementButtons={true}
						/>
					</div>
				)
			}
			{splitMode ? (
				<SplitStatementTable
					t={t}
					splitColumns={splitColumns}
					leftData={leftData}
					rightData={rightData}
					leftLoading={leftLoading}
					rightLoading={rightLoading}
					leftTableRef={leftTableRef}
					rightTableRef={rightTableRef}
					sortConfig={sortConfig}
					setSortConfig={setSortConfig}
					leftSearchContragent={leftSearchContragent}
					leftSearchAmount={leftSearchAmount}
					rightSearchContragent={rightSearchContragent}
					rightSearchAmount={rightSearchAmount}
					onSearch={handleSplitSearch}
					handleAmountClick={handleAmountClick}
				/>
			) : (
				<div>
					<div className="table-wrapper">
						<SortableTable
							columns={columns}
							data={pagedData}
							loading={loading || dbLoading}
							emptyText={t('no_statement_found') || "ამონაწერი არ მოიძებნა"}
							sortConfig={sortConfig}
							setSortConfig={setSortConfig}
							onSortChange={handleSortChange}
						/>
					</div>
					<Pagination
						total={
							liveMode
								? filteredData.length
								: (pagination.total || filteredData.length)
						}
						page={
							liveMode
								? livePagination.page
								: (pagination.page || page)
						}
						pageSize={
							liveMode
								? livePagination.pageSize
								: (pagination.pageSize || pageSize)
						}
						onChange={(newPage) => {
							if (liveMode) {
								setLivePagination(prev => ({
									...prev,
									page: newPage
								}));
								setPage(newPage);
							} else {
								loadDbData({ ...filters, page: newPage });
							}
						}}
					/>
				</div>)}

			{modalOpen && selectedTransaction && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0,0,0,0.35)',
						zIndex: 9999,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<div
						style={{
							background: '#fff',
							borderRadius: 16,
							padding: '48px 40px',
							minWidth: 300,
							maxWidth: 550,
							boxShadow: '0 12px 48px rgba(1,115,177,0.22)',
							position: 'relative',
							cursor: 'default'
						}}
					>
						<button
							onClick={closePopup}
							style={{
								position: 'absolute',
								top: 18,
								right: 18,
								background: 'transparent',
								border: 'none',
								fontSize: '1.8em',
								color: '#0173b1',
								cursor: 'pointer',
								zIndex: 2,
								padding: 0,
								lineHeight: 1
							}}
							aria-label="Close"
						>
							&times;
						</button>
						<h3 style={{ marginBottom: 24, color: '#0173b1', textAlign: 'center', fontSize: '1.5em' }}>
							{t('details') || 'დეტალური ინფორმაცია'}
						</h3>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: '1.15em' }}>
							<div><b>{t('contragent') || 'Contragent'}:</b> {selectedTransaction.contragent}</div>
							<div><b>{t('bank') || 'Bank'}:</b> {selectedTransaction.bank}</div>
							<div><b>{t('amount') || 'Amount'}:</b> {selectedTransaction.amount}</div>
							<div><b>{t('transferDate') || 'Transfer Date'}:</b> {selectedTransaction.transferDate}</div>
							<div><b>{t('purpose') || 'Purpose'}:</b> {selectedTransaction.purpose}</div>
							{selectedTransaction.syncDate && (
								<div><b>{t('syncDate') || 'Sync Date'}:</b> {selectedTransaction.syncDate}</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div >
	);
};

export default TableStatement;