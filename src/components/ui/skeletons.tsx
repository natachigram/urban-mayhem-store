import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const ItemCardSkeleton = () => {
  return (
    <Card className='overflow-hidden border-border/40 bg-gradient-card'>
      <Skeleton className='aspect-square w-full' />
      <div className='p-4 space-y-3'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-4 w-32' />
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-9 w-20' />
        </div>
      </div>
    </Card>
  );
};

export const ItemDetailSkeleton = () => {
  return (
    <div className='grid lg:grid-cols-2 gap-8'>
      <div className='space-y-4'>
        <Skeleton className='aspect-square w-full rounded-lg' />
      </div>
      <div className='space-y-6'>
        <div>
          <Skeleton className='h-4 w-24 mb-2' />
          <Skeleton className='h-10 w-3/4 mb-4' />
          <Skeleton className='h-16 w-full mb-4' />
          <Skeleton className='h-32 w-full mb-6' />
        </div>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-12 w-32' />
          <Skeleton className='h-12 flex-1' />
        </div>
      </div>
    </div>
  );
};

export const LeaderboardSkeleton = () => {
  return (
    <div className='space-y-6'>
      <div className='grid gap-6 md:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='p-6'>
            <Skeleton className='h-12 w-12 rounded-full mb-4' />
            <Skeleton className='h-20 w-20 rounded-full mb-4' />
            <Skeleton className='h-6 w-32 mb-2' />
            <Skeleton className='h-8 w-24' />
          </Card>
        ))}
      </div>
      <Card>
        <div className='p-4 space-y-4'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-6 flex-1' />
              <Skeleton className='h-6 w-20' />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
