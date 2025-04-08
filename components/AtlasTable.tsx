
import * as React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { TableVirtuoso, TableComponents } from 'react-virtuoso'

export interface AtlasColumn<T> {
  dataKey: keyof T
  label: string
  numeric?: boolean
  width?: number
}

interface AtlasTableProps<T extends { id: number }> {
  columns: AtlasColumn<T>[]
  rows: T[]
  height?: number
}

export function AtlasTable<T extends { id: number }>({
  columns,
  rows,
  height = 400
}: AtlasTableProps<T>) {
  const VirtuosoTableComponents: TableComponents<T> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: props => (
      <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableHead {...props} ref={ref} />
    )),
    TableRow,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableBody {...props} ref={ref} />
    )),
  }

  const fixedHeaderContent = () => (
    <TableRow>
      {columns.map(column => (
        <TableCell
          key={String(column.dataKey)}
          variant="head"
          align={column.numeric ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{ backgroundColor: 'background.paper' }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  )

  const rowContent = (_index: number, row: T) => (
    <>
      {columns.map(column => (
        <TableCell
          key={String(column.dataKey)}
          align={column.numeric ? 'right' : 'left'}
        >
          {row[column.dataKey]}
        </TableCell>
      ))}
    </>
  )

  return (
    <Paper style={{ height, width: '100%' }}>
      <TableVirtuoso
        data={rows}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={rowContent}
      />
    </Paper>
  )
}

export default AtlasTable
