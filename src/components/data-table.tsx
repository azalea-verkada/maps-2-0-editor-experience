import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  showSearch?: boolean
  searchPlaceholder?: string
  externalFilter?: ColumnFiltersState
  className?: string
}

export function DataTable<TData>({
  columns,
  data,
  showSearch = false,
  searchPlaceholder = "Search all columns…",
  externalFilter,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters: externalFilter ?? [],
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const visibleRows = table.getRowModel().rows

  return (
    <div className={cn("space-y-3", className)}>
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-border bg-card">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className={cn(
                      "p-3 text-left font-medium text-muted-foreground",
                      header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground transition-colors",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === "asc"
                          ? <ChevronUp className="size-3.5 shrink-0" />
                          : header.column.getIsSorted() === "desc"
                          ? <ChevronDown className="size-3.5 shrink-0" />
                          : <ChevronsUpDown className="size-3.5 shrink-0 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-sm text-muted-foreground">
                  No results{globalFilter ? ` for "${globalFilter}"` : ""}.
                </td>
              </tr>
            ) : (
              visibleRows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(showSearch && globalFilter) && (
        <p className="text-xs text-muted-foreground">
          {visibleRows.length} of {data.length} rows
        </p>
      )}
    </div>
  )
}
