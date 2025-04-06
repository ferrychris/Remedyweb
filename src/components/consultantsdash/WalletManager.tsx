import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { DollarSign, AlertCircle, ArrowUpRight, ArrowDownLeft, CreditCard, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  description: string;
  patient_name?: string;
  type: 'Consultation' | 'Withdrawal' | 'Refund';
}

const WalletManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'paypal'>('bank');
  const [bankInfo, setBankInfo] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: ''
  });
  const [paypalInfo, setPaypalInfo] = useState({
    email: ''
  });

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // In a real application, you would fetch this data from your backend
      // This is simulated data for demonstration purposes
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated balance data
      setBalance(1250.75);
      setPendingBalance(350.25);
      
      // Simulated transaction history
      setTransactions([
        {
          id: 1,
          amount: 150.00,
          date: '2023-07-20T14:30:00',
          status: 'Completed',
          description: 'Consultation Fee',
          patient_name: 'John Doe',
          type: 'Consultation'
        },
        {
          id: 2,
          amount: 85.50,
          date: '2023-07-18T10:15:00',
          status: 'Completed',
          description: 'Consultation Fee',
          patient_name: 'Jane Smith',
          type: 'Consultation'
        },
        {
          id: 3,
          amount: 200.00,
          date: '2023-07-15T16:45:00',
          status: 'Completed',
          description: 'Consultation Fee',
          patient_name: 'Robert Brown',
          type: 'Consultation'
        },
        {
          id: 4,
          amount: 500.00,
          date: '2023-07-10T09:20:00',
          status: 'Completed',
          description: 'Withdrawal to Bank Account',
          type: 'Withdrawal'
        },
        {
          id: 5,
          amount: 75.25,
          date: '2023-07-05T11:30:00',
          status: 'Pending',
          description: 'Consultation Fee',
          patient_name: 'Sarah Johnson',
          type: 'Consultation'
        },
        {
          id: 6,
          amount: 25.00,
          date: '2023-07-01T13:45:00',
          status: 'Failed',
          description: 'Refund to Patient',
          patient_name: 'Michael Wilson',
          type: 'Refund'
        }
      ]);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > balance) {
      toast.error('Withdrawal amount exceeds available balance');
      return;
    }

    // In a real application, you would submit this withdrawal request to your backend
    toast.success(`Withdrawal request for $${withdrawAmount} submitted`);
    
    // Add the withdrawal to the transactions list
    const newTransaction: Transaction = {
      id: Math.max(...transactions.map(t => t.id)) + 1,
      amount: parseFloat(withdrawAmount),
      date: new Date().toISOString(),
      status: 'Pending',
      description: `Withdrawal to ${withdrawMethod === 'bank' ? 'Bank Account' : 'PayPal'}`,
      type: 'Withdrawal'
    };
    
    setTransactions([newTransaction, ...transactions]);
    setBalance(prevBalance => prevBalance - parseFloat(withdrawAmount));
    setWithdrawAmount('');
    setShowWithdrawModal(false);
  };

  const downloadCSV = () => {
    // Create CSV content
    const headers = 'ID,Amount,Date,Status,Description,Patient,Type\n';
    const rows = transactions.map(t => 
      `${t.id},${t.amount.toFixed(2)},${new Date(t.date).toLocaleDateString()},${t.status},${t.description},${t.patient_name || ''},${t.type}`
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    const encodedUri = encodeURI(csvContent);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Transaction history downloaded');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-gray-800">${balance.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Withdraw Funds
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Balance</p>
              <p className="text-3xl font-bold text-gray-800">${pendingBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Will be available after consultations are completed</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
          <button 
            onClick={downloadCSV}
            className="flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-1 rounded-full mr-2">
                        {transaction.type === 'Consultation' && (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        )}
                        {transaction.type === 'Withdrawal' && (
                          <ArrowDownLeft className="h-4 w-4 text-red-600" />
                        )}
                        {transaction.type === 'Refund' && (
                          <ArrowDownLeft className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        {transaction.patient_name && (
                          <div className="text-xs text-gray-500">Patient: {transaction.patient_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : transaction.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={transaction.type === 'Withdrawal' || transaction.type === 'Refund' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.type === 'Withdrawal' || transaction.type === 'Refund' ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Earnings Tips</h2>
        <div className="space-y-3">
          <p className="text-gray-600">
            <span className="font-medium">Complete your profile:</span> Consultants with complete profiles earn 35% more on average.
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Maintain availability:</span> Regular availability slots increase your visibility to potential clients.
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Respond promptly:</span> Quick responses to consultation requests improve your booking rate.
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Withdrawals:</span> Processed within 2-3 business days. Minimum withdrawal amount is $25.
          </p>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Withdraw Funds</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="25"
                    max={balance}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Available: ${balance.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank')}
                    className={`px-4 py-2 rounded-md flex items-center ${
                      withdrawMethod === 'bank'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('paypal')}
                    className={`px-4 py-2 rounded-md flex items-center ${
                      withdrawMethod === 'paypal'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    PayPal
                  </button>
                </div>
              </div>

              {withdrawMethod === 'bank' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={bankInfo.accountName}
                      onChange={(e) => setBankInfo({...bankInfo, accountName: e.target.value})}
                      className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankInfo.accountNumber}
                      onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                      className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankInfo.bankName}
                        onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                        className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                      <input
                        type="text"
                        value={bankInfo.routingNumber}
                        onChange={(e) => setBankInfo({...bankInfo, routingNumber: e.target.value})}
                        className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {withdrawMethod === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
                  <input
                    type="email"
                    value={paypalInfo.email}
                    onChange={(e) => setPaypalInfo({...paypalInfo, email: e.target.value})}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawal}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager; 