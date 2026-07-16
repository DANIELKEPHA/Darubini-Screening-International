"use client";

import React, { useState } from 'react';
import { useGetContactsQuery, useDeleteContactMutation } from '@/state/api';
import { toast } from 'sonner';
import { Loader2, Trash2, Eye, Search, Mail, Calendar, User, Filter, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Contact } from '@/state';
import { motion, AnimatePresence } from 'framer-motion';
import ContactDetailsModal from "@/app/(dashboard)/admin/newsletter/components/ContactDetailsModal";

const Contacts = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'has-message' | 'no-message'>('all');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, isFetching } = useGetContactsQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this contact submission? This action cannot be undone.')) return;

    try {
      await deleteContact(id).unwrap();
      toast.success('Contact deleted successfully');
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  // Filter contacts based on filterBy
  const filteredContacts = React.useMemo(() => {
    if (!data?.contacts) return [];

    if (filterBy === 'has-message') {
      return data.contacts.filter(c => c.message && c.message.trim().length > 0);
    } else if (filterBy === 'no-message') {
      return data.contacts.filter(c => !c.message || c.message.trim().length === 0);
    }
    return data.contacts;
  }, [data?.contacts, filterBy]);

  const totalFiltered = filteredContacts.length;

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Contact Requests
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Mail size={16} />
                Manage newsletter signups and inquiries
                {data && (
                    <span className="ml-2 px-2.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  {data.total} total
                </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className="appearance-none pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <option value="all">All Contacts</option>
                  <option value="has-message">With Messages</option>
                  <option value="no-message">Without Messages</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm placeholder:text-gray-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {data && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{data.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm text-gray-500">With Messages</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.contacts.filter(c => c.message && c.message.trim().length > 0).length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm text-gray-500">Recent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.contacts.filter(c => {
                      const daysAgo = (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                      return daysAgo <= 7;
                    }).length}
                  </p>
                </div>
              </div>
          )}

          {/* Loading State */}
          {(isLoading || isFetching) && !data && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
                <p className="mt-4 text-gray-500">Loading contacts...</p>
              </div>
          )}

          {/* Error State */}
          {isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-12 rounded-2xl text-center">
                <p className="font-medium">Failed to load contact requests</p>
                <p className="text-sm mt-1">Please try again later.</p>
              </div>
          )}

          {/* Main Content */}
          {data && (
              <>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/80 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            Name
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Mail size={14} />
                            Email
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Filter size={14} />
                            Interests
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            Date
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                      <AnimatePresence>
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact, index) => (
                                <motion.tr
                                    key={contact.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleViewDetails(contact)}
                                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                                        {contact.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-medium text-gray-900">{contact.name}</span>
                                      {contact.message && contact.message.trim().length > 0 && (
                                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    Has Message
                                  </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                                  <td className="px-6 py-4 text-sm">
                                    <div className="flex flex-wrap gap-1">
                                      {(() => {
                                        const interests = contact.interests?.split(',').map(i => i.trim()).filter(Boolean) || [];
                                        const displayInterests = interests.slice(0, 2);
                                        const remainingCount = interests.length - 2;

                                        return (
                                            <>
                                              {displayInterests.map((interest, i) => (
                                                  <span
                                                      key={i}
                                                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                  >
                                                          {interest}
                                                           </span>
                                              ))}
                                              {remainingCount > 0 && (
                                                  <span className="px-2 py-0.5 text-gray-400 text-xs">
                                                       +{remainingCount}
                                                       </span>
                                              )}
                                            </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {format(new Date(contact.createdAt), 'MMM dd, yyyy')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                      <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDetails(contact);
                                          }}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all group-hover:scale-105"
                                          title="View details"
                                      >
                                        <Eye size={18} />
                                      </button>
                                      <button
                                          onClick={(e) => handleDelete(contact.id, e)}
                                          disabled={isDeleting}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all group-hover:scale-105 disabled:opacity-50"
                                          title="Delete"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <Search className="text-gray-400" size={24} />
                                  </div>
                                  <p className="text-gray-500 font-medium">No contacts found</p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    Try adjusting your search or filter
                                  </p>
                                </div>
                              </td>
                            </tr>
                        )}
                      </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {data.total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                      <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-700">{(page - 1) * limit + 1}</span> to{' '}
                        <span className="font-medium text-gray-700">{Math.min(page * limit, data.total)}</span> of{' '}
                        <span className="font-medium text-gray-900">{data.total}</span> contacts
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.min(5, data.totalPages || 1) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                                        page === pageNum
                                            ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                  {pageNum}
                                </button>
                            );
                          })}
                          {(data.totalPages || 1) > 5 && (
                              <>
                                <span className="text-gray-300">...</span>
                                <button
                                    onClick={() => setPage(data.totalPages || 1)}
                                    className="w-10 h-10 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                                >
                                  {data.totalPages}
                                </button>
                              </>
                          )}
                        </div>
                        <button
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={page >= data.totalPages}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                )}
              </>
          )}
        </div>

        {/* Modal */}
        <ContactDetailsModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedContact(null);
            }}
            contact={selectedContact}
        />
      </div>
  );
};

export default Contacts;