// lib/authorization.js
// 인가(Authorization): 인증된 사용자가 해당 기능을 사용할 권한이 있는지 확인합니다.

// 역할별 권한 목록
const ROLE_PERMISSIONS = {
  admin: ["admin:page", "stats:read"],
};

// 사용자의 권한 확인
export function authorize(user, permission) {
  if (!user) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[user.role] ?? [];

  // TODO 2. 현재 사용자가 요청한 권한을 가지고 있는지 확인
  return permissions.includes(permission);
}