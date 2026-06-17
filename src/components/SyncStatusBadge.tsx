interface Props {
  status: 'cloud' | 'local' | 'syncing' | 'offline';
}
export default function SyncStatusBadge({ status }: Props) {
  const label = {
    cloud: '✓ Synced',
    local: 'Local Save',
    syncing: 'Syncing…',
    offline: 'Offline Mode',
  }[status];
  const color = status === 'cloud' ? 'text-primary border-primary/40'
    : status === 'offline' ? 'text-destructive border-destructive/40'
    : 'text-muted-foreground border-border';
  return (
    <span className={`inline-block font-pixel text-[9px] px-2 py-1 rounded border ${color} bg-card/60 backdrop-blur-sm`}>
      {label}
    </span>
  );
}
