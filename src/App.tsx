import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider } from '@/providers/Web3Provider';
import { ErrorBoundary } from 'react-error-boundary';
import Store from './pages/Store';
import ItemDetail from './pages/ItemDetail';
import TopUp from './pages/TopUp';
import History from './pages/History';
import Admin from './pages/Admin';
import ComingSoon from './pages/ComingSoon';
import NotFound from './pages/NotFound';

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className='min-h-screen flex items-center justify-center bg-background'>
    <div className='text-center space-y-4 p-8'>
      <h1 className='text-4xl font-bold text-destructive'>
        Something went wrong
      </h1>
      <p className='text-muted-foreground'>{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className='px-4 py-2 bg-primary text-primary-foreground rounded-md'
      >
        Reload Page
      </button>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Store />} />
            <Route path='/item/:id' element={<ItemDetail />} />
            <Route path='/top-up' element={<TopUp />} />
            <Route path='/history' element={<History />} />
            <Route path='/admin' element={<Admin />} />
            <Route
              path='/profile'
              element={<ComingSoon title='Player Profile' />}
            />
            <Route
              path='/match-history'
              element={<ComingSoon title='Match History' />}
            />
            <Route path='/clan' element={<ComingSoon title='Clan System' />} />
            <Route
              path='/trading'
              element={<ComingSoon title='P2P Trading' />}
            />
            <Route
              path='/leaderboard'
              element={<ComingSoon title='Leaderboard' />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path='*' element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </ErrorBoundary>
);

export default App;
