export const Card = ({ children, className = "", title, action }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

export const StatCard = ({ title, value, icon: Icon, color = "primary" }) => {
  const colorClasses = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
    success: "bg-green-600 text-white shadow-lg shadow-green-500/20",
    warning: "bg-yellow-600 text-white shadow-lg shadow-yellow-500/20",
    danger: "bg-red-600 text-white shadow-lg shadow-red-500/20",
  };

  return (
    <div className="card hover:border-blue-500 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-8 w-8" />
          </div>
        )}
      </div>
    </div>
  );
};

export const Table = ({ columns, data, onRowClick }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-zinc-900">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-black divide-y divide-gray-800">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={
                onRowClick
                  ? "hover:bg-zinc-900 cursor-pointer transition-colors"
                  : "hover:bg-zinc-900/50 transition-colors"
              }
            >
              {columns.map((column, colIdx) => (
                <td
                  key={colIdx}
                  className="px-6 py-4 whitespace-nowrap text-sm text-white"
                >
                  {column.accessor ? column.accessor(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">No data available</div>
      )}
    </div>
  );
};

export const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-gray-700 text-white border border-gray-600",
    success: "bg-green-600 text-white border border-green-500",
    warning: "bg-yellow-600 text-white border border-yellow-500",
    danger: "bg-red-600 text-white border border-red-500",
    primary: "bg-blue-600 text-white border border-blue-500",
    info: "bg-cyan-600 text-white border border-cyan-500",
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-zinc-900 border border-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 pt-6 pb-6">
            <h3 className="text-lg font-bold leading-6 text-white mb-4 border-b border-gray-800 pb-3">
              {title}
            </h3>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ size = "md" }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizes[size]}`}
      ></div>
    </div>
  );
};
