import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function SiteAdSlot({ placement = 'banner', pagePath }: { placement?: string; pagePath?: string }) {
  const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '*');

  const { data: ads } = useQuery({
    queryKey: ['site-ads', placement, path],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_ads')
        .select('*')
        .eq('is_active', true)
        .eq('placement', placement)
        .in('page_path', ['*', path])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data ?? [];
    },
  });

  const ad = ads?.[0] as any;
  if (!ad) return null;

  const base = 'overflow-hidden border bg-muted/20';
  const sizeClass =
    ad.display_type === 'popup'
      ? 'fixed inset-x-4 bottom-4 z-50 rounded-lg p-3 shadow-xl md:left-auto md:w-96'
      : ad.display_type === 'slide_in'
        ? 'fixed right-4 top-24 z-50 w-80 rounded-lg p-3 shadow-xl'
        : 'my-4 rounded-md p-3';

  return (
    <aside className={`${base} ${sizeClass}`}>
      {ad.media_url && (
        <a href={ad.destination_url || '#'} target="_blank" rel="noreferrer">
          {String(ad.media_url).match(/\.(mp4|webm|mov)$/i) ? (
            <video src={ad.media_url} controls className="w-full rounded" />
          ) : (
            <img src={ad.media_url} alt={ad.name} className="w-full rounded object-cover" />
          )}
        </a>
      )}

      {!ad.media_url && ad.html_code && (
        <div dangerouslySetInnerHTML={{ __html: ad.html_code }} />
      )}
    </aside>
  );
}
