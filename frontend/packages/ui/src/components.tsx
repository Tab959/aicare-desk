import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode
} from "react";
import type { UiSize, UiTone } from "./tokens";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function uiButtonClassName(variant: ButtonVariant = "secondary", size: UiSize = "md", className?: string): string {
  return cx("ui-button", `ui-button--${variant}`, `ui-button--${size}`, className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: UiSize;
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button className={uiButtonClassName(variant, size, className)} type={type} {...props} />;
}

export type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "aside" | "div";
  padded?: boolean;
};

export function Panel({ as: Element = "article", padded = false, className, ...props }: PanelProps) {
  return <Element className={cx("ui-panel", padded && "ui-panel--padded", className)} {...props} />;
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: UiTone;
  size?: UiSize;
};

export function Badge({ tone = "neutral", size = "md", className, ...props }: BadgeProps) {
  return <span className={cx("ui-badge", `ui-badge--${tone}`, `ui-badge--${size}`, className)} {...props} />;
}

export type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: UiTone;
};

export function StatusPill({ tone = "neutral", className, ...props }: StatusPillProps) {
  return <span className={cx("ui-status-pill", `ui-status-pill--${tone}`, className)} {...props} />;
}

export type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  kicker: string;
  title: string;
  detail?: string;
  compact?: boolean;
  action?: ReactNode;
};

export function PageHeader({ kicker, title, detail, compact = false, action, className, ...props }: PageHeaderProps) {
  return (
    <section className={cx("ui-page-header", compact && "ui-page-header--compact", className)} {...props}>
      <div>
        <p className="ui-eyebrow">{kicker}</p>
        <h2>{title}</h2>
        {detail ? <span>{detail}</span> : null}
      </div>
      {action ? <div className="ui-page-header__action">{action}</div> : null}
    </section>
  );
}

export type SectionTitleProps = HTMLAttributes<HTMLDivElement> & {
  kicker?: string;
  title: string;
  action?: ReactNode;
};

export function SectionTitle({ kicker, title, action, className, ...props }: SectionTitleProps) {
  return (
    <div className={cx("ui-section-title", className)} {...props}>
      <div>
        {kicker ? <p>{kicker}</p> : null}
        <h2>{title}</h2>
      </div>
      {action ? <div className="ui-section-title__action">{action}</div> : null}
    </div>
  );
}

export type TagRowProps = HTMLAttributes<HTMLSpanElement> & {
  tags: string[];
};

export function TagRow({ tags, className, ...props }: TagRowProps) {
  return (
    <span className={cx("ui-tag-row", className)} {...props}>
      {tags.map((tag) => (
        <em key={tag}>{tag}</em>
      ))}
    </span>
  );
}

export type KpiCardProps = HTMLAttributes<HTMLElement> & {
  icon?: ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone?: Extract<UiTone, "info" | "primary" | "warning" | "danger" | "success" | "neutral">;
};

export function KpiCard({ icon, label, value, detail, tone = "neutral", className, ...props }: KpiCardProps) {
  return (
    <article className={cx("ui-kpi-card", `ui-kpi-card--${tone}`, className)} {...props}>
      {icon ? <span className="ui-kpi-card__icon">{icon}</span> : null}
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export type EmptyStateProps = HTMLAttributes<HTMLElement> & {
  title: string;
  detail?: string;
  action?: ReactNode;
};

export function EmptyState({ title, detail, action, className, ...props }: EmptyStateProps) {
  return (
    <section className={cx("ui-empty-state", className)} {...props}>
      <strong>{title}</strong>
      {detail ? <p>{detail}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}
