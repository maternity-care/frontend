export const RESPONSE_MESSAGES = {
  COMMON: {
    DEFAULT_NAME: "Maternity Care",
    PREGNANT: "Thai phụ",
    HELLO: "Xin chào",
    HOUR: "Giờ",
    MINUTE: "Phút",
    SECOND: "Giây",
    DATE: "Ngày",
    WEEK: "Tuần",
    MONTH: "Tháng",
    YEAR: "Năm",
    CANCEL: "Hủy",
    EDIT: "Chỉnh sửa",
    DELETE: "Xóa",
    ADD: "Thêm",
    UPDATE: "Cập nhật",
    VIEW: "Xem",
    DETAIL: "Chi tiết",
    CONFIRM: "Xác nhận",
    SUBMIT: "Gửi",
    CLOSE: "Đóng",
    TITLE: "Tiêu đề",
    LOCATION: "Địa điểm",
    NOTE: "Ghi chú",
    SEARCH: "Tìm kiếm",
    SEARCH_PLACEHOLDER: "Nhập từ khóa tìm kiếm...",
    TIME: "Thời gian",
    EMAIL: "Email",
    NAME: "Họ và tên",
    PHONE: "Số điện thoại",
    ADDRESS: "Địa chỉ",
    DATE_OF_BIRTH: "Ngày sinh",
    PASSWORD: "Mật khẩu",
    SAVE_CHANGES: "Lưu thay đổi",
    ROLE: "Vai trò",
    STATUS: "Trạng thái",
    CREATED_AT: "Ngày tạo",
    UPDATED_AT: "Cập nhật lần cuối",
    ACTIONS: "Hành động",
  },

  COMMON_DESCRIPTION: {
    ENTER_TITLE_DESCRIPTION: "Vui lòng nhập tiêu đề",
    ENTER_DATE_DESCRIPTION: "Vui lòng chọn ngày",
    enterHourDescription: "Vui lòng chọn giờ",
    ENTER_LOCATION_DESCRIPTION: "Vui lòng nhập địa điểm",
    ENTER_NOTE_DESCRIPTION: "Nhập ghi chú cho lịch nhắc nếu có",
    ENTER_TITLE_SCHEDULE_EXAMPLE:
      "Ví dụ: Uống viên sắt, tái khám, đo huyết áp...",
    ENTER_LOCATION_SCHEDULE_EXAMPLE: "Ví dụ: Phòng khám, bệnh viện, tại nhà...",
    NAME_REQUIRED: "Vui lòng nhập họ và tên",
    NAME_RULE: "Họ và tên là bắt buộc",
    ENTER_NAME: "Nhập họ và tên",
  },

  NAVIGATION: {
    PROFILE: "Hồ sơ",
    UPLOAD: "Upload",
    CART: "Giỏ hàng",
    VIEW_PROFILE: "Xem hồ sơ",
    SCHEDULE: "Lịch",
  },

  AUTH: {
    LOGIN: "Đăng nhập",
    LOGOUT: "Đăng xuất",
    LOGIN_FOR_MANAGEMENT: "Đăng nhập quản trị",
    REGISTER: "Đăng ký tài khoản",
    REGISTER_NOW: "Đăng ký ngay",
    LOGIN_ACCOUNT: "Đăng nhập tài khoản",
    LOGIN_DESCRIPTION: "Dùng tài khoản của bạn để truy cập hồ sơ và uploads.",
    REGISTER_DESCRIPTION: "Tạo tài khoản để sử dụng hệ thống Maternity Care.",
    ENTER_EMAIL: "Nhập email",
    ENTER_PASSWORD: "Nhập mật khẩu",
    ENTER_NAME: "Nhập họ và tên",
    FORGOT_PASSWORD: "Quên mật khẩu?",
    REMEMBER_ME: "Ghi nhớ đăng nhập",
    REGISTER_BUTTON: "Đăng ký",
    emailRequired: "Vui lòng nhập email",
    emailInvalid: "Email không hợp lệ",
    passwordRequired: "Vui lòng nhập mật khẩu",
    passwordMinLength: "Mật khẩu tối thiểu 6 ký tự",
    REMEMBER_LOGIN: "Ghi nhớ đăng nhập",
    HAVE_ACCOUNT: "Bạn đã có tài khoản?",
    DONT_HAVE_ACCOUNT: "Bạn chưa có tài khoản?",
    NAME_REQUIRED: "Vui lòng nhập họ và tên",
    NAME_MIN_LENGTH: "Họ và tên tối thiểu 2 ký tự",
    CONFIRM_PASSWORD: "Xác nhận mật khẩu",
    CONFIRM_PASSWORD_REQUIRED: "Vui lòng xác nhận mật khẩu",
    CONFIRM_PASSWORD_MISMATCH: "Mật khẩu xác nhận không khớp",
    FORGOT_PASSWORD_DESCRIPTION:
      "Nhập email tài khoản để tạo link đặt lại mật khẩu.",
    RESET_PASSWORD_LINK: "Mở trang đặt lại mật khẩu",
    EMAIL_INVALID: "Email không hợp lệ",
    CREATE_RESET_PASSWORD_LINK: "Tạo link đặt lại mật khẩu",
    RESET_PASSWORD: "Đặt lại mật khẩu",
    ENTER_NEW_PASSWORD: "Nhập mật khẩu mới",
    NEW_PASSWORD: "Mật khẩu mới",
    newPasswordRequired: "Vui lòng nhập mật khẩu mới",
    newPasswordMinLength: "Mật khẩu mới tối thiểu 6 ký tự",
    RETURN_LOGIN: "Vui lòng đăng nhập lại",
  },

  HOME: {
    HERO: {
      DEFAULT_BADGE: "Maternity Care System",
      DEFAULT_TITLE: "Chăm sóc thai kỳ dễ dàng hơn trong một nền tảng duy nhất",
      DEFAULT_DESCRIPTION:
        "Theo dõi hồ sơ thai sản, đặt lịch khám, xem kết quả siêu âm/xét nghiệm và nhận nhắc lịch quan trọng cùng MCS.",
      MANAGEMENT: "Management",
    },

    QUICK_APPOINTMENT: {
      TITLE: "Đặt lịch khám nhanh",
      SUBTITLE: "Chọn thông tin để kiểm tra lịch trống",
      FACILITY_PLACEHOLDER: "Chọn cơ sở khám",
      SERVICE_PLACEHOLDER: "Chọn dịch vụ",
      DOCTOR_PLACEHOLDER: "Chọn bác sĩ",
      DATE_PLACEHOLDER: "Chọn ngày khám",
      CHECK_AVAILABLE: "Kiểm tra lịch trống",
      LOGIN_REQUIRED_NOTE:
        "Bạn cần đăng nhập hoặc đăng ký tài khoản để hoàn tất đặt lịch và bảo vệ hồ sơ cá nhân.",
    },

    PAIN_POINTS: {
      TAG: "Vì sao cần MCS?",
      TITLE: "Giảm rối trong quá trình chăm sóc thai kỳ",
      DESCRIPTION:
        "MCS giúp mẹ bầu hạn chế quên lịch khám, thất lạc giấy tờ và khó theo dõi kết quả qua nhiều kênh khác nhau.",
    },

    SERVICES_SECTION: {
      TAG: "Dịch vụ",
      TITLE: "Dịch vụ chăm sóc thai kỳ nổi bật",
      DESCRIPTION:
        "Các dịch vụ được cấu hình theo từng cơ sở, giúp mẹ bầu dễ chọn nơi khám phù hợp.",
      VIEW_ALL: "Xem tất cả dịch vụ",
      BOOK_THIS_SERVICE: "Đặt lịch dịch vụ này →",
    },

    PACKAGES_SECTION: {
      TAG: "Gói thai sản",
      TITLE: "Chọn gói chăm sóc phù hợp với mẹ bầu",
      DESCRIPTION:
        "So sánh quyền lợi, số lần khám, siêu âm, xét nghiệm và dịch vụ hỗ trợ trước khi đăng ký.",
      REGISTER_PACKAGE: "Đăng ký gói",
    },

    DOCTORS_SECTION: {
      TAG: "Bác sĩ",
      TITLE: "Đội ngũ bác sĩ đồng hành cùng mẹ bầu",
      DESCRIPTION:
        "Mẹ bầu có thể xem thông tin bác sĩ, chuyên khoa và lịch làm việc trước khi đặt khám.",
      VIEW_SCHEDULE: "Xem lịch khám",
    },

    PROCESS_SECTION: {
      TAG: "Quy trình",
      TITLE: "Mẹ bầu sử dụng MCS như thế nào?",
      DESCRIPTION:
        "Quy trình đơn giản từ đăng ký, tạo hồ sơ, đặt lịch đến xem kết quả khám.",
    },

    SUPPORT_SECTION: {
      TITLE: "Hỗ trợ và kiến thức thai kỳ",
      DESCRIPTION:
        "MCS cung cấp FAQ, bài viết kiến thức thai sản và kênh chat để mẹ bầu dễ dàng nhận hỗ trợ khi cần.",
      NOTE: "Lưu ý: Hệ thống không thay thế chẩn đoán y khoa. Các vấn đề sức khỏe cần được bác sĩ hoặc cơ sở y tế tư vấn trực tiếp.",
      START_USING: "Bắt đầu sử dụng",
      FAQ_TITLE: "Câu hỏi thường gặp",
    },

    FINAL_CTA: {
      TITLE: "Sẵn sàng quản lý thai kỳ dễ dàng hơn?",
      DESCRIPTION:
        "Tạo hồ sơ thai sản, đặt lịch khám và theo dõi kết quả trong một hệ thống duy nhất.",
      BOOK_APPOINTMENT: "Đặt lịch khám",
    },
  },

  FOOTER: {
    BRAND_NAME: "Maternity Care System",
    SLOGAN: "Chăm sóc thai kỳ thông minh",
    DESCRIPTION:
      "Nền tảng hỗ trợ mẹ bầu quản lý hồ sơ thai sản, đặt lịch khám, theo dõi kết quả, nhận nhắc lịch và kết nối với phòng khám trong một hệ thống duy nhất.",

    QUICK_LINKS_TITLE: "Liên kết nhanh",
    SERVICES_TITLE: "Dịch vụ",
    CONTACT_TITLE: "Thông tin liên hệ",

    SOCIAL: {
      FACEBOOK: "Facebook",
      EMAIL: "Email",
    },

    COPYRIGHT_SUFFIX: "Maternity Care System. All rights reserved.",

    BOTTOM_LINKS: {
      PRIVACY_POLICY: "Chính sách bảo mật",
      TERMS: "Điều khoản sử dụng",
      SUPPORT: "Hỗ trợ",
    },
  },

  SCHEDULE: {
    TITLE: "Lịch chăm sóc thai kỳ",
    TITLE_DESCRIPTION:
      "Theo dõi lịch khám, siêu âm, xét nghiệm và tự tạo lịch nhắc trong quá trình mang thai.",
    NEXT_APPOINTMENT: "Lịch hẹn gần nhất",
    GESTATIONAL_WEEK: "Tuần thai",
    UPCOMING_APPOINTMENTS: "Lịch hẹn",
    UPCOMING_APPOINTMENTS_CARE: "Lịch chăm sóc sắp tới",
    DONT_HAVE_UPCOMING_APPOINTMENTS: "Bạn chưa có lịch hẹn nào sắp tới",
    PROGRESS_CARE: "Tiến độ chăm sóc",
    MANAGE_SCHEDULE: "Quản lý lịch chăm sóc",
    MANAGE_SCHEDULE_DESCRIPTION: "Xem lịch sắp tới hoặc tạo lịch nhắc cá nhân.",
    CREATE_SCHEDULE: "Tạo lịch nhắc",
    CREATE_NEW_SCHEDULE: "Tạo lịch nhắc mới",
    EDIT_SCHEDULE: "Chỉnh sửa lịch nhắc",
    DELETE_SCHEDULE: "Xóa lịch nhắc",
    SCHEDULE_TYPE: "Loại lịch",
    SCHEDULE_TYPE_REQUIRED: "Vui lòng chọn loại lịch",
    OTHER_SCHEDULE: "Lịch khác",
    CALENDAR_VIEW: "Dạng xem lịch",
    Pregnancy_records: "Hồ sơ thai kỳ",
  },

  PROFILE: {
    PREGNANT_INFO: "Thông tin thai phụ",
    PERSONAL_INFO: "Thông tin cá nhân",
    FOLLOW_MOM_AND_BABY: " Theo dõi thông tin chăm sóc mẹ và bé",
    UNABLE_TO_LOAD_PROFILE: "Không thể tải thông tin hồ sơ",
    BLOOD_TYPE: "Nhóm máu",
  },

  USER_MANAGEMENT: {
    MANAGEMENT: "Management",
    PAGE_TITLE: "User Management",
    PAGE_DESCRIPTION: "Quản lý tài khoản người dùng trong hệ thống.",
    TITLE: "Quản lý tài khoản người dùng",
    DESCRIPTION:
      "Theo dõi, tìm kiếm và kiểm tra thông tin tài khoản trong hệ thống.",

    STT: "STT",
    ACCOUNT_ID: "Mã tài khoản",
    ACCOUNT_TYPE: "Loại tài khoản",
    TOTAL_ACCOUNTS: "Tổng tài khoản",
    ACTIVE_ACCOUNTS: "Đang hoạt động",
    LOCKED_ACCOUNTS: "Đã khóa",
    CREATED_THIS_MONTH: "Tạo mới tháng này",

    EXPORT_LIST: "Xuất danh sách",
    CSV_FILENAME: "danh-sach-tai-khoan.csv",
    SEARCH_PLACEHOLDER: "Tìm theo tên/email/SĐT",
    ROLE_PLACEHOLDER: "Vai trò",
    STATUS_PLACEHOLDER: "Trạng thái",
    ACCOUNT_TYPE_PLACEHOLDER: "Loại tài khoản",
    CLEAR_FILTERS: "Xóa bộ lọc",

    LIST_TITLE: "Danh sách tài khoản",
    LIST_DESCRIPTION:
      "Chọn nhiều tài khoản để xóa hoặc thao tác từng tài khoản.",
    ADD_ACCOUNT: "Thêm tài khoản",
    DELETE_SELECTED: "Xóa đã chọn",

    VIEW_DETAIL: "Xem chi tiết",
    EDIT_ACCOUNT: "Sửa",
    DELETE_ACCOUNT: "Xóa tài khoản",
    DELETE_SELECTED_ACCOUNTS: "Xóa tài khoản đã chọn",

    DELETE_SINGLE_CONFIRM: "Bạn có chắc chắn muốn xóa tài khoản này không?",
    DELETE_SELECTED_CONFIRM_PREFIX: "Bạn có chắc chắn muốn xóa",
    DELETE_SELECTED_CONFIRM_SUFFIX: "tài khoản đã chọn không?",

    DELETE_SUCCESS_TITLE: "Xóa tài khoản thành công",
    DELETE_SINGLE_SUCCESS_CONTENT: "Tài khoản đã được xóa khỏi danh sách.",
    DELETE_SELECTED_SUCCESS_CONTENT:
      "Các tài khoản đã chọn đã được xóa khỏi danh sách.",
    DELETE_ERROR_TITLE: "Xóa tài khoản thất bại",

    SECURITY: "Bảo mật",
    LAST_LOGIN: "Đăng nhập gần nhất",
    ACCOUNT_LOCKED_SECURITY: "Tài khoản đang bị khóa",
    ACCOUNT_ACTIVE_SECURITY: "Tài khoản đang hoạt động bình thường",

    ACTIVE: "Hoạt động",
    LOCKED: "Đã khóa",
    NOT_UPDATED: "Chưa cập nhật",
    NOT_ASSIGNED: "Chưa phân quyền",
    DEFAULT_ERROR: "Đã có lỗi xảy ra. Vui lòng thử lại.",

    PAGINATION_TOTAL_PREFIX: "Hiển thị",
    PAGINATION_TOTAL_MIDDLE: "trong tổng",
    PAGINATION_TOTAL_SUFFIX: "tài khoản",

    ROLES: {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      DOCTOR: "Bác sĩ",
      NURSE: "Điều dưỡng",
      STAFF: "Staff",
      MEMBER: "Thai phụ",
      PARTNER: "Partner",
      OWNER: "Owner",
    },
  },

  USER_ACCOUNT_MODAL: {
    ADD_ACCOUNT: "Thêm tài khoản",
    UPDATE_ACCOUNT: "Cập nhật tài khoản",
    CREATE_ACCOUNT_DESCRIPTION:
      "Tạo tài khoản mới cho người dùng trong hệ thống.",
    UPDATE_ACCOUNT_DESCRIPTION:
      "Chỉnh sửa thông tin người dùng, vai trò, loại tài khoản và trạng thái.",

    PERSONAL_INFO: "Thông tin cá nhân",
    PERSONAL_INFO_DESCRIPTION: "Nhập họ tên, email và số điện thoại.",
    ACCOUNT_PERMISSION: "Phân quyền tài khoản",
    ACCOUNT_PERMISSION_DESCRIPTION:
      "Chọn vai trò, loại tài khoản và trạng thái.",

    NEW_ACCOUNT: "Tài khoản mới",
    NO_EMAIL: "Chưa có email",
    NOT_ENTERED: "Chưa nhập",
    NOT_SELECTED: "Chưa chọn",
    NOT_ASSIGNED: "Chưa phân quyền",
    DEFAULT_ERROR: "Đã có lỗi xảy ra. Vui lòng thử lại.",

    ACCOUNT_TYPE: "Loại tài khoản",
    SELECT_ROLE: "Chọn vai trò",
    SELECT_ACCOUNT_TYPE: "Chọn loại tài khoản",
    SELECT_STATUS: "Chọn trạng thái",
    ROLE_REQUIRED: "Vui lòng chọn vai trò",
    ACCOUNT_TYPE_REQUIRED: "Vui lòng chọn loại tài khoản",
    STATUS_REQUIRED: "Vui lòng chọn trạng thái",

    FULL_NAME_PLACEHOLDER: "Ví dụ: Nguyễn Lan",
    EMAIL_PLACEHOLDER: "lan@example.com",
    PHONE_PLACEHOLDER: "0901234567",
    NEW_PASSWORD: "Mật khẩu mới",
    PASSWORD_PLACEHOLDER: "Nhập mật khẩu",
    NEW_PASSWORD_PLACEHOLDER: "Bỏ trống nếu không đổi mật khẩu",
    PASSWORD_MIN_LENGTH: "Mật khẩu phải có ít nhất 6 ký tự",

    CREATE_SUCCESS_TITLE: "Thêm tài khoản thành công",
    CREATE_SUCCESS_CONTENT: "Tài khoản mới đã được thêm vào danh sách.",
    UPDATE_SUCCESS_TITLE: "Cập nhật tài khoản thành công",
    UPDATE_SUCCESS_CONTENT: "Thông tin tài khoản đã được cập nhật.",

    ACTIVE: "Hoạt động",
    LOCKED: "Đã khóa",

    ROLES: {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      DOCTOR: "Bác sĩ",
      NURSE: "Điều dưỡng",
      STAFF: "Staff",
      MEMBER: "Thai phụ",
      PARTNER: "Partner",
      OWNER: "Owner",
    },

    ACCOUNT_TYPES: {
      CUSTOMER: "Khách hàng",
      INTERNAL: "Nội bộ",
      SYSTEM: "Hệ thống",
    },
  },

  FACILITY_MANAGEMENT: {
    PAGE_TITLE: "Facility Management",
    PAGE_DESCRIPTION: "Quản lý danh sách cơ sở khám trong hệ thống.",

    DEFAULT_ERROR: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    LOAD_ERROR_DEFAULT: "Không tải được danh sách cơ sở",
    CREATE_ERROR_DEFAULT: "Không thể thêm cơ sở. Vui lòng thử lại.",
    UPDATE_ERROR_DEFAULT: "Không thể cập nhật cơ sở. Vui lòng thử lại.",
    DELETE_SINGLE_ERROR_DEFAULT: "Không thể xóa cơ sở",
    DELETE_SELECTED_ERROR_DEFAULT: "Không thể xóa các cơ sở đã chọn",

    NOT_UPDATED: "Chưa cập nhật",
    NOT_ENTERED: "Chưa nhập",
    NOT_SELECTED: "Chưa chọn",
    NO_CODE: "Chưa có mã",
    FACILITY_CODE_NOT_ENTERED: "Chưa nhập mã cơ sở",
    UNKNOWN_VALUE: "?",
    TIME_SEPARATOR: " · ",
    DATE_TIME_LOCALE: "vi-VN",

    FACILITY_CODE_EXISTS: "Mã cơ sở đã tồn tại. Vui lòng nhập mã cơ sở khác.",
    VALIDATION_FAILED:
      "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.",

    STT: "STT",
    FACILITY: "Cơ sở khám",
    NEW_FACILITY: "Cơ sở mới",
    FACILITY_NAME: "Tên cơ sở",
    FACILITY_CODE: "Mã cơ sở",

    FACILITY_INFO: "Thông tin cơ sở",
    FACILITY_INFO_CREATE_DESCRIPTION:
      "Nhập tên, mã cơ sở, liên hệ và trạng thái hoạt động.",
    FACILITY_INFO_UPDATE_DESCRIPTION:
      "Cập nhật tên, mã cơ sở, liên hệ và trạng thái hoạt động.",
    FACILITY_INFO_DETAIL_DESCRIPTION:
      "Liên hệ, mã cơ sở và địa chỉ hành chính.",

    ADD_FACILITY: "Thêm cơ sở",
    SAVE_FACILITY: "Lưu cơ sở",
    UPDATE_FACILITY: "Cập nhật cơ sở",
    ADD_FACILITY_TITLE: "Thêm cơ sở khám",
    UPDATE_FACILITY_TITLE: "Cập nhật cơ sở khám",
    ADD_FACILITY_DESCRIPTION:
      "Tạo cơ sở mới để quản lý lịch khám, dịch vụ và thông tin liên hệ.",
    UPDATE_FACILITY_DESCRIPTION:
      "Chỉnh sửa thông tin cơ sở khám, địa chỉ, liên hệ và trạng thái hoạt động.",

    SEARCH_PLACEHOLDER: "Tìm theo tên/địa chỉ/mã cơ sở",
    CITY_PLACEHOLDER: "Tỉnh/Thành phố",
    SERVICE_PLACEHOLDER: "Dịch vụ",
    STATUS_PLACEHOLDER: "Trạng thái",
    CLEAR_FILTERS: "Xóa bộ lọc",

    TOTAL_FACILITIES: "Tổng cơ sở",
    ACTIVE_FACILITIES: "Đang hoạt động",
    SUSPENDED_FACILITIES: "Tạm ngưng",

    FACILITY_LIST_TITLE: "Danh sách cơ sở khám",
    FACILITY_LIST_DESCRIPTION: "Click vào một dòng để xem chi tiết cơ sở khám.",
    DELETE_SELECTED: "Xóa đã chọn",

    ADDRESS: "Địa chỉ",
    FULL_ADDRESS: "Địa chỉ đầy đủ",
    CITY: "Tỉnh/Thành phố",
    DISTRICT: "Quận/Huyện",
    WARD: "Phường/Xã",
    LATITUDE: "Vĩ độ",
    LONGITUDE: "Kinh độ",
    COORDINATES: "Tọa độ",

    HOTLINE: "Hotline",
    PHONE: "Số điện thoại",
    EMAIL: "Email",
    STATUS: "Trạng thái",

    LOCATION_TIME: "Vị trí & thời gian",
    LOCATION_TIME_CREATE_DESCRIPTION:
      "Cập nhật địa chỉ, khu vực và tọa độ cơ sở.",
    LOCATION_TIME_UPDATE_DESCRIPTION:
      "Cập nhật địa chỉ, khu vực, tọa độ và thời gian hoạt động.",

    SYSTEM_TIME: "Thời gian & hệ thống",
    SYSTEM_TIME_DESCRIPTION:
      "Giờ mở cửa, giờ đóng cửa, tọa độ và lịch sử cập nhật.",
    DETAIL_CONTACT_SECTION: "Thông tin cơ sở",
    DETAIL_SYSTEM_SECTION: "Thời gian & hệ thống",

    WORKING_HOURS: "Giờ hoạt động",
    WORKING_DAYS: "Ngày hoạt động",
    OPEN_TIME: "Giờ mở cửa",
    CLOSE_TIME: "Giờ đóng cửa",
    TIME: "Thời gian",
    DAY_NOT_ENTERED: "Ngày chưa nhập",
    TIME_NOT_ENTERED: "Giờ chưa nhập",

    FEATURED_SERVICES: "Dịch vụ nổi bật",
    SERVICES_NOTE: "Dịch vụ & ghi chú",
    INTERNAL_NOTE: "Ghi chú nội bộ",
    FEATURED_SERVICES_NOT_ENTERED: "Chưa nhập dịch vụ nổi bật.",
    VIEW_ROOMS: "Xem phòng",

    CREATED_AT: "Ngày tạo",
    UPDATED_AT: "Cập nhật lần cuối",
    ACTIONS: "Thao tác",
    VIEW_DETAIL: "Xem chi tiết",
    EDIT: "Sửa",
    DELETE: "Xóa",

    ACTIVE: "Hoạt động",
    ACTIVE_DISPLAY: "Đang hoạt động",
    SUSPENDED: "Tạm ngưng",

    CREATE_SUCCESS_TITLE: "Thêm cơ sở thành công",
    CREATE_SUCCESS_CONTENT:
      "Cơ sở khám mới đã được tạo và hiển thị trong danh sách.",
    CREATE_ERROR_TITLE: "Thêm cơ sở thất bại",

    UPDATE_SUCCESS_TITLE: "Cập nhật cơ sở thành công",
    UPDATE_SUCCESS_CONTENT: "Thông tin cơ sở khám đã được cập nhật.",
    UPDATE_ERROR_TITLE: "Cập nhật cơ sở thất bại",

    DELETE_SUCCESS_TITLE: "Xóa cơ sở thành công",
    DELETE_SINGLE_SUCCESS_CONTENT: "Cơ sở đã được xóa khỏi danh sách.",
    DELETE_SELECTED_SUCCESS_CONTENT:
      "Các cơ sở đã chọn đã được xóa khỏi danh sách.",
    DELETE_ERROR_TITLE: "Xóa cơ sở thất bại",
    DELETE_FACILITY: "Xóa cơ sở",
    DELETE_SELECTED_FACILITIES: "Xóa cơ sở đã chọn",
    DELETE_SINGLE_CONFIRM: "Bạn có chắc chắn muốn xóa cơ sở này không?",
    DELETE_SELECTED_CONFIRM_PREFIX: "Bạn có chắc chắn muốn xóa",
    DELETE_SELECTED_CONFIRM_SUFFIX: "cơ sở đã chọn không?",

    CONFIRM_UPDATE_TITLE: "Xác nhận cập nhật cơ sở",
    CONFIRM_UPDATE_DESCRIPTION:
      "Vui lòng nhập lý do cập nhật trước khi lưu thay đổi.",
    UPDATE_REASON: "Lý do cập nhật",
    UPDATE_REASON_REQUIRED: "Vui lòng nhập lý do cập nhật.",
    UPDATE_REASON_PLACEHOLDER:
      "Ví dụ: Cập nhật địa chỉ cơ sở, thay đổi hotline, điều chỉnh trạng thái hoạt động...",

    PAGINATION_TOTAL_PREFIX: "Hiển thị",
    PAGINATION_TOTAL_MIDDLE: "trong tổng",
    PAGINATION_TOTAL_SUFFIX: "cơ sở",

    PLACEHOLDERS: {
      NAME: "Ví dụ: Phòng khám Sản Phụ khoa An Tâm",
      CODE: "Ví dụ: PK-SA-001",
      PHONE: "024.3825.5555",
      EMAIL: "hotro@khamasantam.vn",
      ADDRESS: "Số 45 Đường Láng",
      CITY: "Hà Nội",
      DISTRICT: "Đống Đa",
      WARD: "Láng Thượng",
      LATITUDE: "21.0285000",
      LONGITUDE: "105.8372000",
      WORKING_DAYS: "Thứ 2 - Chủ nhật",
      SERVICES: "Ví dụ: Khám thai, Siêu âm, Xét nghiệm",
      INTERNAL_NOTE: "Ghi chú cho nhân sự nội bộ",
    },

    VALIDATION: {
      NAME_REQUIRED: "Vui lòng nhập tên cơ sở",
      CODE_REQUIRED: "Vui lòng nhập mã cơ sở",
      PHONE_REQUIRED: "Vui lòng nhập số điện thoại",
      EMAIL_INVALID: "Email không hợp lệ",
      STATUS_REQUIRED: "Vui lòng chọn trạng thái",
      ADDRESS_REQUIRED: "Vui lòng nhập địa chỉ",
      CITY_REQUIRED: "Vui lòng nhập tỉnh/thành phố",
      DISTRICT_REQUIRED: "Vui lòng nhập quận/huyện",
      WARD_REQUIRED: "Vui lòng nhập phường/xã",
    },

    SERVICES: {
      ANTENATAL_CARE: "Khám thai",
      ULTRASOUND: "Siêu âm",
      TESTING: "Xét nghiệm",
      CONSULTING: "Tư vấn",
    },
  },

  CLINIC_ROOM_MANAGEMENT: {
    PAGE_TITLE: "Clinic Room Management",
    PAGE_DESCRIPTION: "Quản lý danh sách phòng khám tại cơ sở.",

    DEFAULT_ERROR: "Đã có lỗi xảy ra. Vui lòng thử lại.",
    VALIDATION_FAILED:
      "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.",
    NOT_UPDATED: "Chưa cập nhật",
    NOT_ENTERED: "Chưa nhập",
    NOT_SELECTED_ROOM_TYPE: "Chưa chọn loại phòng",
    DATE_TIME_LOCALE: "vi-VN",
    LOADING_ROOMS: "Đang tải danh sách phòng khám...",

    STT: "STT",
    FACILITY: "Cơ sở khám",
    SELECTED_FACILITY_FALLBACK: "cơ sở đã chọn",
    ROOMS_AT_FACILITY_PREFIX: "Phòng khám tại",
    ALL_ROOMS_TITLE: "Tất cả phòng khám",
    FILTERED_FACILITY_DESCRIPTION:
      "Danh sách phòng được lọc theo cơ sở khám đã chọn.",
    ALL_ROOMS_DESCRIPTION:
      "Quản lý phòng, loại phòng, tầng, sức chứa và trạng thái hoạt động.",

    SEARCH_PLACEHOLDER: "Tìm theo tên phòng",
    ROOM_TYPE_PLACEHOLDER: "Loại phòng",
    STATUS_PLACEHOLDER: "Trạng thái",
    CLEAR_FILTERS: "Xóa bộ lọc",

    TOTAL_ROOMS: "Tổng phòng",
    ACTIVE_ROOMS: "Đang hoạt động",
    SUSPENDED_ROOMS: "Tạm ngưng",

    ROOM_LIST_TITLE: "Danh sách phòng khám",
    ROOM_LIST_DESCRIPTION:
      "Click vào một dòng hoặc icon con mắt để xem chi tiết phòng khám.",
    DELETE_SELECTED: "Xóa đã chọn",
    ADD_ROOM: "Thêm phòng",
    SAVE_ROOM: "Lưu phòng",
    UPDATE_ROOM: "Cập nhật phòng",

    ROOM_NAME: "Tên phòng",
    ROOM_TYPE: "Loại phòng",
    FLOOR: "Tầng",
    CAPACITY: "Sức chứa",
    STATUS: "Trạng thái",
    ACTIONS: "Thao tác",
    ROOM_CODE: "Mã phòng",
    CREATED_AT: "Ngày tạo",
    UPDATED_AT: "Cập nhật lần cuối",
    VIEW_DETAIL: "Xem chi tiết",
    EDIT: "Sửa",
    DELETE: "Xóa",
    PERSON_SUFFIX: "người",
    FLOOR_PREFIX: "Tầng",

    ACTIVE: "Đang hoạt động",
    SUSPENDED: "Tạm ngưng",

    CREATE_SUCCESS_TITLE: "Thêm phòng thành công",
    CREATE_SUCCESS_CONTENT: "Phòng khám mới đã được thêm vào danh sách.",
    CREATE_ERROR_TITLE: "Thêm phòng thất bại",

    UPDATE_SUCCESS_TITLE: "Cập nhật phòng thành công",
    UPDATE_SUCCESS_CONTENT: "Thông tin phòng khám đã được cập nhật.",
    UPDATE_ERROR_TITLE: "Cập nhật phòng thất bại",

    DELETE_SUCCESS_TITLE: "Xóa phòng thành công",
    DELETE_SINGLE_SUCCESS_CONTENT: "Phòng khám đã được xóa khỏi danh sách.",
    DELETE_SELECTED_SUCCESS_CONTENT:
      "Các phòng đã chọn đã được xóa khỏi danh sách.",
    DELETE_ERROR_TITLE: "Xóa phòng thất bại",
    DELETE_ROOM: "Xóa phòng khám",
    DELETE_SELECTED_ROOMS: "Xóa phòng đã chọn",
    DELETE_SINGLE_CONFIRM:
      "Bạn có chắc chắn muốn xóa phòng khám này không?",
    DELETE_SELECTED_CONFIRM_PREFIX: "Bạn có chắc chắn muốn xóa",
    DELETE_SELECTED_CONFIRM_SUFFIX: "phòng đã chọn không?",

    DETAIL_CLOSE: "Đóng",
    CANCEL: "Hủy",

    ADD_ROOM_TITLE: "Thêm phòng khám",
    UPDATE_ROOM_TITLE: "Cập nhật phòng khám",
    ADD_ROOM_DESCRIPTION: "Tạo phòng khám mới trong cơ sở.",
    UPDATE_ROOM_DESCRIPTION:
      "Chỉnh sửa thông tin phòng khám, loại phòng, tầng, sức chứa và trạng thái.",

    ROOM_INFO: "Thông tin phòng khám",
    ROOM_INFO_DESCRIPTION:
      "Nhập tên phòng, loại phòng và trạng thái hoạt động.",
    ROOM_SETTINGS: "Thiết lập phòng",
    ROOM_SETTINGS_DESCRIPTION: "Cập nhật tầng và sức chứa của phòng khám.",
    NEW_ROOM: "Phòng khám mới",

    CONFIRM_UPDATE_TITLE: "Xác nhận cập nhật phòng",
    CONFIRM_UPDATE_DESCRIPTION:
      "Bạn có chắc chắn muốn cập nhật thông tin phòng khám này không?",

    PLACEHOLDERS: {
      ROOM_NAME: "Ví dụ: P101",
      ROOM_TYPE: "Chọn loại phòng",
      STATUS: "Chọn trạng thái",
      FLOOR: "Ví dụ: 1",
      CAPACITY: "Ví dụ: 2",
    },

    VALIDATION: {
      ROOM_NAME_REQUIRED: "Vui lòng nhập tên phòng",
      ROOM_TYPE_REQUIRED: "Vui lòng chọn loại phòng",
      STATUS_REQUIRED: "Vui lòng chọn trạng thái",
      FLOOR_REQUIRED: "Vui lòng nhập tầng",
      CAPACITY_REQUIRED: "Vui lòng nhập sức chứa",
    },

    ROOM_TYPES: {
      ULTRASOUND: "Siêu âm",
      TESTING: "Xét nghiệm",
      CONSULTING: "Tư vấn",
      ANTENATAL_CARE: "Khám thai",
      EMERGENCY: "Cấp cứu",
    },

    PAGINATION_TOTAL_PREFIX: "Hiển thị",
    PAGINATION_TOTAL_MIDDLE: "trong tổng",
    PAGINATION_TOTAL_SUFFIX: "phòng",
  },
};
