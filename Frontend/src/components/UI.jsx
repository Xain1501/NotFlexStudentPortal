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
    primary: "bg-primary-500/20 text-primary-400 border border-primary-500/30",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
  };

  return (
    <div className="card hover:border-primary-500/50 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-300 font-medium">{title}</p>
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
    <div className="overflow-x-auto rounded-lg border border-dark-700">
      <table className="min-w-full divide-y divide-dark-700">
        <thead className="bg-dark-900">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-xs font-semibold text-dark-200 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-dark-800 divide-y divide-dark-700">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={
                onRowClick
                  ? "hover:bg-dark-700 cursor-pointer transition-colors"
                  : "hover:bg-dark-700/50 transition-colors"
              }
            >
              {columns.map((column, colIdx) => (
                <td
                  key={colIdx}
                  className="px-6 py-4 whitespace-nowrap text-sm text-dark-100"
                >
                  {column.accessor ? column.accessor(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-8 text-dark-400">No data available</div>
      )}
    </div>
  );
};

export const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-dark-700 text-dark-200 border border-dark-600",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    primary: "bg-primary-500/20 text-primary-400 border border-primary-500/30",
    info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
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

        <div className="inline-block align-bottom bg-dark-800 border border-dark-700 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 pt-6 pb-6">
            <h3 className="text-lg font-bold leading-6 text-white mb-4 border-b border-dark-700 pb-3">
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
        className={`animate-spin rounded-full border-b-2 border-primary-500 ${sizes[size]}`}
      ></div>
    </div>
  );
};
