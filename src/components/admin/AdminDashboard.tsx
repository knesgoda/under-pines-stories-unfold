import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Activity, UserPlus, Flag, TrendingUp } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { AddCommentCount } from './AddCommentCount'

interface MetricsData {
  signups: Array<{ d: string; c: number }>
  dau: Array<{ d: string; c: number }>
  follows: Array<{ d: string; c: number }>
  ppu: Array<{ bucket: number; users: number }>
  open_reports: number
}

interface Report {
  id: string
  reporter_id: string
  target_user_id?: string
  post_id?: string
  comment_id?: string
  reason: string
  status: 'open' | 'reviewing' | 'closed'
  created_at: string
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('14')
  const { toast } = useToast()

  useEffect(() => {
    loadMetrics()
    loadReports()
  }, [days])

  const loadMetrics = async () => {
    try {
      const response = await fetch(`https://rxlrwephzfsmzspyjsdd.supabase.co/functions/v1/admin-metrics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (response.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You need admin privileges to access this page.',
          variant: 'destructive'
        })
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load metrics')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load metrics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load metrics. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setReports((data || []).map(report => ({
        ...report,
        status: report.status as 'open' | 'reviewing' | 'closed'
      })))
    } catch (error) {
      console.error('Failed to load reports:', error)
    }
  }

  const updateReportStatus = async (reportId: string, status: 'open' | 'reviewing' | 'closed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId)

      if (error) throw error

      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status } : report
      ))

      toast({
        title: 'Success',
        description: 'Report status updated successfully.'
      })
    } catch (error) {
      console.error('Failed to update report status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update report status.',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-muted rounded"></div>
              <div className="h-80 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getBucketLabel = (bucket: number) => {
    const ranges = ['0', '1-4', '5-8', '9-12', '13-16', '17-20', '20+']
    return ranges[bucket - 1] || `${bucket}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.signups.reduce((sum, item) => sum + item.c, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last {days} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.dau[metrics.dau.length - 1]?.c || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Follows</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.follows.reduce((sum, item) => sum + item.c, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last {days} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
              <Flag className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {metrics.open_reports}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Database Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AddCommentCount />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Signups Over Time</CardTitle>
              <CardDescription>Daily user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.signups}>
                  <XAxis 
                    dataKey="d" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => [value, 'Signups']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="c" 
                    stroke="hsl(var(--accent-warm))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent-warm))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users</CardTitle>
              <CardDescription>Users posting, liking, commenting, or following</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.dau}>
                  <XAxis 
                    dataKey="d" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => [value, 'Active Users']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="c" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posts per User Distribution</CardTitle>
              <CardDescription>How many posts users have made</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.ppu}>
                  <XAxis 
                    dataKey="bucket" 
                    tickFormatter={getBucketLabel}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => `${getBucketLabel(value as number)} posts`}
                    formatter={(value) => [value, 'Users']}
                  />
                  <Bar dataKey="users" fill="hsl(var(--muted))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports Queue</CardTitle>
              <CardDescription>Recent user reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={report.status === 'open' ? 'destructive' : 
                              report.status === 'reviewing' ? 'default' : 'secondary'}
                    >
                      {report.status}
                    </Badge>
                    <Select 
                      value={report.status} 
                      onValueChange={(value: 'open' | 'reviewing' | 'closed') => 
                        updateReportStatus(report.id, value)
                      }
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="reviewing">Review</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {reports.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {reports.length - 5} more reports...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}