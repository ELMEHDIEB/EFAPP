import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function EvolutionChart({ accounts, multiLineData, COLORS }) {
  return (
    <div className="lg:col-span-2 pro-card p-6 h-[400px] flex flex-col">
      <h2 className="pro-heading mb-6">Évolution Historique des Comptes</h2>
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={multiLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {accounts.map((acc, i) => (
                <linearGradient key={`grad-${acc.id}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
            <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }} />
            {accounts.map((acc, i) => (
              <Area 
                key={acc.id}
                type="monotone" 
                dataKey={acc.name} 
                stroke={COLORS[i % COLORS.length]} 
                fillOpacity={1} 
                fill={`url(#color-${i})`} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
