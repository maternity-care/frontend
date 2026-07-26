/**
 * Mức độ nguy cơ của thai kỳ.
 * Cho phép string để tránh lỗi nếu backend bổ sung trạng thái mới.
 */
export type PregnancyRiskLevel =
  | "low"
  | "medium"
  | "high"
  | (string & {});

/**
 * Trạng thái hồ sơ thai kỳ.
 *
 * Swagger hiện không thống nhất:
 * - POST sử dụng "ACTIVE"
 * - PATCH sử dụng "active"
 *
 * Vì vậy frontend chấp nhận cả hai dạng.
 */
export type PregnancyProfileStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "COMPLETED"
  | "PENDING_DELETE"
  | "DELETED"
  | "active"
  | "inactive"
  | "completed"
  | "pending_delete"
  | "deleted"
  | (string & {});

export type PregnancyProfileUser = {
  id?: string;
  email?: string;
  phone?: string;
  status?: string;
  [key: string]: unknown;
};

export type PregnancyProfileUserProfile = {
  id?: string;
  fullName?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string | null;
  identityNumber?: string | null;
  [key: string]: unknown;
};

/**
 * Hồ sơ thai kỳ được backend trả về.
 */
export type PregnancyProfile = {
  id: string;
  patientId: string;
  code: string;

  lastMenstrualPeriod: string;
  expectedDueDate: string;

  /**
   * Swagger có fetalCount trong request nhưng chưa hiển thị
   * trong response, vì vậy để optional.
   */
  fetalCount?: number;

  gravida: number;
  paraFullTerm: number;
  paraPremature: number;
  paraAbortion: number;
  paraLivingChildren: number;

  riskLevel: PregnancyRiskLevel;
  status: PregnancyProfileStatus;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
  createdBy: string | null;

  deletedAt: string | null;
  deletedBy: string | null;
  deletedReason: string | null;

  user: PregnancyProfileUser;
  userProfile: PregnancyProfileUserProfile;
};

/**
 * Dữ liệu gửi lên khi tạo hồ sơ thai kỳ.
 */
export type CreatePregnancyProfilePayload = {
  lastMenstrualPeriod: string;
  expectedDueDate: string;

  fetalCount: number;
  gravida: number;
  paraFullTerm: number;
  paraPremature: number;
  paraAbortion: number;
  paraLivingChildren: number;

  riskLevel: PregnancyRiskLevel;
  status: PregnancyProfileStatus;
  notes?: string;
};

/**
 * PATCH cho phép chỉ gửi những trường cần thay đổi.
 */
export type UpdatePregnancyProfilePayload =
  Partial<CreatePregnancyProfilePayload>;

/**
 * Nếu backend yêu cầu lý do xóa mềm, có thể sử dụng payload này.
 * Hiện Swagger chưa hiển thị request body.
 */
export type SoftDeletePregnancyProfilePayload = {
  deletedReason?: string;
};

/**
 * Dùng khi backend bổ sung body cho API xác nhận/từ chối xóa.
 * Swagger hiện chưa hiển thị request body của endpoint này.
 */
export type ConfirmSoftDeletePregnancyProfilePayload = {
  approved: boolean;
  reason?: string;
};