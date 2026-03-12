import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, PlusCircle, UserMinus, Star, Zap, Info } from 'lucide-react';

const DraftTable = ({ players, onDraft, onTaken, onShowTilt, watchlist, onToggleWatchlist, scoringSystem, view, onPreviewPlayer, onClearPreview }) => {
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: 'tier',
        header: () => (
          <div className="flex items-center gap-1 cursor-help" title="Draft Tier. Players are grouped into tiers based on significant drops in their projected value.">
            Tier <Info size={12} className="text-gray-400" />
          </div>
        ),
        cell: info => <div className="w-8 text-center font-mono text-sm text-gray-400 font-medium">{info.getValue()}</div>,
        size: 20,
      },
      {
        accessorKey: 'name',
        header: () => <span title="Player Name & Position">Player</span>,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{info.getValue()}</span>
            <span className="text-xs text-gray-500 uppercase">{info.row.original.position || 'UTIL'}</span>
          </div>
        ),
      },
    ];

    const h2hColumns = [
      {
        accessorKey: 'vorp',
        header: () => (
          <div className="flex items-center gap-1 cursor-help" title="Value Over Replacement Player (VORP). Calculated by subtracting the replacement level points for the player's position from their projected points. This helps compare value across positions.">
            Value <Info size={12} className="text-gray-400" />
          </div>
        ),
        cell: (info) => {
          const value = info.getValue() || 0;
          return (
            <span className={`font-mono font-black text-lg ${value >= 0 ? 'text-blue-600' : 'text-gray-500'}`}>
              {value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
            </span>
          );
        },
      },
      {
        accessorKey: 'total_points',
        header: () => (
          <div className="flex items-center gap-1 cursor-help" title="Projected Total Season Points. The sum of all projected stats multiplied by your league's scoring settings.">
            Proj Pts <Info size={12} className="text-gray-400" />
          </div>
        ),
        cell: (info) => <span className="font-semibold text-gray-800">{(info.getValue() || 0).toFixed(0)}</span>,
      },
    ];

    const sgpColumns = [
      {
        accessorKey: 'sgp_value',
        header: () => (
          <div className="flex items-center gap-1 cursor-help" title="Standings Gain Points (SGP). Measures how much a player contributes to gaining a point in the standings across all categories, weighted by category scarcity.">
            SGP <Info size={12} className="text-gray-400" />
          </div>
        ),
        cell: (info) => {
          const value = info.getValue() || 0;
          return (
            <span className={`font-mono font-black text-lg ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
            </span>
          );
        },
      },
    ];

    const hitterStats = [
      { accessorKey: 'R', header: () => <span title="Runs Scored">R</span> },
      { accessorKey: 'HR', header: () => <span title="Home Runs">HR</span> },
      { accessorKey: 'RBI', header: () => <span title="Runs Batted In">RBI</span> },
      { accessorKey: 'SB', header: () => <span title="Stolen Bases">SB</span> },
      { accessorKey: 'AVG', header: () => <span title="Batting Average">AVG</span>, cell: (info) => (info.getValue() || 0).toFixed(3).substring(1) },
    ];

    const pitcherStats = [
      { accessorKey: 'W', header: () => <span title="Wins">W</span> },
      { accessorKey: 'L', header: () => <span title="Losses">L</span> },
      { accessorKey: 'IP', header: () => <span title="Innings Pitched">IP</span> },
      { accessorKey: 'SV', header: () => <span title="Saves">SV</span> },
      { accessorKey: 'HLD', header: () => <span title="Holds">HLD</span> },
      { accessorKey: 'SO', header: () => <span title="Strikeouts">K</span> },
      { accessorKey: 'ERA', header: () => <span title="Earned Run Average">ERA</span>, cell: (info) => (info.getValue() || 0).toFixed(2) },
      { accessorKey: 'WHIP', header: () => <span title="Walks + Hits / IP">WHIP</span>, cell: (info) => (info.getValue() || 0).toFixed(2) },
    ];

    const actionColumn = {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onToggleWatchlist(row.original)}
            className="group-hover:scale-110 transition-transform text-gray-400 hover:text-yellow-500"
            title="Add to watchlist"
          >
            <Star size={16} className={watchlist.some(p => p.id === row.original.id) ? 'fill-current text-yellow-500' : ''} />
          </button>
          <button onClick={() => onShowTilt(row.original)} className="group-hover:scale-110 transition-transform text-gray-400 hover:text-purple-600" title="Anti-Tilt Analysis">
            <Zap size={16} />
          </button>
          <button onClick={() => onDraft(row.original)} className="group-hover:scale-110 transition-transform text-blue-500 hover:text-blue-600" title="Draft to My Team">
            <PlusCircle size={18} />
          </button>
          <button onClick={() => onTaken(row.original)} className="group-hover:scale-110 transition-transform text-gray-400 hover:text-red-500" title="Drafted by Opponent">
            <UserMinus size={16} />
          </button>
        </div>
      ),
    };

    return [
      ...baseColumns,
      ...(scoringSystem === 'h2h' ? h2hColumns : sgpColumns),
      ...(view === 'pitchers' ? pitcherStats : hitterStats),
      actionColumn
    ];
  }, [onDraft, onTaken, onShowTilt, scoringSystem, view, watchlist, onToggleWatchlist]);

  const table = useReactTable({
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: scoringSystem === 'h2h' ? 'vorp' : 'sgp_value', desc: true }],
    },
  });

  return (
    <div className="overflow-auto h-[65vh] w-full border border-gray-200 rounded-lg shadow-inner bg-white relative">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map((header) => {
                const isActions = header.column.id === 'actions';
                return (
                <th key={header.id} className={`p-3 text-xs uppercase text-gray-600 tracking-wider font-bold bg-gray-50 whitespace-nowrap sticky top-0 ${isActions ? 'right-0 z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]' : 'z-10'}`}>
                  <div
                    className="flex items-center gap-1 cursor-pointer select-none hover:text-gray-900 group"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <ArrowUpDown size={12} className={`text-gray-400 ${header.column.getIsSorted() ? 'text-blue-600' : 'opacity-50 group-hover:opacity-100'}`} />}
                  </div>
                </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors group"
              onMouseEnter={() => onPreviewPlayer(row.original)}
              onMouseLeave={onClearPreview}
            >
              {row.getVisibleCells().map((cell) => {
                const isActions = cell.column.id === 'actions';
                return (
                <td key={cell.id} className={`p-3 text-sm text-gray-700 ${isActions ? 'sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''}`}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DraftTable;