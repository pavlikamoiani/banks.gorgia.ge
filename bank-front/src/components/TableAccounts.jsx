import React from 'react';
import '../assets/css/TableAccounts.css';

const TableAccounts = ({ accounts = [] }) => {
	// If no accounts are provided, display sample data
	const sampleAccounts = [
		{ id: 1, accountNumber: 'GE123456789012', type: 'Checking', balance: 5000, currency: 'GEL' },
		{ id: 2, accountNumber: 'GE987654321098', type: 'Savings', balance: 15000, currency: 'GEL' },
		{ id: 3, accountNumber: 'GE456789123456', type: 'Credit', balance: 2500, currency: 'USD' },
	];

	const displayAccounts = accounts.length ? accounts : sampleAccounts;

	return (
		<div className="table-accounts-container">
			<h2 className="table-heading">Bank Accounts</h2>
			<div className="table-wrapper">
				<table className="accounts-table">
					<thead>
						<tr>
							<th>Account Number</th>
							<th>Type</th>
							<th>Balance</th>
							<th>Currency</th>
						</tr>
					</thead>
					<tbody>
						{displayAccounts.map(account => (
							<tr key={account.id}>
								<td>{account.accountNumber}</td>
								<td>{account.type}</td>
								<td>{account.balance.toLocaleString()}</td>
								<td>{account.currency}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableAccounts;
