import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-background relative overflow-hidden'>
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

      <div className='text-center relative z-10 max-w-md px-4'>
        <div className='flex justify-center mb-6'>
          <div className='relative'>
            <div className='absolute inset-0 bg-destructive/20 blur-xl rounded-full animate-pulse'></div>
            <AlertTriangle className='h-24 w-24 text-destructive relative z-10' />
          </div>
        </div>

        <h1 className='mb-2 text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 tracking-tighter'>
          404
        </h1>

        <div className='h-1 w-24 bg-destructive mx-auto mb-6'></div>

        <h2 className='mb-4 text-2xl font-bold uppercase tracking-widest text-foreground'>
          Sector Not Found
        </h2>

        <p className='mb-8 text-muted-foreground font-mono text-sm border border-destructive/20 bg-destructive/5 p-4'>
          ERROR: The coordinates{' '}
          <span className='text-destructive'>{location.pathname}</span> do not
          exist in the current operational map.
        </p>

        <Button
          asChild
          size='lg'
          className='h-12 px-8 uppercase font-bold tracking-wider rounded-none bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-green'
        >
          <a href='/' className='flex items-center gap-2'>
            <Home className='h-4 w-4' />
            Return to Base
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
