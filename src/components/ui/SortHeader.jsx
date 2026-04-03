export default function SortHeader({ column, label, sortConfig, onSort, style, accessor, children }) {
  const isActive = sortConfig.key === column;
  const arrow = isActive ? (sortConfig.direction === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25C7';

  return (
    <th
      className="sortable"
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => onSort(column, accessor)}
    >
      {children || label}
      <span className={`sort-indicator${isActive ? ' active' : ''}`}>{arrow}</span>
    </th>
  );
}
