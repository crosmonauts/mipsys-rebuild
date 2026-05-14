'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { srApi } from '../services/sr-api';
import { toast } from 'react-hot-toast';

const ServiceRequestDetail = () => {
  const params = useParams();
  const ticketNumber = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    modelName: '',
    problemDescription: '',
    statusService: '',
  });

  // 1. Ambil Data Saat Pertama Dimuat
  useEffect(() => {
    if (!ticketNumber) return;
    const getDetail = async () => {
      try {
        setIsLoading(true);
        const data = await srApi.getDetail(ticketNumber);
        setFormData(data);
        setIsLoading(false);
      } catch (error) {
        toast.error('Gagal mengambil data detail');
        setIsLoading(false);
      }
    };
    getDetail();
  }, [ticketNumber]);

  // 2. Logika Simpan Data (Update)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await srApi.updateEntry(ticketNumber, formData);
      toast.success('Data Pelanggan Berhasil Diperbarui!');
      setIsEditing(false); // Balik ke mode detail
    } catch (error) {
      toast.error('Gagal memperbarui data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Memuat Data...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Detail Tiket: {ticketNumber}
        </h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg text-white ${isEditing ? 'bg-gray-500' : 'bg-blue-600'}`}
        >
          {isEditing ? 'Batal' : 'Edit Customer'}
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Field: Nama Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Pelanggan
            </label>
            {isEditing ? (
              <input
                className="mt-1 block w-full border rounded-md p-2"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
              />
            ) : (
              <p className="mt-2 text-lg text-gray-900 font-semibold">
                {formData.customerName}
              </p>
            )}
          </div>

          {/* Field: Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nomor Telepon
            </label>
            {isEditing ? (
              <input
                className="mt-1 block w-full border rounded-md p-2"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            ) : (
              <p className="mt-2 text-lg text-gray-900">{formData.phone}</p>
            )}
          </div>
        </div>

        {/* Tombol Simpan (Hanya muncul saat mode edit) */}
        {isEditing && (
          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ServiceRequestDetail;
