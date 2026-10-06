import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getDestinations } from '@/features/destinations/api/service';
import { ClearCoverButton } from '@/features/destinations/components/clear-cover-button';

export const metadata = {
  title: 'Banjaro Admin: Destinations'
};

export const dynamic = 'force-dynamic';

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <PageContainer
      pageTitle='Destinations'
      pageDescription='Where people say they are going. Cover photos here are traveller uploads shown to everyone.'
    >
      {destinations.length === 0 ? (
        <div className='bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
          <div className='text-muted-foreground text-sm'>
            No destinations yet — the first trip creates one.
          </div>
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-24'>Cover</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Trips planned</TableHead>
                <TableHead className='text-right'>Cover photo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations.map((destination) => (
                <TableRow key={destination.key}>
                  <TableCell>
                    {destination.coverUrl ? (
                      /* Traveller-uploaded, arbitrary host — a plain img keeps
                         it out of the Next image optimiser's allowlist. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={destination.coverUrl}
                        alt=''
                        className='h-12 w-20 rounded object-cover'
                      />
                    ) : (
                      <div className='bg-muted h-12 w-20 rounded' />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{destination.name}</span>
                      <span className='text-muted-foreground font-mono text-xs'>
                        {destination.key} · {destination.countryCode.toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={destination.tripCount > 0 ? 'default' : 'outline'}>
                      {destination.tripCount}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    {destination.coverUrl ? (
                      <ClearCoverButton destinationKey={destination.key} />
                    ) : (
                      <span className='text-muted-foreground text-xs'>none set</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
