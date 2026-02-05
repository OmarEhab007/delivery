import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PortalHeroProps {
  title: string;
  subtitle: string;
  description: string;
  imageSrc?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PortalHero({
  title,
  subtitle,
  description,
  imageSrc,
  actionLabel,
  actionHref,
}: PortalHeroProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-[radial-gradient(circle_at_top,_hsl(var(--accent)_/_0.16),_transparent_55%),linear-gradient(135deg,_hsl(var(--primary)_/_0.18),_hsl(var(--muted)_/_0.75))] p-6">
      <div className="absolute -left-10 top-4 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -right-10 bottom-6 h-28 w-28 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{subtitle}</p>
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          {actionLabel && actionHref && (
            <Button asChild className="mt-4">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
        </div>
        {imageSrc && (
          <div className="flex justify-center md:justify-end">
            <Image
              src={imageSrc}
              alt="portal-hero"
              width={240}
              height={180}
              className="h-auto w-52 object-contain drop-shadow-xl"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default PortalHero;
