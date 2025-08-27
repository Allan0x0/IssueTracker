export const AppLinks = {
  Login: '/login',
  Logout: '/logout',
  ChangePassword: '/change-password',
  Index: "/",
  Client: {
    Index: "/client",
    SendIssue: '/client/send-issue',
  },
  Admin: {
    Index: '/admin',
    Employees: {
      Index: '/admin/employees',
      Edit: (employeeId: number) => `/admin/employees/${employeeId}/edit`,
      Create: '/admin/employees/create',
    },
  }
} as const;