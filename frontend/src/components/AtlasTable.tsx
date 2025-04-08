import React, { ReactNode, useState, useEffect } from 'react';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Checkbox,
  ListItemText,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  KeyboardArrowUp as SortUpIcon,
  KeyboardArrowDown as SortDownIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

export interface AtlasColumn<T = any> {
  dataKey: string;
  label: string;
  width?: number;
  numeric?: boolean;
  tooltip?: string;
  render?: (value: any, row: T) => React.ReactNode | JSX.Element | string | null;
  sortable?: boolean;
  filterable?: boolean;
}

export interface AtlasTableProps<T = any> {
  columns: AtlasColumn<T>[];
  rows: T[];
  heightPx?: number;
  height?: number;
  emptyMessage?: string;
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
  densePadding?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (column: string, filterValue: string) => void;
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
}

const AtlasTable = <T extends { id: number | string }>({
  columns,
  rows,
  heightPx = 400,
  height,
  emptyMessage = 'Keine Daten vorhanden',
  stickyHeader = true,
  onRowClick,
  densePadding = false,
  sortColumn,
  sortDirection,
  initialSortColumn,
  initialSortDirection,
  onSort,
  onFilter,
  loading = false,
  onEdit,
  onDelete,
  onView
}: AtlasTableProps<T>) => {
  // Verwende height wenn gesetzt, sonst heightPx
  const tableHeight = height || heightPx;

  // Zustand für die Filtermenüs
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [filterValues, setFilterValues] = useState<{ [key: string]: string }>({});

  // Aktuelle Filter anzeigen - verwende initialSortColumn/Direction wenn sortColumn/Direction nicht definiert sind
  const [localSortConfig, setLocalSortConfig] = useState<{
    column: string | undefined;
    direction: 'asc' | 'desc';
  }>({
    column: sortColumn || initialSortColumn,
    direction: sortDirection || initialSortDirection || 'asc'
  });

  // Synchronisiere externen Sortierstatus
  useEffect(() => {
    if (sortColumn !== undefined && (sortColumn !== localSortConfig.column || sortDirection !== localSortConfig.direction)) {
      setLocalSortConfig({
        column: sortColumn,
        direction: sortDirection || 'asc'
      });
    }
  }, [sortColumn, sortDirection, localSortConfig.column, localSortConfig.direction]);

  const tableRef = React.useRef<HTMLDivElement>(null);

  const TableHeader = () => (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={String(column.dataKey)}
            align={column.numeric ? 'right' : 'left'}
            style={{ width: column.width }}
          >
            {column.label}
          </TableCell>
        ))}
        {onEdit && (
          <TableCell align="right" style={{ width: 100 }}>
            Bearbeiten
          </TableCell>
        )}
        {onDelete && (
          <TableCell align="right" style={{ width: 100 }}>
            Löschen
          </TableCell>
        )}
        {onView && (
          <TableCell align="right" style={{ width: 100 }}>
            Anzeigen
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );

  const TableRowComponent = (index: number, row: T) => (
    <TableRow
      hover
      onClick={() => onRowClick?.(row)}
      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
    >
      {columns.map((column) => (
        <TableCell
          key={String(column.dataKey)}
          align={column.numeric ? 'right' : 'left'}
        >
          {column.render
            ? column.render(row[column.dataKey as keyof T], row)
            : String(row[column.dataKey as keyof T] ?? '')}
        </TableCell>
      ))}
      {onEdit && (
        <TableCell align="right">
          <Tooltip title="Bearbeiten">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
      {onDelete && (
        <TableCell align="right">
          <Tooltip title="Löschen">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
      {onView && (
        <TableCell align="right">
          <Tooltip title="Anzeigen">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onView(row);
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );

  // VirtuosoTable Komponenten
  const VirtuosoTableComponents: TableComponents<T> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer
        component={Paper}
        {...props}
        ref={ref}
        sx={{
          bgcolor: '#1E1E1E',
          width: '100%',
          maxWidth: '100%'
        }}
      />
    )),
    Table: (props: React.HTMLAttributes<HTMLTableElement>) => (
      <Table
        {...props}
        sx={{
          borderCollapse: 'separate',
          width: '100%',
          tableLayout: 'auto'
        }}
        size={densePadding ? 'small' : 'medium'}
        stickyHeader={stickyHeader}
      />
    ),
    TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableHead {...props} ref={ref} />
    )),
    TableRow: ({ item, ...props }: any) => (
      <TableRow
        {...props}
        hover
        onClick={onRowClick && item ? () => onRowClick(item) : undefined}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
          '&:hover': onRowClick ? { bgcolor: 'rgba(255, 255, 255, 0.04)' } : {},
          width: '100%'
        }}
      />
    ),
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) =>
      <TableBody {...props} ref={ref} />
    ),
  };

  // Handler für Sortierung
  const handleSortClick = (columnKey: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Verhindert das Auslösen eines onRowClick-Events

    if (!onSort) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    // Wenn bereits nach dieser Spalte sortiert wird, umkehren
    if (localSortConfig.column === columnKey && localSortConfig.direction === 'asc') {
      newDirection = 'desc';
    }

    // Lokalen Status aktualisieren
    setLocalSortConfig({
      column: columnKey,
      direction: newDirection
    });

    // Callback aufrufen
    onSort(columnKey, newDirection);
  };

  // Handler für Filter
  const handleFilterClick = (columnKey: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Verhindert das Auslösen eines onRowClick-Events

    setFilterMenuAnchor({
      ...filterMenuAnchor,
      [columnKey]: event.currentTarget as HTMLElement
    });
  };

  const handleFilterClose = (columnKey: string) => {
    setFilterMenuAnchor({
      ...filterMenuAnchor,
      [columnKey]: null
    });
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilterValues({
      ...filterValues,
      [columnKey]: value
    });
  };

  const handleFilterApply = (columnKey: string) => {
    const filterValue = filterValues[columnKey] || '';

    if (onFilter) {
      onFilter(columnKey, filterValue);
    }

    handleFilterClose(columnKey);
  };

  const handleFilterClear = (columnKey: string) => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[columnKey];
    setFilterValues(newFilterValues);

    if (onFilter) {
      onFilter(columnKey, '');
    }

    handleFilterClose(columnKey);
  };

  // Handler für Eingabe-Bestätigung mit Enter
  const handleFilterKeyDown = (columnKey: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleFilterApply(columnKey);
    }
  };

  // Header für die Tabelle
  const fixedHeaderContent = () => {
    return (
      <TableRow>
        {columns.map((column) => {
          const isSorted = localSortConfig.column === column.dataKey;
          const filterValue = filterValues[column.dataKey] || '';
          const isFiltered = filterValue !== '';

          const cellContent = (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: column.numeric ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                onClick={column.sortable ? (e) => handleSortClick(column.dataKey, e) : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: column.sortable ? 'pointer' : 'default',
                  mr: column.filterable ? 1 : 0,
                  '&:hover': column.sortable ? { color: '#2196f3' } : {},
                  position: 'relative',
                  pl: column.sortable ? 0.5 : 0
                }}
              >
                <Typography
                  variant="subtitle2"
                  component="span"
                  sx={{
                    color: isSorted ? '#2196f3' : 'inherit',
                    fontWeight: isSorted ? 'bold' : 'normal'
                  }}
                >
                  {column.label}
                </Typography>

                {column.sortable && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      ml: 0.5,
                      opacity: isSorted ? 1 : 0.3, // Weniger sichtbar, wenn nicht aktiv sortiert
                      transition: 'opacity 0.2s',
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    {isSorted ? (
                      localSortConfig.direction === 'asc' ? <SortUpIcon fontSize="small" /> : <SortDownIcon fontSize="small" />
                    ) : (
                      <SortUpIcon fontSize="small" sx={{ fontSize: '0.8rem' }} /> // Kleineres Icon als Hinweis auf Sortierbarkeit
                    )}
                  </Box>
                )}
              </Box>

              {column.filterable && (
                <IconButton
                  size="small"
                  sx={{
                    ml: 0.5,
                    p: 0.2,
                    color: isFiltered ? '#2196f3' : 'inherit',
                    '&:hover': { color: '#2196f3' }
                  }}
                  onClick={(e) => handleFilterClick(column.dataKey, e)}
                >
                  <FilterIcon fontSize="small" />
                </IconButton>
              )}

              {column.filterable && (
                <Menu
                  anchorEl={filterMenuAnchor[column.dataKey]}
                  open={Boolean(filterMenuAnchor[column.dataKey])}
                  onClose={() => handleFilterClose(column.dataKey)}
                  PaperProps={{
                    sx: { minWidth: 200, maxWidth: 300, bgcolor: '#2A2A2A' }
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Filter: {column.label}
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Filterwert eingeben..."
                      value={filterValue}
                      onChange={(e) => handleFilterChange(column.dataKey, e.target.value)}
                      onKeyDown={(e) => handleFilterKeyDown(column.dataKey, e)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: filterValue && (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleFilterChange(column.dataKey, '')}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': { borderColor: '#444' }
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Filter zurücksetzen">
                        <IconButton
                          size="small"
                          onClick={() => handleFilterClear(column.dataKey)}
                          disabled={!isFiltered}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleFilterApply(column.dataKey)}
                      >
                        <FilterIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Menu>
              )}
            </Box>
          );

          return (
            <TableCell
              key={column.dataKey}
              variant="head"
              align={column.numeric ? 'right' : 'left'}
              style={{
                width: column.width || 'auto',
                minWidth: column.width ? `${column.width}px` : 'auto',
                maxWidth: column.width ? `${column.width * 1.5}px` : 'none'
              }}
              sx={{
                color: 'white',
                fontWeight: 'bold',
                bgcolor: '#232323',
                borderBottom: '1px solid #333',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: densePadding ? '8px 8px' : '16px 16px',
                '&:hover': { bgcolor: '#2a2a2a' }
              }}
            >
              {column.tooltip ? (
                <Tooltip title={column.tooltip} placement="top">
                  {cellContent}
                </Tooltip>
              ) : (
                cellContent
              )}
            </TableCell>
          );
        })}
        {/* Action columns */}
        {(onEdit || onDelete || onView) && (
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
            {onEdit && (
              <Tooltip title="Bearbeiten">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onView && (
              <Tooltip title="Anzeigen">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(row);
                  }}
                  sx={{ mr: 1 }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Löschen">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </TableCell>
        )}
      </TableRow>
    );
  };

  // Zeilen für die Tabelle
  const rowContent = (_index: number, row: T) => {
    return (
      <React.Fragment>
        {columns.map((column) => (
          <TableCell
            key={String(column.dataKey)}
            align={column.numeric ? 'right' : 'left'}
            sx={{ height: '100%' }}
          >
            {column.render
              ? column.render(row[column.dataKey as keyof T], row)
              : String(row[column.dataKey as keyof T] ?? '')}
          </TableCell>
        ))}
        {/* Action columns */}
        {(onEdit || onDelete || onView) && (
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
            {onEdit && (
              <Tooltip title="Bearbeiten">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onView && (
              <Tooltip title="Anzeigen">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(row);
                  }}
                  sx={{ mr: 1 }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Löschen">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </TableCell>
        )}
      </React.Fragment>
    );
  };

  // Render der Tabelle - Wenn keine Daten vorhanden sind, zeige eine Nachricht
  if (rows.length === 0) {
    return (
      <Paper sx={{
        bgcolor: '#1E1E1E',
        height: tableHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #333'
      }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      ref={tableRef}
      sx={{
        height: tableHeight,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableVirtuoso
          style={{ width: '100%' }}
          data={rows}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={rowContent}
        />
      )}
    </Paper>
  );
};

export default AtlasTable;
