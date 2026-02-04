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
    <Card className="relative overflow-hidden border-border/60 bg-[linear-gradient(135deg,_hsl(var(--primary)_/_0.16),_hsl(var(--muted)_/_0.65))] p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary">{subtitle}</p>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-secondary/90">{description}</p>
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
              width={220}
              height={160}
              className="h-auto w-48 object-contain"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default PortalHero;
