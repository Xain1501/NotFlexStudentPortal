import { useState, useEffect } from "react";
import { studentAPI } from "../../services/api";
import { Card, LoadingSpinner, Badge } from "../../components/UI";
import { DollarSign } from "lucide-react";

export const StudentFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getFees();
      if (response.data.success) {
        setFees(response.data.data.fees || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fees");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalDue = fees.reduce((sum, fee) => sum + (fee.amount_due || 0), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0);
  const balance = totalDue - totalPaid;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <DollarSign className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fee Details
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Due
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              PKR {totalDue.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Paid
            </p>
            <p className="text-3xl font-bold text-green-600">
              PKR {totalPaid.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Balance
            </p>
            <p
              className={`text-3xl font-bold ${
                balance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              PKR {balance.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* Fee Records */}
      <Card title="Fee Records">
        <div className="space-y-4">
          {fees.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No fee records found
            </p>
          ) : (
            fees.map((fee, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {fee.semester} Semester
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Due Date: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      fee.status === "paid"
                        ? "success"
                        : fee.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {fee.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tuition Fee
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      PKR {(fee.tuition_fee || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Lab Fee</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      PKR {(fee.lab_fee || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Misc. Fee
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      PKR {(fee.miscellaneous_fee || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      PKR {(fee.amount_due || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {fee.amount_paid > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Amount Paid:
                      </span>
                      <span className="font-medium text-green-600">
                        PKR {fee.amount_paid.toLocaleString()}
                      </span>
                    </div>
                    {fee.payment_date && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          Payment Date:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(fee.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
