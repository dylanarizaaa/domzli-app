import { Badge, type BadgeTone } from '@/components/ui/badge';
import type { IconName } from '@/components/ui/icon';

type Meta = { label: string; tone: BadgeTone; icon: IconName };

/** Correspondencia única entre estados del dominio y su etiqueta, tono e icono (Design System §3.4). */
const STATUS = {
  property: {
    available: { label: 'Disponible', tone: 'info', icon: 'door-open' },
    leased: { label: 'Arrendado', tone: 'success', icon: 'key-round' },
    maintenance: { label: 'En mantenimiento', tone: 'warning', icon: 'wrench' },
    inactive: { label: 'Inactivo', tone: 'neutral', icon: 'circle-minus' },
  },
  lease: {
    draft: { label: 'Borrador', tone: 'neutral', icon: 'file-pen' },
    active: { label: 'Vigente', tone: 'success', icon: 'file-check' },
    expiring: { label: 'Por vencer', tone: 'warning', icon: 'calendar-clock' },
    extension: { label: 'En prórroga', tone: 'warning', icon: 'calendar-clock' },
    terminated: { label: 'Finalizado', tone: 'neutral', icon: 'file-x' },
  },
  charge: {
    pending: { label: 'Pendiente', tone: 'neutral', icon: 'clock' },
    overdue: { label: 'Vencido', tone: 'danger', icon: 'circle-alert' },
    partially_paid: { label: 'Abonado', tone: 'warning', icon: 'circle-dashed' },
    paid: { label: 'Pagado', tone: 'success', icon: 'circle-check' },
    void: { label: 'Anulado', tone: 'neutral', icon: 'ban' },
  },
  payment: {
    in_review: { label: 'En revisión', tone: 'warning', icon: 'clock' },
    approved: { label: 'Aprobado', tone: 'success', icon: 'circle-check' },
    rejected: { label: 'Rechazado', tone: 'danger', icon: 'circle-x' },
    cancelled: { label: 'Retirado', tone: 'neutral', icon: 'undo-2' },
    reversed: { label: 'Revertido', tone: 'neutral', icon: 'rotate-ccw' },
  },
  access: {
    linked: { label: 'Con acceso', tone: 'success', icon: 'circle-check' },
    invited: { label: 'Invitación enviada', tone: 'info', icon: 'mail' },
    expired: { label: 'Invitación vencida', tone: 'warning', icon: 'mail' },
    none: { label: 'Sin acceso', tone: 'neutral', icon: 'circle-dashed' },
  },
} as const satisfies Record<string, Record<string, Meta>>;

type Entity = keyof typeof STATUS;

export type StatusBadgeProps = {
  [E in Entity]: { entity: E; status: keyof (typeof STATUS)[E]; size?: 'sm' | 'md'; label?: string };
}[Entity];

/** La única forma de mostrar estados del dominio: texto + icono + tono. */
export function StatusBadge(props: StatusBadgeProps) {
  const meta = (STATUS[props.entity] as Record<string, Meta>)[props.status as string];
  return (
    <Badge tone={meta.tone} icon={meta.icon} size={props.size}>
      {props.label ?? meta.label}
    </Badge>
  );
}
