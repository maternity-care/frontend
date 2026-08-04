import { LegalTab } from "@/app/legal/page";

interface Props {
  activeTab: LegalTab;
  onChange: (tab: LegalTab) => void;
}

const menuItems: { id: LegalTab; label: string }[] = [
  { id: "general", label: "Điều khoản giao dịch chung" },
  { id: "privacy", label: "Chính sách bảo mật" },
  { id: "user-protection", label: "Chính sách bảo vệ người dùng" },
  { id: "disclaimer", label: "Miễn trừ trách nhiệm" },
  { id: "complaint", label: "Chính sách khiếu nại" },
  { id: "patient-rights", label: "Quyền Và Nghĩa Vụ Của Người Bệnh" },
];

export default function LegalSidebar({ activeTab, onChange }: Props) {
  return (
    <aside className="w-60 shrink-0" style={{ paddingRight: "20px" }}>
      <nav className="sticky top-28">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-xl text-[14.5px] transition-all duration-200
                  flex items-center justify-between
                  ${
                    isActive
                      ? "bg-pink-50 text-pink-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <span className="leading-snug">{item.label}</span>
                {isActive && (
                  <span className="text-pink-500 text-base">→</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}