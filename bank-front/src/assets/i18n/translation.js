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

      // Table users
      "users_title": "Users",
      "add_user": "Add User",
      "edit_user": "Edit User",
      "name": "Name",
      "email": "Email",
      "password": "Password",
      "role": "Role",
      "bank": "Bank",
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
      "title": "Title",
      "identification_code": "Identification Code",
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

      // Table users
      "users_title": "Пользователи",
      "add_user": "Добавить пользователя",
      "edit_user": "Редактировать пользователя",
      "name": "Имя",
      "email": "Эл. почта",
      "password": "Пароль",
      "role": "Роль",
      "bank": "Банк",
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
      "title": "Название",
      "identification_code": "Идентификационный код",
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

      // Table users
      "users_title": "მომხმარებლები",
      "add_user": "მომხმარებლის დამატება",
      "edit_user": "მომხმარებლის რედაქტირება",
      "name": "სახელი",
      "email": "მომხმარებლის ელფოსტა",
      "password": "პაროლი",
      "role": "მომხმარებლის როლი",
      "bank": "დანიშნული ბანკი",
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
      "title": "დასახელება",
      "identification_code": "საიდენფიკაციო კოდი",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'ka', // Default language is Georgian
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
