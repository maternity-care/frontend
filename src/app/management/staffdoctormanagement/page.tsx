"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "antd";
import {
  BriefcaseMedical,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Stethoscope,
  Trash2,
  UserPlus,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { cn } from "@/lib/utils";

type AccountStatus = "active" | "locked";
type AccountRole = "Staff" | "Doctor";

type StaffDoctorAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  facility: string;
  status: AccountStatus;
  createdAt: string;
};

const initialAccounts: StaffDoctorAccount[] = [
  { id: "1", name: "BS. Nguyễn An", email: "an@mcs.vn", role: "Doctor", facility: "Cơ sở Q1", status: "active", createdAt: "08/06/2026" },
  { id: "2", name: "BS. Trần Mai", email: "mai@mcs.vn", role: "Doctor", facility: "Cơ sở Q7", status: "active", createdAt: "09/06/2026" },
  { id: "3", name: "Nguyễn Thảo", email: "thao@mcs.vn", role: "Staff", facility: "Cơ sở Q1", status: "active", createdAt: "10/06/2026" },
  { id: "4", name: "Lê Hương", email: "huong@mcs.vn", role: "Staff", facility: "Cơ sở Q7", status: "locked", createdAt: "11/06/2026" },
  { id: "5", name: "BS. Phạm Minh", email: "minh@mcs.vn", role: "Doctor", facility: "Cơ sở Q1", status: "active", createdAt: "12/06/2026" },
  { id: "6", name: "Trần Ngọc", email: "ngoc@mcs.vn", role: "Staff", facility: "Cơ sở Q7", status: "locked", createdAt: "13/06/2026" },
];

const PAGE_SIZE = 5;

export default function StaffDoctorManagementPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<StaffDoctorAccount[]>(initialAccounts);

  const filteredAccounts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchKeyword =
        !keyword ||
        account.name.toLowerCase().includes(keyword) ||
        account.email.toLowerCase().includes(keyword);

      const matchRole = !roleFilter || account.role === roleFilter;
      const matchFacility = !facilityFilter || account.facility === facilityFilter;
      const matchStatus = !statusFilter || account.status === statusFilter;

      return matchKeyword && matchRole && matchFacility && matchStatus;
    });
  }, [accounts, query, roleFilter, facilityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));

  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredAccounts]);

  const startItem = filteredAccounts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredAccounts.length);

  const currentPageIds = paginatedAccounts.map((account) => account.id);
  const selectedCurrentPageCount = currentPageIds.filter((id) => selectedAccountIds.includes(id)).length;
  const allCurrentPageSelected = currentPageIds.length > 0 && selectedCurrentPageCount === currentPageIds.length;
  const someCurrentPageSelected = selectedCurrentPageCount > 0 && !allCurrentPageSelected;

  const totalStaff = accounts.filter((account) => account.role === "Staff").length;
  const totalDoctors = accounts.filter((account) => account.role === "Doctor").length;
  const activeAccounts = accounts.filter((account) => account.status === "active").length;
  const lockedAccounts = accounts.filter((account) => account.status === "locked").length;

  function clearFilters() {
    setQuery("");
    setRoleFilter("");
    setFacilityFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  }

  function toggleSelectAccount(accountId: string, checked: boolean) {
    setSelectedAccountIds((current) =>
      checked ? [...new Set([...current, accountId])] : current.filter((id) => id !== accountId),
    );
  }

  function toggleSelectCurrentPage(checked: boolean) {
    setSelectedAccountIds((current) => {
      if (checked) return [...new Set([...current, ...currentPageIds])];
      return current.filter((id) => !currentPageIds.includes(id));
    });
  }

  function handleDeleteSelected() {
    if (selectedAccountIds.length === 0) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedAccountIds.length} tài khoản đã chọn không?`,
    );

    if (!confirmed) return;

    setAccounts((current) =>
      current.filter((account) => !selectedAccountIds.includes(account.id)),
    );
    setSelectedAccountIds([]);
    setCurrentPage(1);
  }

  function handleDeleteAccount(accountId: string) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa tài khoản này không?");

    if (!confirmed) return;

    setAccounts((current) => current.filter((account) => account.id !== accountId));
    setSelectedAccountIds((current) => current.filter((id) => id !== accountId));
    setCurrentPage(1);
  }

  return (
    <AdminLayout permissions={["user.view"]}>
      <PageHeader
        title="Staff / Doctors Management"
        description="Quản lý tài khoản Staff và Bác sĩ trong hệ thống."
      />

      <div className="mt-6 space-y-5">
        <Card className="border-slate-200 bg-white">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto]">
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên/email"
                className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="">Vai trò</option>
              <option value="Staff">Staff</option>
              <option value="Doctor">Bác sĩ</option>
            </select>

            <select
              value={facilityFilter}
              onChange={(event) => {
                setFacilityFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="">Cơ sở</option>
              <option value="Cơ sở Q1">Cơ sở Q1</option>
              <option value="Cơ sở Q7">Cơ sở Q7</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-md border border-border bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="">Trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>

            <Button variant="secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <p className="text-sm text-slate-500">Staff</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totalStaff}</p>
          </Card>

          <Card className="border-blue-100 bg-blue-50/60">
            <p className="text-sm text-blue-700">Bác sĩ</p>
            <p className="mt-2 text-3xl font-semibold text-blue-950">{totalDoctors}</p>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <p className="text-sm text-emerald-700">Đang hoạt động</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{activeAccounts}</p>
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <p className="text-sm text-red-700">Đã khóa</p>
            <p className="mt-2 text-3xl font-semibold text-red-950">{lockedAccounts}</p>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Danh sách tài khoản Staff / Bác sĩ</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi thông tin nhân sự, cơ sở làm việc và trạng thái tài khoản.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleDeleteSelected}
                disabled={selectedAccountIds.length === 0}
              >
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                Xóa đã chọn
                {selectedAccountIds.length > 0 ? ` (${selectedAccountIds.length})` : ""}
              </Button>

              <Button>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Thêm tài khoản
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-3 font-medium">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      indeterminate={someCurrentPageSelected}
                      onChange={(event) => toggleSelectCurrentPage(event.target.checked)}
                    />
                  </th>
                  <th className="w-16 px-4 py-3 font-medium">STT</th>
                  <th className="px-4 py-3 text-center font-medium">Họ tên</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 text-center font-medium">Vai trò</th>
                  <th className="px-4 py-3 text-center font-medium">Cơ sở</th>
                  <th className="px-4 py-3 text-center font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-medium">Ngày tạo</th>
                  <th className="px-4 py-3 text-center font-medium">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {paginatedAccounts.map((account, index) => (
                  <tr key={account.id} className="bg-white transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedAccountIds.includes(account.id)}
                        onChange={(event) => toggleSelectAccount(account.id, event.target.checked)}
                      />
                    </td>

                    <td className="px-4 py-3 text-slate-600">{startItem + index}</td>

                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                          {account.role === "Doctor" ? (
                            <Stethoscope className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <BriefcaseMedical className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <p className="truncate font-medium text-slate-950">{account.name}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{account.email}</td>

                    <td className="px-4 py-3 text-center">
                      <Badge tone={account.role === "Doctor" ? "blue" : "neutral"}>
                        {account.role === "Doctor" ? "Bác sĩ" : "Staff"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600">{account.facility}</td>

                    <td className="px-4 py-3 text-center">
                      <Badge tone={account.status === "active" ? "green" : "neutral"}>
                        {account.status === "active" ? "Hoạt động" : "Đã khóa"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600">{account.createdAt}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Button variant="secondary" aria-label="Sửa tài khoản" title="Sửa">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>

                        <Button
                          variant="secondary"
                          aria-label="Xóa tài khoản"
                          title="Xóa"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy tài khoản phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Hiển thị {startItem} - {endItem} trong tổng {filteredAccounts.length} tài khoản
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Trước
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition",
                        currentPage === page
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-border bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
