import {
  Ban, Banknote, Bell, Building2, CalendarClock, CalendarDays, Camera, ChevronLeft, ChevronRight, CircleAlert,
  CircleCheck, CircleDashed, CircleDollarSign, CircleMinus, CircleUser, CircleX, Clock, Copy, CreditCard, DoorOpen,
  Ellipsis, Eye, EyeOff, FileCheck, FilePen, FileText, FileX, FolderOpen, House, Image as ImageIcon, Info, KeyRound,
  Landmark, LogOut, Mail, MapPin, Paperclip, Pencil, Phone, Plus, Receipt, RotateCcw, Search, Share2, Smartphone,
  Trash2, TrendingUp, TriangleAlert, Undo2, Upload, UserPlus, Users, Wallet, Wrench, X, Zap, type LucideIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';

import { cn } from '@/lib/cn';

/** Iconos de Lucide disponibles en la app, por su nombre en kebab-case. */
const ICONS = {
  ban: Ban,
  banknote: Banknote,
  camera: Camera,
  'circle-x': CircleX,
  'credit-card': CreditCard,
  image: ImageIcon,
  landmark: Landmark,
  paperclip: Paperclip,
  pencil: Pencil,
  smartphone: Smartphone,
  'trash-2': Trash2,
  'undo-2': Undo2,
  upload: Upload,
  zap: Zap,
  bell: Bell,
  'building-2': Building2,
  'calendar-clock': CalendarClock,
  'calendar-days': CalendarDays,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'circle-dashed': CircleDashed,
  'circle-dollar-sign': CircleDollarSign,
  'circle-minus': CircleMinus,
  'circle-user': CircleUser,
  clock: Clock,
  copy: Copy,
  'door-open': DoorOpen,
  ellipsis: Ellipsis,
  eye: Eye,
  'eye-off': EyeOff,
  'file-check': FileCheck,
  'file-pen': FilePen,
  'file-text': FileText,
  'file-x': FileX,
  'folder-open': FolderOpen,
  house: House,
  info: Info,
  'key-round': KeyRound,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  phone: Phone,
  plus: Plus,
  receipt: Receipt,
  'rotate-ccw': RotateCcw,
  search: Search,
  'share-2': Share2,
  'trending-up': TrendingUp,
  'triangle-alert': TriangleAlert,
  'user-plus': UserPlus,
  users: Users,
  wallet: Wallet,
  wrench: Wrench,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

// Permite colorear los iconos con clases de texto (text-primary, text-muted-foreground…).
for (const icon of Object.values(ICONS)) {
  cssInterop(icon, { className: { target: 'style', nativeStyleToProp: { color: true, opacity: true } } });
}

export type IconProps = {
  name: IconName;
  size?: 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 32;
  className?: string;
  /** Si se indica, el icono se anuncia; si no, es decorativo. */
  label?: string;
};

export function Icon({ name, size = 20, className, label }: IconProps) {
  const Component = ICONS[name];
  return (
    <Component
      size={size}
      strokeWidth={2}
      className={cn('text-foreground', className)}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no'}
      aria-hidden={!label}
    />
  );
}
