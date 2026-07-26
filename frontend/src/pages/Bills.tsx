import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, Trash2, Send, MoreHorizontal, Calendar, IndianRupee } from 'lucide-react';
import { billsApi } from '../api/bills';
import { Button } from '../components/shared/Button';
import { useToast } from '../components/shared/Toast';
import { formatCurrency } from '../utils/calculations';
import type { BillListItem } from '../types/bill';

export function Bills() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bills, setBills] = useState<BillListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuId]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data } = await billsApi.list({
        search: search || undefined,
        status: undefined,
      });
      setBills(data);
    } catch {
      toast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBills();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill? This cannot be undone.')) return;
    try {
      await billsApi.delete(id);
      setBills((b) => b.filter((x) => x.id !== id));
      toast('Bill deleted', 'success');
    } catch {
      toast('Failed to delete bill', 'error');
    }
  };

  const handleSend = async (id: string) => {
    try {
      await billsApi.send(id);
      toast('Bill emailed to recipient', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to send bill', 'error');
    }
  };

  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#141412] tracking-[-0.02em]">Bills & Invoices</h1>
          <p className="text-sm text-[#6B6B66] mt-0.5">{totalBills} bill{totalBills !== 1 ? 's' : ''} · {formatCurrency(totalAmount, 'INR')} total</p>
        </div>
        <Button onClick={() => navigate('/bills/new')} className="gap-1.5">
          <Plus size={15} strokeWidth={2.5} />
          New bill
        </Button>
      </div>

      {/* Stats row */}
      {bills.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-[#E4E4E0] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F4F1] flex items-center justify-center shrink-0">
              <FileText size={17} className="text-[#6B6B66]" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[#141412] leading-none tracking-[-0.02em]">{totalBills}</p>
              <p className="text-[11px] text-[#6B6B66] mt-1 leading-tight">Total bills</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E4E4E0] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5EE] flex items-center justify-center shrink-0">
              <IndianRupee size={17} className="text-[#1B6B4A]" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[#141412] leading-none tracking-[-0.02em]">{formatCurrency(totalAmount, 'INR')}</p>
              <p className="text-[11px] text-[#6B6B66] mt-1 leading-tight">Total amount</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C0C0BB]" />
          <input
            type="text"
            placeholder="Search bills by number or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E4E4E0] rounded-xl text-sm text-[#141412] placeholder:text-[#C0C0BB] focus:outline-none focus:ring-2 focus:ring-[#1B6B4A]/20 focus:border-[#1B6B4A] transition-all"
          />
        </form>
      </div>

      {/* Bills grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-[#E4E4E0] border-t-[#1B6B4A] rounded-full animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5EE] flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-[#1B6B4A]" />
          </div>
          <h2 className="text-xl font-bold text-[#141412] tracking-tight mb-2">No bills yet</h2>
          <p className="text-sm text-[#6B6B66] max-w-sm mx-auto leading-relaxed mb-6">
            Create professional invoices, track payments, and email bills directly to your clients.
          </p>
          <Button onClick={() => navigate('/bills/new')} size="lg">
            <Plus size={16} />
            Create your first bill
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              onClick={() => navigate(`/bills/edit/${encodeURIComponent(bill.billNumber)}`)}
              className="bg-white border border-[#E4E4E0] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#141412] text-[15px] tracking-[-0.01em] leading-tight">
                    {bill.billNumber}
                  </h3>
                  <p className="text-xs text-[#6B6B66] mt-0.5 truncate">
                    {bill.recipientName}
                  </p>
                </div>
              </div>

              {bill.recipientEmail && (
                <p className="text-[11px] text-[#C0C0BB] mb-3 truncate">{bill.recipientEmail}</p>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F0F0EC]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B66]">
                  <Calendar size={11} className="text-[#C0C0BB]" />
                  <span>{new Date(bill.issueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}</span>
                </div>
                <div className="ml-auto text-base font-bold text-[#141412] tracking-[-0.01em] tabular-nums">
                  {formatCurrency(bill.total, bill.currency)}
                </div>
                <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="p-1.5 rounded-lg text-[#C0C0BB] hover:text-[#6B6B66] hover:bg-[#F5F4F1] transition-all cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === bill.id ? null : bill.id); }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenuId === bill.id && (
                    <div className="absolute right-0 bottom-full mb-1 bg-white border border-[#E4E4E0] rounded-xl shadow-lg z-20 py-1.5 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="w-full text-left px-4 py-2.5 text-[13px] text-[#6B6B66] hover:bg-[#F5F4F1] hover:text-[#141412] flex items-center gap-2.5 transition-colors cursor-pointer"
                        onClick={() => { handleSend(bill.id); setOpenMenuId(null); }}
                      >
                        <Send size={13} /> Send via email
                      </button>
                      <button
                        className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        onClick={() => { handleDelete(bill.id); setOpenMenuId(null); }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}