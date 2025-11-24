import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccount } from 'wagmi';
import { supabase } from '@/services/supabase';
import {
  Coins,
  ExternalLink,
  Download,
  Filter,
  Search,
  Package,
  Clock,
} from 'lucide-react';

interface Purchase {
  id: string;
  item_id: string;
  user_wallet: string;
  amount: number;
  quantity: number;
  transaction_hash: string;
  status: string;
  metadata: {
    item_identifier?: string;
    player_id?: string;
  };
  created_at: string;
}

const History = () => {
  const { address, isConnected } = useAccount();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isConnected && address) {
      fetchPurchases();
    } else {
      setLoading(false);
    }

    // Listen for balance updates to refresh purchase history
    const handleBalanceUpdate = () => {
      if (isConnected && address) {
        fetchPurchases();
      }
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    return () =>
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
  }, [isConnected, address]);

  useEffect(() => {
    filterPurchases();
  }, [purchases, searchQuery, statusFilter]);

  const fetchPurchases = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, items(*)')
        .eq('user_wallet', address)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check if user has rated each purchased item
      if (data) {
        const purchasesWithRatings = await Promise.all(
          data.map(async (purchase) => {
            // Check if user has any attestations for this item
            const { data: itemAtom } = await supabase
              .from('atoms')
              .select('atom_id')
              .eq('entity_type', 'item')
              .eq('entity_id', purchase.item_id)
              .single();

            if (itemAtom) {
              const { data: attestations } = await supabase
                .from('attestations')
                .select('id')
                .eq('creator_wallet', address)
                .eq('subject_atom_id', itemAtom.atom_id)
                .limit(1);

              return {
                ...purchase,
                hasUserRated: (attestations?.length || 0) > 0,
              };
            }

            return {
              ...purchase,
              hasUserRated: false,
            };
          })
        );
        setPurchases(purchasesWithRatings);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    let filtered = [...purchases];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.transaction_hash
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.metadata?.player_id
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.metadata?.item_identifier
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPurchases(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Item',
      'Player ID',
      'Amount',
      'Status',
      'TX Hash',
    ];
    const rows = filteredPurchases.map((p) => [
      new Date(p.created_at).toLocaleString(),
      p.metadata?.item_identifier || p.item_id,
      p.metadata?.player_id || 'N/A',
      `${p.amount} $TRUST`,
      p.status,
      p.transaction_hash || 'N/A',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases_${Date.now()}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-primary text-primary bg-primary/10';
      case 'pending':
        return 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
      case 'failed':
        return 'border-destructive text-destructive bg-destructive/10';
      default:
        return 'border-border text-muted-foreground';
    }
  };

  const totalSpent = filteredPurchases
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (!isConnected) {
    return (
      <div className='min-h-screen bg-background'>
        <Header />
        <main className='container py-24'>
          <Card className='max-w-md mx-auto border-border/50 bg-card/50'>
            <CardHeader>
              <CardTitle className='text-center'>Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className='text-center text-muted-foreground'>
              <p>Connect your wallet to view your purchase history</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='container py-12 space-y-8'>
        {/* Header */}
        <div>
          <h1 className='text-4xl font-black uppercase italic tracking-tighter'>
            Purchase <span className='text-primary'>History</span>
          </h1>
          <p className='text-muted-foreground mt-2'>
            Track all your transactions and purchases
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <Package className='h-4 w-4' />
                Total Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black text-foreground'>
                {loading ? (
                  <Skeleton className='h-10 w-16' />
                ) : (
                  filteredPurchases.filter((p) => p.status === 'completed')
                    .length
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <Coins className='h-4 w-4' />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-black text-primary'>
                {loading ? (
                  <Skeleton className='h-10 w-32' />
                ) : (
                  <>
                    {totalSpent.toFixed(2)}{' '}
                    <span className='text-xl'>$TRUST</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                Last Purchase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-lg font-bold text-foreground'>
                {loading ? (
                  <Skeleton className='h-6 w-24' />
                ) : filteredPurchases[0] ? (
                  new Date(filteredPurchases[0].created_at).toLocaleDateString()
                ) : (
                  'No purchases yet'
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className='border-border/50 bg-card/50'>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by transaction hash, player ID, or item...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10 bg-background/50 border-border/50'
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full md:w-[180px] bg-background/50 border-border/50'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                onClick={exportToCSV}
                disabled={filteredPurchases.length === 0 || loading}
                className='gap-2 border-border/50'
              >
                <Download className='h-4 w-4' />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Table */}
        <div className='rounded-none border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden'>
          {loading ? (
            <div className='p-6 space-y-4'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className='p-12 text-center text-muted-foreground'>
              <Package className='h-16 w-16 mx-auto mb-4 opacity-20' />
              <p className='text-lg font-medium'>No purchases found</p>
              <p className='text-sm'>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Make your first purchase to see it here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className='bg-secondary/50'>
                <TableRow className='hover:bg-transparent border-border/50'>
                  <TableHead className='uppercase font-bold tracking-wider text-xs'>
                    Date
                  </TableHead>
                  <TableHead className='uppercase font-bold tracking-wider text-xs'>
                    Item
                  </TableHead>
                  <TableHead className='uppercase font-bold tracking-wider text-xs'>
                    Player ID
                  </TableHead>
                  <TableHead className='uppercase font-bold tracking-wider text-xs'>
                    Amount
                  </TableHead>
                  <TableHead className='uppercase font-bold tracking-wider text-xs'>
                    Status
                  </TableHead>
                  <TableHead className='uppercase font-bold tracking-wider text-xs text-right'>
                    Transaction
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow
                    key={purchase.id}
                    className='border-border/50 hover:bg-primary/5 transition-colors'
                  >
                    <TableCell className='font-mono text-sm text-muted-foreground'>
                      {new Date(purchase.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-sm'>
                          {purchase.metadata?.item_identifier ||
                            purchase.item_id}
                        </span>
                        {purchase.hasUserRated && (
                          <Badge
                            variant='secondary'
                            className='text-[10px] bg-green-500/10 text-green-500 border-green-500/20'
                          >
                            Rated ✓
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='font-mono text-sm text-primary'>
                        {purchase.metadata?.player_id || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-bold'>
                        {purchase.amount}{' '}
                        <span className='text-electric-blue'>$TRUST</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={`rounded-none uppercase text-[10px] font-bold tracking-wider ${getStatusColor(
                          purchase.status
                        )}`}
                      >
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {purchase.transaction_hash ? (
                        <a
                          href={`https://testnet.explorer.intuition.systems/tx/${purchase.transaction_hash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors'
                        >
                          {purchase.transaction_hash.slice(0, 8)}...
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      ) : (
                        <span className='text-xs text-muted-foreground'>
                          N/A
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
