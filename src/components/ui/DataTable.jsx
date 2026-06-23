import React, { useState, useMemo } from 'react';

const DENSITY_STYLES = {
  compact: { th: 'py-2 px-3 text-xs', td: 'py-2 px-3 text-xs' },
  normal: { th: 'py-3.5 px-4 text-sm', td: 'py-3.5 px-4 text-sm' },
  comfortable: { th: 'py-5 px-6 text-base', td: 'py-5 px-6 text-sm' }
};

export default function DataTable({ 
  columns, 
  data, 
  searchQuery, 
  onSearchChange,
  globalSearchFn,
  defaultSortKey,
  defaultSortDir = 'desc',
  emptyMessage = "Aucune donnée disponible."
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [density, setDensity] = useState('normal');
  
  const processedData = useMemo(() => {
    let result = [...data];
    
    if (searchQuery && globalSearchFn) {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        result = result.filter(row => globalSearchFn(row, q));
      }
    }
    
    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      if (col && col.sortable !== false) { // sortable by default unless false
        result.sort((a, b) => {
          const valA = col.sortValue ? col.sortValue(a) : a[sortKey];
          const valB = col.sortValue ? col.sortValue(b) : b[sortKey];
          if (valA === valB) return 0;
          if (valA == null) return 1;
          if (valB == null) return -1;
          if (valA > valB) return sortDir === 'asc' ? 1 : -1;
          return sortDir === 'asc' ? -1 : 1;
        });
      }
    }
    return result;
  }, [data, columns, sortKey, sortDir, searchQuery, globalSearchFn]);

  const handleSort = (key) => {
    const col = columns.find(c => c.key === key);
    if (!col || col.sortable === false) return;
    
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getAlignClass = (align) => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {onSearchChange !== undefined && (
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="input w-full py-2 px-3 bg-panel border-border text-sm"
            />
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          {['compact', 'normal', 'comfortable'].map(d => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                density === d
                  ? "bg-white text-ink border-white"
                  : "bg-panel text-textdim border-border hover:border-white/20 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto pro-card bg-panel border border-border rounded-xl">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="sticky top-0 bg-panel z-10 shadow-sm border-b border-border">
            <tr className="text-textdim">
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={`font-medium ${DENSITY_STYLES[density].th} ${getAlignClass(col.align)} ${col.sortable !== false ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'} w-full`}>
                    {col.label}
                    {col.sortable !== false && sortKey === col.key && (
                      <span className="text-accent text-[10px] ml-1">{sortDir === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {processedData.length > 0 ? (
              processedData.map((row, i) => (
                <tr key={row.id || i} className="group hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className={`${DENSITY_STYLES[density].td} ${getAlignClass(col.align)}`}>
                      {col.render ? col.render(row, i) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-textdim">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {processedData.length > 0 ? (
          processedData.map((row, i) => (
            <div key={row.id || i} className="pro-card p-4 bg-panel border-border flex flex-col gap-3">
              {columns.map((col, colIdx) => (
                <div key={col.key} className={`flex justify-between items-center ${colIdx !== columns.length - 1 ? 'border-b border-border/50 pb-2' : ''}`}>
                  <span className="text-xs font-bold text-textdim uppercase tracking-wider">{col.label}</span>
                  <div className="text-right pl-4">
                    {col.renderMobile ? col.renderMobile(row, i) : (col.render ? col.render(row, i) : row[col.key])}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="pro-card p-8 text-center text-textdim bg-panel border-border">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
