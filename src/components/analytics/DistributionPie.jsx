import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function DistributionPie({ pieData }) {
  return (
    <div className="pro-card p-6 h-[400px] flex flex-col">
      <h2 className="pro-heading mb-6">DISTRIBUTION DE COMPTES ET LEUR COIN</h2>
      <div className="flex-1 w-full h-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value, name, props) => [`${value} (${props.payload.percent}%)`, name]}
              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }} 
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Custom Legend */}
        <div className="absolute bottom-0 w-full flex flex-wrap justify-center gap-3">
          {pieData.map((entry, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-textdim">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              {entry.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
