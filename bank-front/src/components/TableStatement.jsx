import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import defaultInstance from '../api/defaultInstance';
import Pagination from './Pagination';

const TableStatement = () => {

	const { t } = useTranslation();

	const columns = [
		{ key: 'contragent', label: t('contragent') },
		{ key: 'bank', label: t('bank') },
		{ key: 'amount', label: t('amount') },
		{ key: 'transferDate', label: t('transferDate') },
		{ key: 'purpose', label: t('purpose') },
		{ key: 'syncDate', label: t('syncDate') }
	];

	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const pageSize = 20;

	useEffect(() => {
		setLoading(true);
		defaultInstance.get('/bog/todayactivities')
			.then(res => {
				const rows = (res.data?.activities || res.data || []).map((item, idx) => ({
					id: idx + 1,
					contragent:
						item.Sender?.Name ||
						'',
					bank:
						item.Sender?.BankName ||
						'ბანკი არ არის მითითებული',
					amount:
						item.Amount ||
						'',
					transferDate:
						item.PostDate ||
						item.ValueDate ||
						'',
					purpose:
						item.EntryComment ||
						'',
					syncDate: item.syncDate || '',
				}));
				setData(rows);
			})
			.catch(() => setError('დატვირთვის შეცდომა'))
			.finally(() => setLoading(false));
	}, []);

	const pagedData = data.slice((page - 1) * pageSize, page * pageSize);

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">{t('statement')}</h2>
			</div>
			<div className="table-wrapper">
				{error && <div style={{ color: 'red' }}>{error}</div>}
				<SortableTable
					columns={columns}
					data={pagedData}
					loading={loading}
					emptyText="ამონაწერი არ მოიძებნა"
				/>

			</div>
			<Pagination
				total={data.length}
				page={page}
				pageSize={pageSize}
				onChange={setPage}
			/>
		</div>
	);
};

export default TableStatement;