import { apiRequest } from './api';

export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResult = {
  token: string;
  user: PublicUser;
};

export async function registerAccount(email: string, password: string): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export async function loginAccount(email: string, password: string): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}
