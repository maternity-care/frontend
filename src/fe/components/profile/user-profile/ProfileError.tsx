import { Alert } from "antd";

type ProfileErrorProps = {
  error?: string | null;
};

export function ProfileError({ error }: ProfileErrorProps) {
  return (
    <Alert
      type="error"
      showIcon
      title="Không tải được hồ sơ"
      description={error ?? "Vui lòng thử tải lại trang hoặc đăng nhập lại."}
    />
  );
}
