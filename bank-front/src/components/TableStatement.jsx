import '../assets/css/TableAccounts.css';
import SortableTable from './SortableTable';
import { useTranslation } from 'react-i18next';

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

	const data = [
		{
			id: 1,
			contragent: 'Comp A',
			bank: 'Bank X',
			amount: 1000,
			transferDate: '2024-07-01',
			purpose: 'Invoice #123',
			syncDate: '2024-07-02',
		},
	];

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">{t('statement')}</h2>
			</div>
			<div className="table-wrapper">
				<SortableTable
					columns={columns}
					data={data}
					loading={false}
					emptyText="ამონაწერი არ მოიძებნა"
				/>
			</div>
		</div>
	);
};

export default TableStatement;