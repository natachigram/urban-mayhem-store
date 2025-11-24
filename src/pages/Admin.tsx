import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/services/supabase';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface SalesMetrics {
  totalRevenue: number;
  totalPurchases: number;
  uniqueBuyers: number;
  avgTransactionValue: number;
}

interface TopItem {
  item_id: string;
  item_identifier: string;
  count: number;
  revenue: number;
}

interface DailySales {
  date: string;
  revenue: number;
  purchases: number;
}

const COLORS = ['#05FF9D', '#3BA4FF', '#9D4EDD', '#F4A261', '#52B788'];

export default function Admin() {
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalRevenue: 0,
    totalPurchases: 0,
    uniqueBuyers: 0,
    avgTransactionValue: 0,
  });
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all completed purchases
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (purchases) {
        // Calculate metrics
        const totalRevenue = purchases.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const uniqueBuyers = new Set(purchases.map((p) => p.user_wallet)).size;
        const avgTransactionValue =
          purchases.length > 0 ? totalRevenue / purchases.length : 0;

        setMetrics({
          totalRevenue,
          totalPurchases: purchases.length,
          uniqueBuyers,
          avgTransactionValue,
        });

        // Calculate top items
        const itemMap = new Map<string, { count: number; revenue: number }>();
        purchases.forEach((p) => {
          const itemId = p.metadata?.item_identifier || p.item_id || 'unknown';
          const existing = itemMap.get(itemId) || { count: 0, revenue: 0 };
          itemMap.set(itemId, {
            count: existing.count + 1,
            revenue: existing.revenue + Number(p.amount),
          });
        });

        const topItemsData: TopItem[] = Array.from(itemMap.entries())
          .map(([id, data]) => ({
            item_id: id,
            item_identifier: id,
            count: data.count,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopItems(topItemsData);

        // Calculate daily sales (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const dailySalesMap = new Map<
          string,
          { revenue: number; purchases: number }
        >();
        purchases.forEach((p) => {
          const date = new Date(p.created_at).toISOString().split('T')[0];
          if (last7Days.includes(date)) {
            const existing = dailySalesMap.get(date) || {
              revenue: 0,
              purchases: 0,
            };
            dailySalesMap.set(date, {
              revenue: existing.revenue + Number(p.amount),
              purchases: existing.purchases + 1,
            });
          }
        });

        const dailySalesData: DailySales[] = last7Days.map((date) => ({
          date: new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          revenue: dailySalesMap.get(date)?.revenue || 0,
          purchases: dailySalesMap.get(date)?.purchases || 0,
        }));

        setDailySales(dailySalesData);
        setRecentPurchases(purchases.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='container py-12 space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-black uppercase italic tracking-tighter'>
              Admin <span className='text-primary'>Dashboard</span>
            </h1>
            <p className='text-muted-foreground mt-2'>
              Sales analytics and performance metrics
            </p>
          </div>
          <Badge
            variant='outline'
            className='px-4 py-2 text-sm font-bold border-primary text-primary'
          >
            LIVE DATA
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <DollarSign className='h-4 w-4' />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-10 w-32' />
              ) : (
                <div className='text-3xl font-black text-primary'>
                  {metrics.totalRevenue.toFixed(2)}{' '}
                  <span className='text-xl'>$TRUST</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <ShoppingCart className='h-4 w-4' />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-10 w-20' />
              ) : (
                <div className='text-3xl font-black text-foreground'>
                  {metrics.totalPurchases}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Unique Buyers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-10 w-16' />
              ) : (
                <div className='text-3xl font-black text-foreground'>
                  {metrics.uniqueBuyers}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-border/50 bg-card/50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                <TrendingUp className='h-4 w-4' />
                Avg Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-10 w-24' />
              ) : (
                <div className='text-3xl font-black text-electric-blue'>
                  {metrics.avgTransactionValue.toFixed(2)}{' '}
                  <span className='text-lg'>$TRUST</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Daily Sales Chart */}
          <Card className='border-border/50 bg-card/50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 uppercase text-base tracking-wider'>
                <BarChart3 className='h-5 w-5 text-primary' />
                Daily Revenue (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-64 w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#333' />
                    <XAxis dataKey='date' stroke='#666' />
                    <YAxis stroke='#666' />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                      }}
                    />
                    <Bar dataKey='revenue' fill='#05FF9D' />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Items Pie Chart */}
          <Card className='border-border/50 bg-card/50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 uppercase text-base tracking-wider'>
                <Package className='h-5 w-5 text-primary' />
                Top Items by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-64 w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={topItems}
                      dataKey='revenue'
                      nameKey='item_identifier'
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      label
                    >
                      {topItems.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Items Table */}
        <Card className='border-border/50 bg-card/50'>
          <CardHeader>
            <CardTitle className='uppercase text-base tracking-wider'>
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {loading ? (
              <div className='p-6 space-y-4'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className='bg-secondary/50'>
                  <TableRow className='hover:bg-transparent border-border/50'>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Item
                    </TableHead>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Sales
                    </TableHead>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Revenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topItems.map((item, index) => (
                    <TableRow
                      key={item.item_id}
                      className='border-border/50 hover:bg-primary/5'
                    >
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className='rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
                            style={{
                              borderColor: COLORS[index],
                              color: COLORS[index],
                            }}
                          >
                            {index + 1}
                          </Badge>
                          <span className='font-mono text-sm'>
                            {item.item_identifier}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='font-bold'>{item.count}</TableCell>
                      <TableCell className='font-bold text-primary'>
                        {item.revenue.toFixed(2)} $TRUST
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card className='border-border/50 bg-card/50'>
          <CardHeader>
            <CardTitle className='uppercase text-base tracking-wider'>
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {loading ? (
              <div className='p-6 space-y-4'>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className='h-12 w-full' />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className='bg-secondary/50'>
                  <TableRow className='hover:bg-transparent border-border/50'>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Date
                    </TableHead>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Buyer
                    </TableHead>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Item
                    </TableHead>
                    <TableHead className='uppercase font-bold tracking-wider text-xs'>
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPurchases.map((purchase) => (
                    <TableRow
                      key={purchase.id}
                      className='border-border/50 hover:bg-primary/5'
                    >
                      <TableCell className='font-mono text-sm text-muted-foreground'>
                        {new Date(purchase.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className='font-mono text-xs'>
                        {purchase.user_wallet.slice(0, 6)}...
                        {purchase.user_wallet.slice(-4)}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {purchase.metadata?.item_identifier || purchase.item_id}
                      </TableCell>
                      <TableCell className='font-bold text-primary'>
                        {purchase.amount} $TRUST
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
