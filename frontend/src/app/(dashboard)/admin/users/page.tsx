'use client';

import { useState } from 'react';
import { Search, UserX, UserCheck, MoreHorizontal, Trash2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminUsers, useAdminUpdateUser, useAdminDeleteUser } from '@/hooks/use-admin';
import type { UserRole } from '@/types/api';

const roleOptions: Array<{ value: UserRole | 'all'; label: string }> = [
  { value: 'all', label: 'كل الأدوار' },
  { value: 'Admin', label: 'مدير' },
  { value: 'Merchant', label: 'تاجر' },
  { value: 'TruckOwner', label: 'مالك شاحنة' },
  { value: 'Driver', label: 'سائق' },
];

function formatDate(dateString?: string) {
  if (!dateString) return '--';
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useAdminUsers({
    role: roleFilter === 'all' ? undefined : roleFilter,
    page,
    limit,
  });
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();

  const users = data?.data.users ?? [];
  const pagination = data?.data.pagination;

  const filteredUsers = search
    ? users.filter((user) => {
        const query = search.toLowerCase();
        return [user.name, user.email, user.phone].some((field) =>
          field?.toLowerCase().includes(query)
        );
      })
    : users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">تحكم في حسابات المستخدمين وصلاحياتهم</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>قائمة المستخدمين</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as UserRole | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                          <Badge className="bg-green-500/10 text-green-600">مفعل</Badge>
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
    </div>
  );
}
