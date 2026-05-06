import { jwtDecode } from "jwt-decode"

interface AuthoritySource {
  roles?: string[]
  authorities?: string[]
}

export function getAuthorities(source?: AuthoritySource | null) {
  return Array.from(new Set([
    ...(Array.isArray(source?.roles) ? source.roles : []),
    ...(Array.isArray(source?.authorities) ? source.authorities : []),
  ]))
}

export function getTokenAuthorities(token: string) {
  try {
    return getAuthorities(jwtDecode<AuthoritySource>(token))
  } catch {
    return []
  }
}

export function getInitialRouteFromAuthorities(authorities: string[]) {
  const hasAny = (...access: string[]) => access.some(item => authorities.includes(item))

  if (hasAny("ROLE_ADMIN", "ACCESS_DASHBOARD")) return "/dashboard"
  if (hasAny("ACCESS_FISCAL")) return "/fiscal"
  if (hasAny("ACCESS_PURCHASES")) return "/compras"
  if (hasAny("ACCESS_INVENTORY_IT", "ACCESS_INVENTORY_IT_VIEW", "ACCESS_INVENTORY_IT_MANAGE", "ACCESS_INVENTORY_ADMIN", "ACCESS_INVENTORY_ADMIN_VIEW", "ACCESS_INVENTORY_ADMIN_MANAGE", "ROLE_TI", "ROLE_RH")) return "/inventario"
  if (hasAny("ACCESS_HELPDESK", "ACCESS_HELPDESK_VIEW", "ACCESS_HELPDESK_MANAGE", "ROLE_USER")) return "/helpdesk"
  if (hasAny("ACCESS_HR", "ACCESS_HR_VIEW", "ACCESS_HR_MANAGE")) return "/recursoshumanos"
  if (hasAny("ACCESS_USERS", "ACCESS_USERS_VIEW", "ACCESS_USERS_MANAGE")) return "/usuarios"

  return "/helpdesk"
}
