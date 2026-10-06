'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';

const config = {
  signups: { label: 'Sign-ups', color: 'var(--primary)' }
} satisfies ChartConfig;

export function SignupsChart({ data }: { data: { day: string; signups: number }[] }) {
  return (
    <ChartContainer config={config} className='h-56 w-full'>
      <BarChart data={data} margin={{ left: -20, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='day'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(day: string) =>
            new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey='signups' fill='var(--color-signups)' radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
