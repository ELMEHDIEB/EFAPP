import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export function GrowthBarChart({ growthData }) {
  return (
    <div className="pro-card p-6 h-[400px] flex flex-col">
      <h2 className="pro-heading mb-6">Gains vs Dépenses (Net)</h2>
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={growthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              cursor={{fill: '#ffffff05'}}
              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Growth" name="Gains (+)" stackId="a" fill="#10b981" radius={[2,2,0,0]} />
            <Bar dataKey="Decline" name="Dépenses (-)" stackId="a" fill="#ef4444" radius={[0,0,2,2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
