import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Header
      "statement": "Statement",
      "contragents": "Contragents",
      "users": "Users",
      "logout": "Logout",
      "cancel": "Cancel",
      "add": "Add",
      "registration_date": "Registration Date",
      "reset": "Reset",
      "bank": "Bank",
      "no_data_found": "No data found",

      // Dashboard
      "dashboard": "Dashboard",
      "today": "Today",
      "today_transactions": "Today's Transactions",
      "transactions": "Transactions",
      "total_amount": "Total Amount",
      "top_contragents": "Top Contragents",
      "transactions_by_day": "Transactions by Day",
      "loading_data": "Loading data...",

      // Visibility
      "manage_role_visibility": "Manage Role Visibility",
      "select_roles_to_hide": "Select roles to hide for",
      "allow_view": "Allow view",
      "select_roles_to_show": "Select roles to show for",
      "remove_view": "Remove view",

      // Table users
      "users_title": "Users",
      "add_user": "Add User",
      "edit_user": "Edit User",
      "name": "Name",
      "email": "Email",
      "password": "Password",
      "role": "Role",
      "actions": "Actions",
      "select_role": "Select Role",
      "distribution_operator": "Distribution Operator",
      "corporate_sales_manager": "Corporate Sales Manager",
      "administrator": "Administrator",
      "select_bank": "Select Bank",
      "new_password": "New Password (optional)",
      "all_fields_required": "All fields are required",
      "error_adding": "Error adding",
      "error_editing": "Error editing",
      "save": "Save",
      "loading": "Loading...",
      "no_data": "No data found",
      "delete_user_confirm": "Are you sure you want to delete this user?",
      "error_deleting": "Error deleting",

      // table contragents
      "add_contragent": "Add Contragents",
      "edit_contragent": "Edit Contragent",
      "title": "Title",
      "identification_code": "Identification Code",
      "search_by_title": "Search by title",
      "search_by_code": "Search by code",
      "no_contragents_found": "No contragents found",
      "select_all": "Select All",

      // table statement
      "contragent": "Contragent",
      "amount": "Amount",
      "transferDate": "Transfer Date",
      "purpose": "Purpose",
      "syncDate": "Sync Date",
      "details": "Details information",
      "incoming": "Incoming",
      "outgoing": "Outgoing",
      "no_statement_found": "No statement found",
      "bank_of_georgia": "Bank of Georgia",
      "tbc_bank": "TBC Bank",

      // Statement filter
      "search_by_contragent": "Search by contragent",
      "search_by_bank": "Search by bank",
      "search_by_amount": "Search by amount",
      "search_by_transferDate": "Search by date",
      "search_by_purpose": "Search by purpose",
      "all": "All",
      "show_more": "Show more",
      "show_less": "Show less",
      "apply": "Search",
      "live_today_transactions": "Today's Transactions",
      "exit_live": "Exit Live",
      "installment": "Installment",
      "installment_tooltip": "Show/Hide installments and distributions (TBC)",
      "transfers": "Transfers",
      "transfers_tooltip": "Show/Hide transfers",

      // Delete confirmation modal
      "delete": "Delete",
      "delete_title": "Delete Confirmation",
      "delete_confirm_text": "Are you sure you want to delete this item?",

      // TBC Password Modal
      "tbc_password_change": "TBC Password Change",
      "new_password_label": "New Password",
      "update": "Update",
      "password_updated_successfully": "Password updated successfully",
      "error_updating_password": "Error updating password",
      "close": "Close",
      "left": "Left",
      "days": "days",
    }
  },
  ru: {
    translation: {
      // Header
      "statement": "Выписка",
      "contragents": "Контрагенты",
      "users": "Пользователи",
      "logout": "Выход",
      "registration_date": "Дата регистрации",
      "cancel": "Отмена",
      "add": "Добавить",
      "reset": "Сбросить",
      "bank": "Банк",
      "no_data_found": "Данные не найдены",

      // Dashboard
      "dashboard": "Панель управления",
      "today": "Сегодня",
      "today_transactions": "Сегодняшние транзакции",
      "transactions": "Транзакции",
      "total_amount": "Общая сумма",
      "top_contragents": "Топ контрагентов",
      "transactions_by_day": "Транзакции по дням",
      "loading_data": "Загрузка данных...",

      // Visibility
      "manage_role_visibility": "Управление видимостью ролей",
      "select_roles_to_hide": "Выберите роли для скрытия",
      "allow_view": "Разрешить просмотр",
      "select_roles_to_show": "Выберите роли для отображения",
      "remove_view": "Удалить просмотр",

      // Table users
      "users_title": "Пользователи",
      "add_user": "Добавить пользователя",
      "edit_user": "Редактировать пользователя",
      "name": "Имя",
      "email": "Эл. почта",
      "password": "Пароль",
      "role": "Роль",
      "actions": "Действия",
      "select_role": "Выберите роль",
      "distribution_operator": "Оператор дистрибуции",
      "corporate_sales_manager": "Менеджер корпоративных продаж",
      "administrator": "Администратор",
      "select_bank": "Выберите банк",
      "new_password": "Новый пароль (опционально)",
      "all_fields_required": "Все поля обязательны",
      "error_adding": "Ошибка при добавлении",
      "error_editing": "Ошибка при редактировании",
      "save": "Сохранить",
      "loading": "Загрузка...",
      "no_data": "Данные не найдены",
      "delete_user_confirm": "Вы уверены, что хотите удалить этого пользователя?",
      "error_deleting": "Ошибка при удалении",

      // table contragents
      "add_contragent": "Добавить контрагента",
      "edit_contragent": "Редактировать контрагента",
      "title": "Название",
      "identification_code": "Идентификационный код",
      "search_by_title": "Поиск по названию",
      "search_by_code": "Поиск по коду",
      "no_contragents_found": "Контрагенты не найдены",
      "select_all": "Выбрать все",

      // table statement
      "contragent": "Контрагент",
      "amount": "Сумма",
      "transferDate": "Дата перевода",
      "purpose": "Назначение",
      "syncDate": "Дата синхронизации",
      "details": "Детали",
      "incoming": "Входящие",
      "outgoing": "Исходящие",
      "no_statement_found": "Выписка не найдена",
      "bank_of_georgia": "Bank of Georgia",
      "tbc_bank": "TBC Bank",

      // Statement filter
      "search_by_contragent": "Поиск по контрагенту",
      "search_by_bank": "Поиск по банку",
      "search_by_amount": "Поиск по сумме",
      "search_by_transferDate": "Поиск по дате",
      "search_by_purpose": "Поиск по назначению",
      "all": "Все",
      "show_more": "Показать больше",
      "show_less": "Показать меньше",
      "apply": "Поиск",
      "live_today_transactions": "Сегодняшние транзакции",
      "exit_live": "Выход из Live",
      "installment": "Рассрочка",
      "installment_tooltip": "Показать/Скрыть рассрочки и распределения (ТБС)",
      "transfers": "Перевод денег",
      "transfers_tooltip": "Показать/Скрыть переводы",

      // Delete confirmation modal
      "delete": "Удалить",
      "delete_title": "Подтверждение удаления",
      "delete_confirm_text": "Вы уверены, что хотите удалить этот элемент?",

      // TBC Password Modal
      "tbc_password_change": "Изменение пароля TBC",
      "new_password_label": "Новый пароль",
      "update": "Обновить",
      "password_updated_successfully": "Пароль успешно обновлен",
      "error_updating_password": "Ошибка при обновлении пароля",
      "close": "Закрыть",
      "left": "Осталось",
      "days": "дней",
    }
  },
  ka: {
    translation: {
      // Header
      "statement": "ამონაწერი",
      "contragents": "კონტრაგენტები",
      "users": "მომხმარებლები",
      "logout": "გასვლა",
      "cancel": "გაუქმება",
      "add": "დამატება",
      "reset": "გაუქმება",
      "bank": "დანიშნული ბანკი",
      "no_data_found": "მონაცემები არ მოიძებნა",

      // Dashboard
      "dashboard": "დაშვება",
      "today": "დღეს",
      "today_transactions": "დღევანდელი ტრანზაქციები",
      "transactions": "ტრანზაქციები",
      "total_amount": "სულ თანხა",
      "top_contragents": "ტოპ კონტრაგენტები",
      "transactions_by_day": "დღის ტრანზაქციები",
      "loading_data": "მონაცემების ჩატვირთვა...",

      // Visibility
      "manage_role_visibility": "მომხმარებლის როლის მართვა",
      "select_roles_to_hide": "აირჩიეთ როლიები, რომლებსაც უნდა დაემალოს",
      "allow_view": "დაშვება ნახვისთვის",
      "select_roles_to_show": "აირჩიეთ როლები, ვისაც ექნება ნახვის უფლება",
      "remove_view": "ნახვის უფლების გაუქმება",

      // Table users
      "users_title": "მომხმარებლები",
      "add_user": "მომხმარებლის დამატება",
      "edit_user": "მომხმარებლის რედაქტირება",
      "name": "სახელი",
      "email": "მომხმარებლის ელფოსტა",
      "password": "პაროლი",
      "role": "მომხმარებლის როლი",
      "registration_date": "რეგისტრაციის თარიღი",
      "actions": "ქმედებები",
      "select_role": "აირჩიეთ როლი",
      "distribution_operator": "დისტრიბუციის ოპერატორი",
      "corporate_sales_manager": "კორპორატიული გაყიდვების მენეჯერი",
      "administrator": "ადმინისტრატორი",
      "select_bank": "აირჩიეთ ბანკი",
      "new_password": "ახალი პაროლი (სურვილისამებრ)",
      "all_fields_required": "ყველა ველი სავალდებულოა",
      "error_adding": "შეცდომა დამატებისას",
      "error_editing": "შეცდომა რედაქტირებისას",
      "save": "შენახვა",
      "loading": "იტვირთება...",
      "no_data": "მონაცემები არ მოიძებნა",
      "delete_user_confirm": "ნამდვილად გსურთ მომხმარებლის წაშლა?",
      "error_deleting": "შეცდომა წაშლისას",

      // table contragents
      "add_contragent": "კონტრაგენტის დამატება",
      "edit_contragent": "კონტრაგენტის რედაქტირება",
      "title": "დასახელება",
      "identification_code": "საიდენფიკაციო კოდი",
      "search_by_title": "ძებნა დასახელებით",
      "search_by_code": "ძებნა კოდით",
      "no_contragents_found": "კონტრაგენტები ვერ მოიძებნა",
      "select_all": "ყველას არჩევა",

      // table statement
      "contragent": "კონტრაგენტი",
      "amount": "თანხა",
      "transferDate": "გადმორიცხვის თარიღი",
      "purpose": "დანიშნულება",
      "syncDate": "სინქრონიზაციის თარიღი",
      "details": "დეტალური ინფორმაცია",
      "incoming": "ჩარიცხული",
      "outgoing": "გადარიცხული",
      "no_statement_found": "ამონაწერი არ მოიძებნა",
      "bank_of_georgia": "Bank of Georgia",
      "tbc_bank": "TBC Bank",

      // Statement filter
      "search_by_contragent": "ძებნა კონტრაგენტით",
      "search_by_bank": "ძებნა ბანკით",
      "search_by_amount": "ძებნა თანხით",
      "search_by_transferDate": "ძებნა თარიღით",
      "search_by_purpose": "ძებნა დანიშნულებით",
      "all": "ყველა",
      "show_more": "მეტის ნახვა",
      "show_less": "ნაკლების ნახვა",
      "apply": "ძებნა",
      "live_today_transactions": "დღევანდელი ტრანზაქციები",
      "exit_live": "გამოსვლა Live რეჟიმიდან",
      "installment": "განვადებები",
      "installment_tooltip": "განვადებები/განაწებები(თბს) ჩვენება/დამალვა",
      "transfers": 'გადარიცხვები',
      "transfers_tooltip": "გადარიცხვების ჩვენება/დამალვა",

      // Delete confirmation modal
      "delete": "წაშლა",
      "delete_title": "წაშლის დადასტურება",
      "delete_confirm_text": "ნამდვილად გსურთ ამ ელემენტის წაშლა?",

      // TBC Password Modal
      "tbc_password_change": "TBC-ის პაროლის შეცვლა",
      "new_password_label": "ახალი პაროლი",
      "update": "განახლება",
      "password_updated_successfully": "პაროლი წარმატებით განახლდა",
      "error_updating_password": "შეცდომა პაროლის განახლებისას",
      "close": "დახურვა",
      "left": "დარჩა",
      "days": "დღე",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'ka',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
