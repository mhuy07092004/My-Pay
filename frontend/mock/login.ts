import { http, HttpResponse } from 'msw'

export const mockAdminUser = {
  email: 'admin@gmail.com',
  password: 'admin1',
  firstName: 'Admin',
}

export const loginHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }

    if (
      body.email === mockAdminUser.email &&
      body.password === mockAdminUser.password
    ) {
      return HttpResponse.json({
        token: 'mock-admin-token',
        user: {
          email: mockAdminUser.email,
          firstName: mockAdminUser.firstName,
        },
      })
    }

    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 },
    )
  }),
]
