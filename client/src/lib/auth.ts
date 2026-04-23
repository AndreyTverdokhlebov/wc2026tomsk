// Simple in-memory auth store (no localStorage/sessionStorage)
export type AuthUser = {
  id: number;
  username: string;
  points: number;
};

let _currentUser: AuthUser | null = null;

export function getUser(): AuthUser | null {
  return _currentUser;
}

export function setUser(user: AuthUser | null) {
  _currentUser = user;
}
