import TableContragents from './TableContragents';
import TableStatement from './TableStatement';
import TableUsers from './TableUsers';

const TableAccounts = ({ type = "statement" }) => {
  if (type === "contragents") {
    return <TableContragents />;
  } else if (type === "users") {
    return <TableUsers />;
  } else {
    return <TableStatement />;
  }
};

export default TableAccounts;