import '../assets/css/TableAccounts.css';

const TableAccounts = ({ type = "statement" }) => {
	let columns;
	let heading;

	if (type === "contragents") {
		heading = "კონტრაგენტები";
		columns = [
			"დასახელება",
			"საიდენფიკაციო კოდი",
			"რეგისტრაციის თარიღი"
		];
	} else if (type === "users") {
		heading = "მომხმარებლები";
		columns = [
			"სახელი",
			"მომხმარებლის სახელი",
			"მომხმარებლის როლები",
			"რეგისტრაციის თარიღი",
			"ქმედებები"
		];
	 } else {
		heading = "ამონაწერი";
		columns = [
			"კონტრაგენტი",
			"ბანკი",
			"თანხა",
			"გადმორიცხვის თარიღი",
			"დანიშნულება",
			"სინქრონიზაციის თარიღი"
		];
	}

	return (
		<div className="table-accounts-container">
			<h2 className="table-heading">{heading}</h2>
			<div className="table-wrapper">
				<table className="accounts-table">
					<thead>
						<tr>
							{columns.map((col, idx) => (
								<th key={idx}>{col}</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr>
							{columns.map((_, idx) => (
								<td key={idx}></td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableAccounts;
