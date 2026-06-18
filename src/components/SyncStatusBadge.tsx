// Thin re-export shim — CloudStatusBadge is the modern variant.
import CloudStatusBadge from './CloudStatusBadge';
interface Props { status?: 'cloud' | 'local' | 'syncing' | 'offline'; }
export default function SyncStatusBadge(_p: Props) {
  return <CloudStatusBadge variant="inline" />;
}
