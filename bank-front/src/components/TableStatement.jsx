import '../assets/css/TableAccounts.css';

const TableStatement = () => {

	return (
		<div className="table-accounts-container">
			<div className="table-accounts-header">
				<h2 className="table-heading">ამონაწერი</h2>
			</div>
			<div className="table-wrapper">
				<table className="accounts-table">
					<thead>
						<tr>
							<th>კონტრაგენტი</th>
							<th>ბანკი</th>
							<th>თანხა</th>
							<th>გადმორიცხვის თარიღი</th>
							<th>დანიშნულება</th>
							<th>სინქრონიზაციის თარიღი</th>
						</tr>
					</thead>
					<tbody className="table-contragents">
						{/* Add statement rows here */}
						<tr>
							<td colSpan={6}></td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableStatement;