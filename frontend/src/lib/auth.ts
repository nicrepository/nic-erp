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
  if (hasAny("ACCESS_INVENTORY_IT", "ACCESS_INVENTORY_ADMIN", "ROLE_TI", "ROLE_RH")) return "/inventario"
  if (hasAny("ACCESS_HELPDESK", "ROLE_USER")) return "/helpdesk"
  if (hasAny("ACCESS_HR")) return "/recursoshumanos"
  if (hasAny("ACCESS_USERS")) return "/usuarios"

  return "/helpdesk"
}
