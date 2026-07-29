"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
} from "antd/es/table";
import {
  Baby,
  BadgeCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ContactRound,
  Crown,
  Eye,
  FileBadge2,
  HeartPulse,
  IdCard,
  Lock,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import {
  PageHeader,
} from "@/management/components/ui/PageHeader";

const {
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type AccountStatus =
  | "active"
  | "inactive"
  | "locked";

type PregnancyStatus =
  | "pregnant"
  | "postpartum"
  | "completed";

type RiskLevel =
  | "normal"
  | "monitor"
  | "high";

type ExaminationPriority =
  | "package"
  | "regular";


type PregnantUser = {
  id: string;
  patientCode: string;
  fullName: string;
  citizenId: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  nationality: string;
  address: string;

  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;

  pregnancyStatus: PregnancyStatus;
  gestationalWeek?: number;
  expectedDueDate?: string;
  riskLevel: RiskLevel;

  examinationPriority: ExaminationPriority;
  packageName?: string;
  packageCode?: string;
  packageExpiryDate?: string;

  facilityId?: string;
  facilityName?: string;
  lastVisitAt?: string;

  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

type PregnantUserFormValues = {
  fullName: string;
  citizenId: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  nationality: string;
  address: string;

  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;

  pregnancyStatus: PregnancyStatus;
  gestationalWeek?: number;
  expectedDueDate?: string;
  riskLevel: RiskLevel;

  examinationPriority: ExaminationPriority;
  packageName?: string;
  packageCode?: string;
  packageExpiryDate?: string;

  facilityId?: string;
  lastVisitAt?: string;

  accountStatus: AccountStatus;
};

type FacilityOption = {
  id: string;
  name: string;
  code: string;
};

const FACILITIES: FacilityOption[] = [
  {
    id: "FAC-001",
    name:
      "Phòng khám Maternity Care Hà Nội",
    code: "MCS-HN",
  },
  {
    id: "FAC-002",
    name:
      "Phòng khám Maternity Care Cầu Giấy",
    code: "MCS-CG",
  },
  {
    id: "FAC-003",
    name:
      "Phòng khám Maternity Care Hồ Chí Minh",
    code: "MCS-HCM",
  },
];

const PREGNANCY_STATUS_OPTIONS: Array<{
  value: PregnancyStatus;
  label: string;
}> = [
  {
    value: "pregnant",
    label: "Đang mang thai",
  },
  {
    value: "postpartum",
    label: "Sau sinh",
  },
  {
    value: "completed",
    label: "Đã kết thúc theo dõi",
  },
];

const RISK_LEVEL_OPTIONS: Array<{
  value: RiskLevel;
  label: string;
}> = [
  {
    value: "normal",
    label: "Bình thường",
  },
  {
    value: "monitor",
    label: "Cần theo dõi",
  },
  {
    value: "high",
    label: "Nguy cơ cao",
  },
];

const EXAMINATION_PRIORITY_OPTIONS: Array<{
  value: ExaminationPriority;
  label: string;
}> = [
  {
    value: "package",
    label: "Có gói khám - ưu tiên dịch vụ",
  },
  {
    value: "regular",
    label: "Khám thường",
  },
];

const ACCOUNT_STATUS_OPTIONS: Array<{
  value: AccountStatus;
  label: string;
}> = [
  {
    value: "active",
    label: "Đang hoạt động",
  },
  {
    value: "inactive",
    label: "Ngừng hoạt động",
  },
  {
    value: "locked",
    label: "Đã khóa",
  },
];


const INITIAL_USERS: PregnantUser[] = [
  {
    id: "USR-001",
    patientCode: "MOM-0001",
    fullName: "Nguyễn Thị Mai",
    citizenId: "001197008451",
    dateOfBirth: "1997-05-12",
    phone: "0901234501",
    email: "mai.nguyen@gmail.com",
    nationality: "Việt Nam",
    address:
      "Thanh Xuân, Hà Nội",
    emergencyContactName:
      "Nguyễn Văn Hùng",
    emergencyContactRelationship:
      "Chồng",
    emergencyContactPhone:
      "0912345601",
    pregnancyStatus: "pregnant",
    gestationalWeek: 12,
    expectedDueDate: "2027-02-08",
    riskLevel: "normal",
    examinationPriority: "package",
    packageName:
      "Gói thai sản An Tâm",
    packageCode: "PKG-AT-001",
    packageExpiryDate: "2027-03-01",
    facilityId: "FAC-001",
    facilityName:
      "Phòng khám Maternity Care Hà Nội",
    lastVisitAt:
      "2026-07-26T03:30:00.000Z",
    accountStatus: "active",
    createdAt:
      "2026-05-02T12:30:00.000Z",
    updatedAt:
      "2026-07-26T03:30:00.000Z",
  },
  {
    id: "USR-002",
    patientCode: "MOM-0002",
    fullName: "Trần Ngọc Anh",
    citizenId: "001193002864",
    dateOfBirth: "1993-09-21",
    phone: "0901234502",
    email:
      "ngocanh.tran@gmail.com",
    nationality: "Việt Nam",
    address: "Cầu Giấy, Hà Nội",
    emergencyContactName:
      "Trần Đức Long",
    emergencyContactRelationship:
      "Chồng",
    emergencyContactPhone:
      "0912345602",
    pregnancyStatus: "pregnant",
    gestationalWeek: 28,
    expectedDueDate: "2026-10-18",
    riskLevel: "monitor",
    examinationPriority: "regular",
    facilityId: "FAC-002",
    facilityName:
      "Phòng khám Maternity Care Cầu Giấy",
    lastVisitAt:
      "2026-07-27T08:00:00.000Z",
    accountStatus: "active",
    createdAt:
      "2026-03-14T02:20:00.000Z",
    updatedAt:
      "2026-07-27T08:00:00.000Z",
  },
  {
    id: "USR-003",
    patientCode: "MOM-0003",
    fullName: "Phạm Thu Hương",
    citizenId: "001189006327",
    dateOfBirth: "1989-11-03",
    phone: "0901234503",
    email:
      "thuhuong.pham@gmail.com",
    nationality: "Việt Nam",
    address: "Ba Đình, Hà Nội",
    emergencyContactName:
      "Phạm Quốc Bảo",
    emergencyContactRelationship:
      "Chồng",
    emergencyContactPhone:
      "0912345603",
    pregnancyStatus: "pregnant",
    gestationalWeek: 34,
    expectedDueDate: "2026-09-09",
    riskLevel: "high",
    examinationPriority: "package",
    packageName:
      "Gói thai sản Toàn Diện",
    packageCode: "PKG-TD-003",
    packageExpiryDate: "2026-10-30",
    facilityId: "FAC-001",
    facilityName:
      "Phòng khám Maternity Care Hà Nội",
    lastVisitAt:
      "2026-07-28T02:45:00.000Z",
    accountStatus: "active",
    createdAt:
      "2026-01-21T04:10:00.000Z",
    updatedAt:
      "2026-07-28T02:45:00.000Z",
  },
  {
    id: "USR-004",
    patientCode: "MOM-0004",
    fullName: "Lê Khánh Linh",
    citizenId: "001199001752",
    dateOfBirth: "1999-02-17",
    phone: "0901234504",
    email:
      "khanhlinh.le@gmail.com",
    nationality: "Việt Nam",
    address: "Hà Đông, Hà Nội",
    emergencyContactName:
      "Lê Minh Quân",
    emergencyContactRelationship:
      "Chồng",
    emergencyContactPhone:
      "0912345604",
    pregnancyStatus: "postpartum",
    riskLevel: "normal",
    examinationPriority: "regular",
    facilityId: "FAC-002",
    facilityName:
      "Phòng khám Maternity Care Cầu Giấy",
    lastVisitAt:
      "2026-07-22T07:15:00.000Z",
    accountStatus: "active",
    createdAt:
      "2025-11-18T09:30:00.000Z",
    updatedAt:
      "2026-07-22T07:15:00.000Z",
  },
  {
    id: "USR-005",
    patientCode: "MOM-0005",
    fullName: "Võ Thị Thanh",
    citizenId: "079195004281",
    dateOfBirth: "1995-07-26",
    phone: "0901234505",
    email:
      "thanh.vo@gmail.com",
    nationality: "Việt Nam",
    address:
      "Quận 3, TP. Hồ Chí Minh",
    emergencyContactName:
      "Võ Minh Tâm",
    emergencyContactRelationship:
      "Chồng",
    emergencyContactPhone:
      "0912345605",
    pregnancyStatus: "pregnant",
    gestationalWeek: 20,
    expectedDueDate: "2026-12-16",
    riskLevel: "normal",
    examinationPriority: "package",
    packageName:
      "Gói theo dõi thai kỳ Nâng Cao",
    packageCode: "PKG-NC-005",
    packageExpiryDate: "2027-01-15",
    facilityId: "FAC-003",
    facilityName:
      "Phòng khám Maternity Care Hồ Chí Minh",
    lastVisitAt:
      "2026-07-18T04:20:00.000Z",
    accountStatus: "locked",
    createdAt:
      "2026-04-01T06:45:00.000Z",
    updatedAt:
      "2026-07-25T06:45:00.000Z",
  },
  {
    id: "USR-006",
    patientCode: "MOM-0006",
    fullName: "Đỗ Minh Châu",
    citizenId: "079191008613",
    dateOfBirth: "1991-12-11",
    phone: "0901234506",
    email:
      "minhchau.do@gmail.com",
    nationality: "Việt Nam",
    address:
      "Thủ Đức, TP. Hồ Chí Minh",
    emergencyContactName:
      "Đỗ Thanh Nam",
    emergencyContactRelationship:
      "Chồng",
    emergencyContactPhone:
      "0912345606",
    pregnancyStatus: "completed",
    riskLevel: "normal",
    examinationPriority: "regular",
    facilityId: "FAC-003",
    facilityName:
      "Phòng khám Maternity Care Hồ Chí Minh",
    lastVisitAt:
      "2026-06-20T03:10:00.000Z",
    accountStatus: "inactive",
    createdAt:
      "2025-08-12T03:10:00.000Z",
    updatedAt:
      "2026-06-20T03:10:00.000Z",
  },
  {
    id: "USR-007",
    patientCode: "MOM-0007",
    fullName: "Bùi Hải Yến",
    citizenId: "001200009946",
    dateOfBirth: "2000-01-25",
    phone: "0901234507",
    email:
      "haiyen.bui@gmail.com",
    nationality: "Việt Nam",
    address:
      "Nam Từ Liêm, Hà Nội",
    emergencyContactName:
      "Bùi Văn Nam",
    emergencyContactRelationship:
      "Anh trai",
    emergencyContactPhone:
      "0912345607",
    pregnancyStatus: "pregnant",
    gestationalWeek: 8,
    expectedDueDate: "2027-03-05",
    riskLevel: "monitor",
    examinationPriority: "regular",
    facilityId: "FAC-001",
    facilityName:
      "Phòng khám Maternity Care Hà Nội",
    lastVisitAt:
      "2026-07-24T05:00:00.000Z",
    accountStatus: "active",
    createdAt:
      "2026-06-22T05:00:00.000Z",
    updatedAt:
      "2026-07-24T05:00:00.000Z",
  },
];

function formatDate(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

function getInitials(
  fullName: string,
) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    parts
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "TP"
  );
}


function renderPregnancyStatus(
  value: PregnancyStatus,
) {
  if (value === "pregnant") {
    return (
      <Tag color="pink">
        Đang mang thai
      </Tag>
    );
  }

  if (value === "postpartum") {
    return (
      <Tag color="purple">
        Sau sinh
      </Tag>
    );
  }

  return (
    <Tag>
      Đã kết thúc theo dõi
    </Tag>
  );
}

function renderRiskLevel(
  value: RiskLevel,
) {
  if (value === "high") {
    return (
      <Tag color="red">
        Nguy cơ cao
      </Tag>
    );
  }

  if (value === "monitor") {
    return (
      <Tag color="gold">
        Cần theo dõi
      </Tag>
    );
  }

  return (
    <Tag color="green">
      Bình thường
    </Tag>
  );
}

function renderExaminationPriority(
  value: ExaminationPriority,
  packageName?: string,
) {
  if (value === "package") {
    return (
      <div className="space-y-1">
        <Tag
          color="purple"
          icon={
            <Crown className="h-3.5 w-3.5" />
          }
        >
          Ưu tiên gói khám
        </Tag>

        {packageName ? (
          <Text
            type="secondary"
            className="block text-xs"
          >
            {packageName}
          </Text>
        ) : null}
      </div>
    );
  }

  return (
    <Tag>
      Khám thường
    </Tag>
  );
}

function renderAccountStatus(
  value: AccountStatus,
) {
  if (value === "active") {
    return (
      <Tag color="green">
        Đang hoạt động
      </Tag>
    );
  }

  if (value === "locked") {
    return (
      <Tag color="red">
        Đã khóa
      </Tag>
    );
  }

  return (
    <Tag>
      Ngừng hoạt động
    </Tag>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="h-full rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
            {label}
          </p>

          <div className="break-words text-sm font-semibold text-slate-900">
            {value ||
              "Chưa cập nhật"}
          </div>
        </div>
      </div>
    </div>
  );
}

type PregnantUserFormModalProps = {
  open: boolean;
  user: PregnantUser | null;
  users: PregnantUser[];
  onClose: () => void;
  onSave: (
    values: PregnantUserFormValues,
  ) => void;
};

function PregnantUserFormModal({
  open,
  user,
  users,
  onClose,
  onSave,
}: PregnantUserFormModalProps) {
  const [form] =
    Form.useForm<PregnantUserFormValues>();

  const pregnancyStatus =
    Form.useWatch(
      "pregnancyStatus",
      form,
    );

  const examinationPriority =
    Form.useWatch(
      "examinationPriority",
      form,
    );

  useEffect(() => {
    if (!open) return;

    const timer =
      window.setTimeout(() => {
        if (user) {
          form.setFieldsValue({
            fullName: user.fullName,
            citizenId: user.citizenId,
            dateOfBirth:
              user.dateOfBirth,
            phone: user.phone,
            email: user.email,
            nationality:
              user.nationality,
            address: user.address,
            emergencyContactName:
              user.emergencyContactName,
            emergencyContactRelationship:
              user.emergencyContactRelationship,
            emergencyContactPhone:
              user.emergencyContactPhone,
            pregnancyStatus:
              user.pregnancyStatus,
            gestationalWeek:
              user.gestationalWeek,
            expectedDueDate:
              user.expectedDueDate,
            riskLevel:
              user.riskLevel,
            examinationPriority:
              user.examinationPriority,
            packageName:
              user.packageName,
            packageCode:
              user.packageCode,
            packageExpiryDate:
              user.packageExpiryDate,
            facilityId:
              user.facilityId,
            lastVisitAt:
              user.lastVisitAt?.slice(
                0,
                10,
              ),
            accountStatus:
              user.accountStatus,
          });
          return;
        }

        form.resetFields();
        form.setFieldsValue({
          fullName: "",
          citizenId: "",
          dateOfBirth: "",
          phone: "",
          email: "",
          nationality: "Việt Nam",
                      address: "",
          emergencyContactName: "",
          emergencyContactRelationship:
            "",
          emergencyContactPhone: "",
          pregnancyStatus: "pregnant",
          gestationalWeek:
            undefined,
          expectedDueDate: "",
          riskLevel: "normal",
          examinationPriority:
            "regular",
          packageName: "",
          packageCode: "",
          packageExpiryDate: "",
          facilityId: undefined,
          lastVisitAt: "",
          accountStatus: "active",
        });
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [
    form,
    open,
    user,
  ]);

  return (
    <Modal
      open={open}
      centered
      width={980}
      forceRender
      destroyOnHidden={false}
      title={
        user
          ? "Cập nhật thai phụ"
          : "Thêm thai phụ"
      }
      okText={
        user
          ? "Lưu thay đổi"
          : "Tạo tài khoản"
      }
      cancelText="Hủy"
      onCancel={onClose}
      onOk={() =>
        form.submit()
      }
      mask={{
        closable: true,
      }}
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      <Form<PregnantUserFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onSave}
      >
        <div className="mb-5 rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-pink-700">
          Màn hình này quản lý thông tin tài khoản và hồ sơ hành chính của thai phụ. Thông số y tế chuyên sâu được quản lý trong hồ sơ thai kỳ.
        </div>

        <Card
          size="small"
          className="mb-5 border-slate-200"
          title="Thông tin hành chính"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      "Vui lòng nhập họ và tên.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Nhập họ và tên"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="citizenId"
                label="Căn cước công dân"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng nhập căn cước công dân.",
                  },
                  {
                    pattern:
                      /^\d{12}$/,
                    message:
                      "Căn cước công dân phải gồm 12 chữ số.",
                  },
                  {
                    validator: async (
                      _rule,
                      value?: string,
                    ) => {
                      if (!value) return;

                      const duplicated =
                        users.some(
                          (item) =>
                            item.id !==
                              user?.id &&
                            item.citizenId ===
                              value.trim(),
                        );

                      if (duplicated) {
                        throw new Error(
                          "Căn cước công dân đã tồn tại.",
                        );
                      }
                    },
                  },
                ]}
              >
                <Input
                  size="large"
                  maxLength={12}
                  placeholder="Nhập 12 chữ số"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn ngày sinh.",
                  },
                ]}
              >
                <Input
                  size="large"
                  type="date"
                />
              </Form.Item>
            </Col>


            <Col xs={24} md={12}>
              <Form.Item
                name="nationality"
                label="Quốc tịch"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      "Vui lòng nhập quốc tịch.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Việt Nam"
                />
              </Form.Item>
            </Col>



            <Col xs={24}>
              <Form.Item
                name="address"
                label="Địa chỉ thường trú"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      "Vui lòng nhập địa chỉ thường trú.",
                  },
                ]}
              >
                <TextArea
                  rows={3}
                  maxLength={300}
                  showCount
                  placeholder="Nhập địa chỉ thường trú"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          className="mb-5 border-slate-200"
          title="Thông tin liên hệ"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng nhập số điện thoại.",
                  },
                  {
                    pattern:
                      /^(0|\+84)[0-9]{9,10}$/,
                    message:
                      "Số điện thoại không hợp lệ.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="0901234567"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng nhập email.",
                  },
                  {
                    type: "email",
                    message:
                      "Email không đúng định dạng.",
                  },
                  {
                    validator: async (
                      _rule,
                      value?: string,
                    ) => {
                      const normalized =
                        value
                          ?.trim()
                          .toLowerCase();

                      if (!normalized) return;

                      const duplicated =
                        users.some(
                          (item) =>
                            item.id !==
                              user?.id &&
                            item.email
                              .trim()
                              .toLowerCase() ===
                              normalized,
                        );

                      if (duplicated) {
                        throw new Error(
                          "Email đã được sử dụng.",
                        );
                      }
                    },
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="name@example.com"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="emergencyContactName"
                label="Người liên hệ khẩn cấp"
              >
                <Input
                  size="large"
                  placeholder="Họ và tên"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="emergencyContactRelationship"
                label="Mối quan hệ"
              >
                <Input
                  size="large"
                  placeholder="Ví dụ: Chồng"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="emergencyContactPhone"
                label="SĐT liên hệ khẩn cấp"
                rules={[
                  {
                    pattern:
                      /^(0|\+84)[0-9]{9,10}$/,
                    message:
                      "Số điện thoại không hợp lệ.",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="0912345678"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          className="mb-5 border-purple-100"
          title="Gói khám và ưu tiên dịch vụ"
        >
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ưu tiên gói khám chỉ áp dụng khi các thai phụ có cùng mức độ khẩn cấp. Trường hợp nguy cơ cao hoặc cấp cứu luôn được ưu tiên theo chỉ định y khoa.
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="examinationPriority"
                label="Hình thức khám"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn hình thức khám.",
                  },
                ]}
              >
                <Select
                  size="large"
                  options={
                    EXAMINATION_PRIORITY_OPTIONS
                  }
                />
              </Form.Item>
            </Col>

            {examinationPriority ===
            "package" ? (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="packageName"
                    label="Tên gói khám"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message:
                          "Vui lòng nhập tên gói khám.",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Ví dụ: Gói thai sản An Tâm"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="packageCode"
                    label="Mã gói khám"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message:
                          "Vui lòng nhập mã gói khám.",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Ví dụ: PKG-AT-001"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="packageExpiryDate"
                    label="Ngày hết hạn gói"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng chọn ngày hết hạn gói.",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      type="date"
                    />
                  </Form.Item>
                </Col>
              </>
            ) : null}
          </Row>
        </Card>

        <Card
          size="small"
          className="mb-5 border-slate-200"
          title="Thông tin theo dõi thai kỳ"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="pregnancyStatus"
                label="Trạng thái theo dõi"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn trạng thái theo dõi.",
                  },
                ]}
              >
                <Select
                  size="large"
                  options={
                    PREGNANCY_STATUS_OPTIONS
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="riskLevel"
                label="Mức độ theo dõi"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn mức độ theo dõi.",
                  },
                ]}
              >
                <Select
                  size="large"
                  options={
                    RISK_LEVEL_OPTIONS
                  }
                />
              </Form.Item>
            </Col>

            {pregnancyStatus ===
            "pregnant" ? (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="gestationalWeek"
                    label="Tuần thai hiện tại"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng nhập tuần thai.",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={42}
                      className="w-full"
                      size="large"
                      placeholder="1 - 42"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="expectedDueDate"
                    label="Ngày dự sinh"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng chọn ngày dự sinh.",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      type="date"
                    />
                  </Form.Item>
                </Col>
              </>
            ) : null}

            <Col xs={24} md={12}>
              <Form.Item
                name="facilityId"
                label="Cơ sở theo dõi"
              >
                <Select
                  size="large"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn cơ sở"
                  options={FACILITIES.map(
                    (facility) => ({
                      value:
                        facility.id,
                      label: `${facility.name} (${facility.code})`,
                    }),
                  )}
                />
              </Form.Item>
            </Col>


            <Col xs={24}>
              <Form.Item
                name="lastVisitAt"
                label="Lần khám gần nhất"
              >
                <Input
                  size="large"
                  type="date"
                />
              </Form.Item>
            </Col>

          </Row>
        </Card>

        <Form.Item
          name="accountStatus"
          label="Trạng thái tài khoản"
          rules={[
            {
              required: true,
              message:
                "Vui lòng chọn trạng thái tài khoản.",
            },
          ]}
        >
          <Select
            size="large"
            options={
              ACCOUNT_STATUS_OPTIONS
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type PregnantUserDetailModalProps = {
  open: boolean;
  user: PregnantUser | null;
  onClose: () => void;
  onEdit: (
    user: PregnantUser,
  ) => void;
};

function PregnantUserDetailModal({
  open,
  user,
  onClose,
  onEdit,
}: PregnantUserDetailModalProps) {
  return (
    <Modal
      open={open}
      centered
      width={1000}
      title={null}
      footer={null}
      onCancel={onClose}
      mask={{
        closable: true,
      }}
      styles={{
        body: {
          maxHeight:
            "calc(100vh - 160px)",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      {user ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar
                size={62}
                className="!bg-pink-500 !text-base !font-semibold"
              >
                {getInitials(
                  user.fullName,
                )}
              </Avatar>

              <div className="min-w-0">
                <Title
                  level={3}
                  className="!mb-1 !text-slate-950"
                >
                  {user.fullName}
                </Title>

                <Text
                  type="secondary"
                  className="mb-2 block"
                >
                  {user.patientCode}
                </Text>

                <Space size={8} wrap>
                  {renderPregnancyStatus(
                    user.pregnancyStatus,
                  )}

                  {renderRiskLevel(
                    user.riskLevel,
                  )}

                  {renderAccountStatus(
                    user.accountStatus,
                  )}
                </Space>
              </div>
            </div>

            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                onEdit(user)
              }
            >
              Cập nhật
            </Button>
          </div>

          <DetailSection
            title="Thông tin hành chính"
            icon={
              <IdCard className="h-5 w-5" />
            }
          >
            <InfoCard
              icon={
                <IdCard className="h-4 w-4" />
              }
              label="Căn cước công dân"
              value={user.citizenId}
            />

            <InfoCard
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Ngày sinh"
              value={formatDate(
                user.dateOfBirth,
              )}
            />

            <InfoCard
              icon={
                <BadgeCheck className="h-4 w-4" />
              }
              label="Quốc tịch"
              value={user.nationality}
            />

            <InfoCard
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Địa chỉ thường trú"
              value={user.address}
            />
          </DetailSection>

          <DetailSection
            title="Thông tin liên hệ"
            icon={
              <Phone className="h-5 w-5" />
            }
          >
            <InfoCard
              icon={
                <Phone className="h-4 w-4" />
              }
              label="Số điện thoại"
              value={user.phone}
            />

            <InfoCard
              icon={
                <Mail className="h-4 w-4" />
              }
              label="Email"
              value={user.email}
            />

            <InfoCard
              icon={
                <ContactRound className="h-4 w-4" />
              }
              label="Người liên hệ khẩn cấp"
              value={
                user.emergencyContactName
              }
            />

            <InfoCard
              icon={
                <UsersRound className="h-4 w-4" />
              }
              label="Mối quan hệ"
              value={
                user.emergencyContactRelationship
              }
            />

            <InfoCard
              icon={
                <Phone className="h-4 w-4" />
              }
              label="SĐT liên hệ khẩn cấp"
              value={
                user.emergencyContactPhone
              }
            />
          </DetailSection>

          <DetailSection
            title="Gói khám và mức độ ưu tiên"
            icon={
              <PackageCheck className="h-5 w-5" />
            }
          >
            <InfoCard
              icon={
                <Crown className="h-4 w-4" />
              }
              label="Ưu tiên khám"
              value={renderExaminationPriority(
                user.examinationPriority,
              )}
            />

            <InfoCard
              icon={
                <PackageCheck className="h-4 w-4" />
              }
              label="Tên gói khám"
              value={
                user.examinationPriority ===
                "package"
                  ? user.packageName
                  : "Không áp dụng"
              }
            />

            <InfoCard
              icon={
                <FileBadge2 className="h-4 w-4" />
              }
              label="Mã gói khám"
              value={
                user.examinationPriority ===
                "package"
                  ? user.packageCode
                  : "Không áp dụng"
              }
            />

            <InfoCard
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Ngày hết hạn gói"
              value={
                user.examinationPriority ===
                "package"
                  ? formatDate(
                      user.packageExpiryDate,
                    )
                  : "Không áp dụng"
              }
            />
          </DetailSection>

          <DetailSection
            title="Thông tin theo dõi thai kỳ"
            icon={
              <Baby className="h-5 w-5" />
            }
          >
            <InfoCard
              icon={
                <Baby className="h-4 w-4" />
              }
              label="Trạng thái theo dõi"
              value={renderPregnancyStatus(
                user.pregnancyStatus,
              )}
            />

            <InfoCard
              icon={
                <HeartPulse className="h-4 w-4" />
              }
              label="Mức độ theo dõi"
              value={renderRiskLevel(
                user.riskLevel,
              )}
            />

            <InfoCard
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Tuần thai hiện tại"
              value={
                user.pregnancyStatus ===
                  "pregnant" &&
                user.gestationalWeek
                  ? `Tuần ${user.gestationalWeek}`
                  : "Không áp dụng"
              }
            />

            <InfoCard
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Ngày dự sinh"
              value={
                user.pregnancyStatus ===
                "pregnant"
                  ? formatDate(
                      user.expectedDueDate,
                    )
                  : "Không áp dụng"
              }
            />

            <InfoCard
              icon={
                <Building2 className="h-4 w-4" />
              }
              label="Cơ sở theo dõi"
              value={user.facilityName}
            />

            <InfoCard
              icon={
                <CalendarClock className="h-4 w-4" />
              }
              label="Lần khám gần nhất"
              value={formatDateTime(
                user.lastVisitAt,
              )}
            />
          </DetailSection>

          <DetailSection
            title="Thông tin tài khoản"
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
          >
            <InfoCard
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
              label="Trạng thái tài khoản"
              value={renderAccountStatus(
                user.accountStatus,
              )}
            />

            <InfoCard
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Ngày tạo tài khoản"
              value={formatDateTime(
                user.createdAt,
              )}
            />

            <InfoCard
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Cập nhật gần nhất"
              value={formatDateTime(
                user.updatedAt,
              )}
            />
          </DetailSection>

          <div className="mt-6 flex justify-end">
            <Button
              type="primary"
              icon={
                <X className="h-4 w-4" />
              }
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-pink-500">
          {icon}
        </span>

        <Title
          level={5}
          className="!mb-0 !text-slate-950"
        >
          {title}
        </Title>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

export default function PregnantUserManagementPage() {
  const {
    message: messageApi,
  } = App.useApp();

  const [
    modal,
    modalContextHolder,
  ] = Modal.useModal();

  const [users, setUsers] =
    useState<PregnantUser[]>(
      INITIAL_USERS,
    );

  const [keyword, setKeyword] =
    useState("");

  const [
    pregnancyStatusFilter,
    setPregnancyStatusFilter,
  ] =
    useState<PregnancyStatus>();

  const [
    riskFilter,
    setRiskFilter,
  ] = useState<RiskLevel>();

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState<ExaminationPriority>();

  const [
    accountStatusFilter,
    setAccountStatusFilter,
  ] =
    useState<AccountStatus>();

  const [
    facilityFilter,
    setFacilityFilter,
  ] = useState<string>();

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<PregnantUser | null>(
      null,
    );

  const [
    editingUser,
    setEditingUser,
  ] =
    useState<PregnantUser | null>(
      null,
    );

  const [
    formModalOpen,
    setFormModalOpen,
  ] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return users.filter((user) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          user.patientCode,
          user.fullName,
          user.citizenId,
          user.phone,
          user.email,
          user.facilityName ?? "",
          user.packageName ?? "",
          user.packageCode ?? "",
        ].some((value) =>
          value
            .toLowerCase()
            .includes(
              normalizedKeyword,
            ),
        );

      return (
        matchesKeyword &&
        (!pregnancyStatusFilter ||
          user.pregnancyStatus ===
            pregnancyStatusFilter) &&
        (!riskFilter ||
          user.riskLevel ===
            riskFilter) &&
        (!priorityFilter ||
          user.examinationPriority ===
            priorityFilter) &&
        (!accountStatusFilter ||
          user.accountStatus ===
            accountStatusFilter) &&
        (!facilityFilter ||
          user.facilityId ===
            facilityFilter)
      );
    });
  }, [
    accountStatusFilter,
    facilityFilter,
    keyword,
    pregnancyStatusFilter,
    priorityFilter,
    riskFilter,
    users,
  ]);

  const activePregnancyCount =
    users.filter(
      (user) =>
        user.pregnancyStatus ===
        "pregnant",
    ).length;

  const highRiskCount =
    users.filter(
      (user) =>
        user.riskLevel === "high",
    ).length;

  const packagePriorityCount =
    users.filter(
      (user) =>
        user.examinationPriority ===
        "package",
    ).length;

  function resetFilters() {
    setKeyword("");
    setPregnancyStatusFilter(
      undefined,
    );
    setRiskFilter(undefined);
    setPriorityFilter(undefined);
    setAccountStatusFilter(
      undefined,
    );
    setFacilityFilter(undefined);
    setCurrentPage(1);
  }

  function openCreateUser() {
    setEditingUser(null);
    setFormModalOpen(true);
  }

  function openEditUser(
    user: PregnantUser,
  ) {
    setEditingUser(user);
    setFormModalOpen(true);
  }

  function saveUser(
    values: PregnantUserFormValues,
  ) {
    const now =
      new Date().toISOString();

    const facility =
      FACILITIES.find(
        (item) =>
          item.id ===
          values.facilityId,
      );

    const normalizedValues = {
      ...values,
      fullName:
        values.fullName.trim(),
      citizenId:
        values.citizenId.trim(),
      phone: values.phone.trim(),
      email:
        values.email
          .trim()
          .toLowerCase(),
      nationality:
        values.nationality.trim(),
      address:
        values.address.trim(),
      emergencyContactName:
        values.emergencyContactName?.trim() ||
        undefined,
      emergencyContactRelationship:
        values.emergencyContactRelationship?.trim() ||
        undefined,
      emergencyContactPhone:
        values.emergencyContactPhone?.trim() ||
        undefined,
      examinationPriority:
        values.examinationPriority,
      packageName:
        values.examinationPriority ===
        "package"
          ? values.packageName?.trim() ||
            undefined
          : undefined,
      packageCode:
        values.examinationPriority ===
        "package"
          ? values.packageCode?.trim() ||
            undefined
          : undefined,
      packageExpiryDate:
        values.examinationPriority ===
        "package"
          ? values.packageExpiryDate
          : undefined,
      facilityName:
        facility?.name,
      lastVisitAt:
        values.lastVisitAt
          ? new Date(
              `${values.lastVisitAt}T00:00:00`,
            ).toISOString()
          : undefined,
      gestationalWeek:
        values.pregnancyStatus ===
        "pregnant"
          ? values.gestationalWeek
          : undefined,
      expectedDueDate:
        values.pregnancyStatus ===
        "pregnant"
          ? values.expectedDueDate
          : undefined,
    };

    if (editingUser) {
      const updatedUser: PregnantUser = {
        ...editingUser,
        ...normalizedValues,
        updatedAt: now,
      };

      setUsers((current) =>
        current.map((user) =>
          user.id ===
          editingUser.id
            ? updatedUser
            : user,
        ),
      );

      setSelectedUser((current) =>
        current?.id ===
        editingUser.id
          ? updatedUser
          : current,
      );

      messageApi.success(
        "Cập nhật thai phụ thành công.",
      );
    } else {
      const nextNumber =
        users.length + 1;

      setUsers((current) => [
        {
          id: `USR-${Date.now()}`,
          patientCode: `MOM-${String(
            nextNumber,
          ).padStart(4, "0")}`,
          ...normalizedValues,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);

      messageApi.success(
        "Tạo tài khoản thai phụ thành công.",
      );
    }

    setFormModalOpen(false);
    setEditingUser(null);
  }

  function toggleAccountLock(
    user: PregnantUser,
  ) {
    const willUnlock =
      user.accountStatus ===
      "locked";

    modal.confirm({
      centered: true,
      title: willUnlock
        ? "Mở khóa tài khoản?"
        : "Khóa tài khoản?",
      content: willUnlock
        ? `Tài khoản của ${user.fullName} sẽ được mở khóa.`
        : `Tài khoản của ${user.fullName} sẽ không thể đăng nhập cho đến khi được mở khóa.`,
      okText: willUnlock
        ? "Mở khóa"
        : "Khóa tài khoản",
      cancelText: "Hủy",
      okButtonProps: willUnlock
        ? undefined
        : {
            danger: true,
          },
      onOk: () => {
        const nextStatus: AccountStatus =
          willUnlock
            ? "active"
            : "locked";

        const updatedAt =
          new Date().toISOString();

        setUsers((current) =>
          current.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  accountStatus:
                    nextStatus,
                  updatedAt,
                }
              : item,
          ),
        );

        setSelectedUser(
          (current) =>
            current?.id ===
            user.id
              ? {
                  ...current,
                  accountStatus:
                    nextStatus,
                  updatedAt,
                }
              : current,
        );

        messageApi.success(
          willUnlock
            ? "Đã mở khóa tài khoản."
            : "Đã khóa tài khoản.",
        );
      },
    });
  }

  const columns: ColumnsType<PregnantUser> =
    [
      {
        title: "STT",
        width: 64,
        align: "center",
        fixed: "left",
        render: (
          _value,
          _record,
          index,
        ) =>
          (currentPage - 1) *
            pageSize +
          index +
          1,
      },
      {
        title: "Thai phụ",
        width: 285,
        fixed: "left",
        render: (
          _value,
          user,
        ) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="!shrink-0 !bg-pink-500 !font-semibold">
              {getInitials(
                user.fullName,
              )}
            </Avatar>

            <div className="min-w-0">
              <Text
                strong
                className="block truncate"
              >
                {user.fullName}
              </Text>

              <Text
                type="secondary"
                className="block truncate text-xs"
              >
                {user.patientCode} ·{" "}
                {user.phone}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: "CCCD",
        dataIndex: "citizenId",
        width: 150,
        render: (
          value: string,
        ) => (
          <Text className="font-mono">
            {value}
          </Text>
        ),
      },
      {
        title: "Thai kỳ",
        width: 190,
        render: (
          _value,
          user,
        ) => (
          <div className="space-y-1">
            {renderPregnancyStatus(
              user.pregnancyStatus,
            )}

            {user.pregnancyStatus ===
              "pregnant" &&
            user.gestationalWeek ? (
              <Text
                type="secondary"
                className="block text-xs"
              >
                Tuần{" "}
                {
                  user.gestationalWeek
                }{" "}
                · Dự sinh{" "}
                {formatDate(
                  user.expectedDueDate,
                )}
              </Text>
            ) : null}
          </div>
        ),
      },
      {
        title: "Mức độ theo dõi",
        dataIndex: "riskLevel",
        width: 150,
        align: "center",
        render: (
          value: RiskLevel,
        ) =>
          renderRiskLevel(value),
      },
      {
        title: "Ưu tiên khám",
        dataIndex:
          "examinationPriority",
        width: 190,
        align: "center",
        sorter: (
          left,
          right,
        ) =>
          Number(
            right.examinationPriority ===
              "package",
          ) -
          Number(
            left.examinationPriority ===
              "package",
          ),
        render: (
          value: ExaminationPriority,
          user,
        ) =>
          renderExaminationPriority(
            value,
            user.packageName,
          ),
      },
      {
        title: "Cơ sở theo dõi",
        dataIndex: "facilityName",
        width: 255,
        render: (
          value?: string,
        ) => (
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

            <Text className="whitespace-normal">
              {value ||
                "Chưa được gán cơ sở"}
            </Text>
          </div>
        ),
      },
      {
        title: "Tài khoản",
        dataIndex:
          "accountStatus",
        width: 150,
        align: "center",
        render: (
          value: AccountStatus,
        ) =>
          renderAccountStatus(value),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 150,
        fixed: "right",
        align: "center",
        render: (
          _value,
          user,
        ) => (
          <Space size={6}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedUser(user);
                }}
              />
            </Tooltip>

            <Tooltip title="Cập nhật">
              <Button
                icon={
                  <Pencil className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  openEditUser(user);
                }}
              />
            </Tooltip>

            <Tooltip
              title={
                user.accountStatus ===
                "locked"
                  ? "Mở khóa tài khoản"
                  : "Khóa tài khoản"
              }
            >
              <Button
                icon={
                  user.accountStatus ===
                    "locked" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )
                }
                onClick={(event) => {
                  event.stopPropagation();
                  toggleAccountLock(
                    user,
                  );
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

  function handleTableChange(
    pagination: TablePaginationConfig,
  ) {
    const nextPageSize =
      pagination.pageSize ??
      pageSize;

    if (
      nextPageSize !== pageSize
    ) {
      setPageSize(nextPageSize);
      setCurrentPage(1);
      return;
    }

    setCurrentPage(
      pagination.current ?? 1,
    );
  }

  return (
    <AdminLayout
      roles={[
        "super_admin",
        "admin",
      ]}
    >
      {modalContextHolder}

      <PageHeader
        title="Quản lý thai phụ"
        description="Quản lý tài khoản, hồ sơ hành chính và thông tin theo dõi tổng quan của thai phụ."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Row gutter={[16, 16]}>
          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-slate-200">
              <Statistic
                title="Tổng thai phụ"
                value={users.length}
                prefix={
                  <UsersRound className="mr-2 h-5 w-5 text-blue-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-pink-100 bg-pink-50/60">
              <Statistic
                title="Đang mang thai"
                value={
                  activePregnancyCount
                }
                prefix={
                  <Baby className="mr-2 h-5 w-5 text-pink-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-red-100 bg-red-50/60">
              <Statistic
                title="Nguy cơ cao"
                value={highRiskCount}
                prefix={
                  <ShieldAlert className="mr-2 h-5 w-5 text-red-600" />
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card className="h-full border-amber-100 bg-amber-50/60">
              <Statistic
                title="Có gói khám"
                value={
                  packagePriorityCount
                }
                prefix={
                  <Crown className="mr-2 h-5 w-5 text-purple-600" />
                }
              />
            </Card>
          </Col>
        </Row>

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <Input
              allowClear
              value={keyword}
              prefix={
                <Search className="h-4 w-4 text-slate-400" />
              }
              placeholder="Tìm tên, mã thai phụ, CCCD, gói khám, điện thoại, email hoặc cơ sở..."
              className="min-w-0 xl:flex-1"
              onChange={(event) => {
                setKeyword(
                  event.target.value,
                );
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              value={
                pregnancyStatusFilter
              }
              placeholder="Trạng thái theo dõi"
              className="w-full xl:w-[200px] xl:shrink-0"
              options={
                PREGNANCY_STATUS_OPTIONS
              }
              onChange={(value) => {
                setPregnancyStatusFilter(
                  value,
                );
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              value={riskFilter}
              placeholder="Mức độ theo dõi"
              className="w-full xl:w-[190px] xl:shrink-0"
              options={
                RISK_LEVEL_OPTIONS
              }
              onChange={(value) => {
                setRiskFilter(value);
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              value={priorityFilter}
              placeholder="Ưu tiên khám"
              className="w-full xl:w-[210px] xl:shrink-0"
              options={
                EXAMINATION_PRIORITY_OPTIONS
              }
              onChange={(value) => {
                setPriorityFilter(value);
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              value={
                accountStatusFilter
              }
              placeholder="Trạng thái tài khoản"
              className="w-full xl:w-[200px] xl:shrink-0"
              options={
                ACCOUNT_STATUS_OPTIONS
              }
              onChange={(value) => {
                setAccountStatusFilter(
                  value,
                );
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={facilityFilter}
              placeholder="Tất cả cơ sở"
              className="w-full xl:w-[250px] xl:shrink-0"
              options={FACILITIES.map(
                (facility) => ({
                  value: facility.id,
                  label: facility.name,
                }),
              )}
              onChange={(value) => {
                setFacilityFilter(value);
                setCurrentPage(1);
              }}
            />

            <Button
              icon={
                <X className="h-4 w-4" />
              }
              className="w-full xl:w-auto xl:shrink-0"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </Card>

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách thai phụ
              </p>

              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Bấm vào một dòng để xem hồ sơ chi tiết. Hồ sơ thai phụ không có chức năng xóa.
              </p>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={
                <Plus className="h-4 w-4" />
              }
              onClick={openCreateUser}
            >
              Thêm thai phụ
            </Button>
          }
        >
          <Table<PregnantUser>
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            columns={columns}
            dataSource={
              filteredUsers
            }
            scroll={{
              x: 1510,
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total:
                filteredUsers.length,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [
                10,
                20,
                50,
              ],
              showTotal: (
                total,
                range,
              ) =>
                `${range[0]}-${range[1]} / ${total} thai phụ`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={
                    Empty.PRESENTED_IMAGE_SIMPLE
                  }
                  description="Không có thai phụ phù hợp."
                >
                  <Button
                    type="primary"
                    onClick={
                      openCreateUser
                    }
                  >
                    Thêm thai phụ
                  </Button>
                </Empty>
              ),
            }}
            onChange={
              handleTableChange
            }
            onRow={(user) => ({
              className:
                "cursor-pointer",
              onClick: (event) => {
                const target =
                  event.target as HTMLElement;

                if (
                  target.closest(
                    "button",
                  ) ||
                  target.closest("a")
                ) {
                  return;
                }

                setSelectedUser(user);
              },
            })}
            className="management-table [&_.ant-table-cell]:px-3"
          />
        </Card>
      </div>

      <PregnantUserFormModal
        open={formModalOpen}
        user={editingUser}
        users={users}
        onClose={() => {
          setFormModalOpen(false);
          setEditingUser(null);
        }}
        onSave={saveUser}
      />

      <PregnantUserDetailModal
        open={
          Boolean(selectedUser)
        }
        user={selectedUser}
        onClose={() =>
          setSelectedUser(null)
        }
        onEdit={(user) => {
          setSelectedUser(null);
          openEditUser(user);
        }}
      />
    </AdminLayout>
  );
}
