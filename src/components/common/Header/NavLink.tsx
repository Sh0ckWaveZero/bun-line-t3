import { Link } from "@tanstack/react-router";
import type { NavLinkProps } from "./types";

const navLinkClass = (active: boolean) =>
  `flex items-center space-x-2 rounded-md px-3 py-2 transition-colors hover:bg-primary/10 hover:text-primary ${
    active
      ? "bg-primary/10 font-medium text-primary"
      : "text-muted-foreground"
  }`;

export function NavLink({ item, isActive, onClick, className }: NavLinkProps) {
  return (
    <Link
      id={`nav-${item.id}`}
      to={item.href || "#"}
      className={className || navLinkClass(isActive)}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      aria-label={item.ariaLabel}
    >
      {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
      <span>{item.label}</span>
    </Link>
  );
}
