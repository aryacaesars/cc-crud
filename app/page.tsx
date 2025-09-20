"use client";
import { useState, useEffect } from "react";
import PopupComponent from "@/components/popup";

type Transaction = {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
  createdAt: string;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  
  // State untuk popup
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'warning' as 'success' | 'warning' | 'error' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Ambil data transaksi dari API saat komponen mount
  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = filter === "all" ? "/api/transaction" : `/api/transaction?type=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      } else {
        showPopup('error', 'ERROR!', 'Gagal memuat data transaksi. Silakan refresh halaman.');
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showPopup('error', 'ERROR!', 'Terjadi kesalahan saat memuat data. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const [form, setForm] = useState<{
    type: "income" | "expense";
    category: string;
    amount: string;
    description: string;
  }>({ type: "income", category: "", amount: "", description: "" });
  const [editId, setEditId] = useState<number | null>(null);

  // Helper functions untuk popup
  const showPopup = (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: onConfirm || (() => {}),
    });
  };

  const closePopup = () => {
    setPopup({ ...popup, isOpen: false });
  };

  // Helper function untuk format currency input
  const formatCurrencyInput = (value: string): string => {
    // Hapus semua karakter non-digit
    const numberOnly = value.replace(/\D/g, '');
    
    if (!numberOnly) return '';
    
    // Format dengan pemisah ribuan
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numberOnly));
    return `Rp ${formatted}`;
  };

  // Helper function untuk parse currency input ke number
  const parseCurrencyInput = (value: string): number => {
    const numberOnly = value.replace(/\D/g, '');
    return numberOnly ? parseInt(numberOnly) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Format currency untuk input amount
      const formattedValue = formatCurrencyInput(value);
      setForm({ ...form, [name]: formattedValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form
    if (!form.category || !form.amount) {
      showPopup('warning', 'PERINGATAN!', 'Mohon lengkapi kategori dan jumlah transaksi.');
      return;
    }
    
    const amount = parseCurrencyInput(form.amount);
    if (amount <= 0) {
      showPopup('warning', 'PERINGATAN!', 'Jumlah transaksi harus lebih dari 0.');
      return;
    }

    if (editId) {
      // Update transaksi
      const res = await fetch(`/api/transaction?id=${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          category: form.category,
          amount,
          description: form.description || undefined,
        }),
      });
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          setTransactions(transactions.map(t => 
            t.id === editId ? response.data : t
          ));
          setEditId(null);
          resetForm();
          showPopup('success', 'BERHASIL!', 'Transaksi berhasil diupdate!');
        }
      } else {
        showPopup('error', 'ERROR!', 'Gagal mengupdate transaksi. Silakan coba lagi.');
      }
    } else {
      // Tambah transaksi
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          category: form.category,
          amount,
          description: form.description || undefined,
        }),
      });
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          setTransactions([response.data, ...transactions]);
          resetForm();
          showPopup('success', 'BERHASIL!', 'Transaksi berhasil ditambahkan!');
        }
      } else {
        showPopup('error', 'ERROR!', 'Gagal menambahkan transaksi. Silakan coba lagi.');
      }
    }
  };

  const resetForm = () => {
    setForm({ type: "income", category: "", amount: "", description: "" });
  };

  const handleEdit = (transaction: Transaction) => {
    setForm({
      type: transaction.type,
      category: transaction.category,
      amount: formatCurrencyInput(transaction.amount.toString()),
      description: transaction.description || "",
    });
    setEditId(transaction.id);
  };

  const handleDelete = async (id: number) => {
    const deleteTransaction = async () => {
      const res = await fetch(`/api/transaction?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
        if (editId === id) {
          setEditId(null);
          resetForm();
        }
        showPopup('success', 'BERHASIL!', 'Transaksi berhasil dihapus!');
      } else {
        showPopup('error', 'ERROR!', 'Gagal menghapus transaksi. Silakan coba lagi.');
      }
    };

    // Tampilkan popup konfirmasi
    showPopup(
      'warning', 
      'PERINGATAN!', 
      'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      deleteTransaction
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalIncome = (): number => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = (): number => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = (): number => {
    return getTotalIncome() - getTotalExpense();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Financial Manager</h1>
            <p className="text-sm font-medium text-gray-700 mt-1">Kelola keuangan Anda dengan mudah</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalIncome())}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalExpense())}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBalance() >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <svg className={`w-6 h-6 ${getBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700">Saldo</p>
                <p className={`text-2xl font-bold ${getBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(getBalance())}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {editId ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Tipe</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Kategori</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Contoh: Gaji, Makanan, Transport"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Jumlah (IDR)</label>
                  <input
                    name="amount"
                    type="text"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Rp 0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Contoh: ketik "50000" akan menjadi "Rp 50.000"</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Deskripsi (Opsional)</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Tambahan informasi..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {editId ? 'Update Transaksi' : 'Tambah Transaksi'}
                </button>

                {editId && (
                  <button
                    type="button"
                    className="w-full text-gray-700 hover:text-gray-900 font-medium py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => { setEditId(null); resetForm(); }}
                  >
                    Batal Edit
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Filter Tabs */}
              <div className="border-b p-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filter === "all" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilter("income")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filter === "income" 
                        ? "bg-green-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pemasukan
                  </button>
                  <button
                    onClick={() => setFilter("expense")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filter === "expense" 
                        ? "bg-red-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              {/* Transactions */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-700 font-medium mt-2">Memuat transaksi...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-700 font-medium">Belum ada transaksi</p>
                    <p className="text-gray-600 text-sm mt-1">Mulai dengan menambah transaksi pertama Anda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.type === 'income' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.category}</p>
                              {transaction.description && (
                                <p className="text-sm text-gray-700">{transaction.description}</p>
                              )}
                              <p className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                            <div>
                              <p className={`font-semibold ${
                                transaction.type === 'income' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                onClick={() => handleEdit(transaction)}
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                onClick={() => handleDelete(transaction.id)}
                                title="Hapus"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Component */}
      <PopupComponent
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        confirmText="Ya"
        cancelText="Tidak"
      />
    </div>
  );
}
