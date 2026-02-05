'use client';

import { useState } from 'react';
import { UserX, UserCheck, MoreHorizontal, Trash2, UserPlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  useAdminUsers,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminCreateUser,
} from '@/hooks/use-admin';
import type { UserRole } from '@/types/api';

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>('Merchant');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    companyAddress: '',
    licenseNumber: '',
    ownerId: '',
  });
  const limit = 10;

  // URL-based filters
  const { filters, setFilter, resetFilters, hasActiveFilters } = useUrlFilters<{
    role: string | undefined;
    status: string | undefined;
    search: string | undefined;
  }>({
    defaults: { role: 'all', status: 'all' },
  });

  const { data, isLoading } = useAdminUsers({
    role: filters.role && filters.role !== 'all' ? (filters.role as UserRole) : undefined,
    page,
    limit,
  });
  const { data: truckOwnersData } = useAdminUsers({
    role: 'TruckOwner',
    page: 1,
    limit: 100,
  });
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();
  const createUser = useAdminCreateUser();

  const users = data?.data.users ?? [];
  const pagination = data?.data.pagination;
  const truckOwners = truckOwnersData?.data.users ?? [];

  // Apply filters
  let filteredUsers = users;

  // Filter by search
  if (filters.search) {
    filteredUsers = filteredUsers.filter((user) => {
      const query = filters.search!.toLowerCase();
      return [user.name, user.email, user.phone].some((field) =>
        field?.toLowerCase().includes(query)
      );
    });
  }

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    const isActive = filters.status === 'active';
    filteredUsers = filteredUsers.filter((user) => user.active === isActive);
  }

  // Calculate active filter count
  const activeFilterCount = hasActiveFilters ? Object.values(filters).filter(v => v && v !== 'all').length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">تحكم في حسابات المستخدمين وصلاحياتهم</p>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        config={[
          {
            key: 'role',
            label: 'الدور',
            type: 'select',
            options: [
              { label: 'مدير', value: 'Admin' },
              { label: 'تاجر', value: 'Merchant' },
              { label: 'مالك شاحنة', value: 'TruckOwner' },
              { label: 'سائق', value: 'Driver' },
            ],
          },
          {
            key: 'status',
            label: 'الحالة',
            type: 'select',
            options: [
              { label: 'مفعل', value: 'active' },
              { label: 'معطل', value: 'inactive' },
            ],
          },
          {
            key: 'search',
            label: 'بحث',
            type: 'text',
            placeholder: 'بحث بالاسم أو البريد',
          },
        ]}
        values={filters}
        onChange={(key: string, value: string | undefined) => {
          setFilter(key as 'search' | 'role' | 'status', value);
          if (key === 'role') setPage(1);
        }}
        onReset={() => {
          resetFilters();
          setPage(1);
        }}
        activeCount={activeFilterCount}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>قائمة المستخدمين</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="ml-2 h-4 w-4" />
            إضافة مستخدم
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.active ? (
                          <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-300">مفعل</Badge>
                        ) : (
                          <Badge variant="destructive">معطل</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                updateUser.mutate({
                                  id: user._id,
                                  data: { active: !user.active },
                                })
                              }
                            >
                              {user.active ? (
                                <>
                                  <UserX className="ml-2 h-4 w-4" />
                                  تعطيل
                                </>
                              ) : (
                                <>
                                  <UserCheck className="ml-2 h-4 w-4" />
                                  تفعيل
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('هل تريد حذف هذا المستخدم؟')) {
                                  deleteUser.mutate(user._id);
                                }
                              }}
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Input
              placeholder="الاسم الكامل"
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="البريد الإلكتروني"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="رقم الهاتف"
              value={createForm.phone}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={createForm.password}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            <Select
              value={createRole}
              onValueChange={(value) => setCreateRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Merchant">تاجر</SelectItem>
                <SelectItem value="TruckOwner">مالك شاحنة</SelectItem>
                <SelectItem value="Driver">سائق</SelectItem>
                <SelectItem value="Admin">مدير</SelectItem>
              </SelectContent>
            </Select>

            {createRole === 'TruckOwner' && (
              <>
                <Input
                  placeholder="اسم الشركة"
                  value={createForm.companyName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, companyName: e.target.value }))}
                />
                <Input
                  placeholder="عنوان الشركة"
                  value={createForm.companyAddress}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, companyAddress: e.target.value }))}
                />
              </>
            )}

            {createRole === 'Driver' && (
              <>
                <Input
                  placeholder="رقم رخصة القيادة"
                  value={createForm.licenseNumber}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                />
                <Select
                  value={createForm.ownerId}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, ownerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مالك الشاحنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {truckOwners.map((owner) => (
                      <SelectItem key={owner._id} value={owner._id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                createUser.mutate(
                  {
                    name: createForm.name,
                    email: createForm.email,
                    phone: createForm.phone,
                    password: createForm.password,
                    role: createRole,
                    companyName: createRole === 'TruckOwner' ? createForm.companyName : undefined,
                    companyAddress: createRole === 'TruckOwner' ? createForm.companyAddress : undefined,
                    licenseNumber: createRole === 'Driver' ? createForm.licenseNumber : undefined,
                    ownerId: createRole === 'Driver' ? createForm.ownerId : undefined,
                  },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setCreateForm({
                        name: '',
                        email: '',
                        phone: '',
                        password: '',
                        companyName: '',
                        companyAddress: '',
                        licenseNumber: '',
                        ownerId: '',
                      });
                    },
                  }
                );
              }}
              disabled={createUser.isPending}
            >
              إنشاء المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
