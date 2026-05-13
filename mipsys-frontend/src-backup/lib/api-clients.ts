import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// ============================================================================
// INSTANSI HTTP TERPUSAT (Menjaga LoC rendah & konfigurasi 1 pintu)
// Menggunakan port 3001 sebagai standar default backend NestJS Anda
// ============================================================================

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  timeout: 15000, // Anti-Defect: Mencegah antarmuka gantung/membeku tanpa kepastian
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// REQUEST INTERCEPTOR (Pos Satpam Keberangkatan)
// ============================================================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Jalur pipa otentikasi masa depan (Aman & terisolasi dari komponen UI)
    /*
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    */
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ============================================================================
// RESPONSE INTERCEPTOR (Pos Satpam Kedatangan - Penekan McCabe & WCAG AAA)
// ============================================================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Loloskan respons secara langsung jika status jaringan sukses (2xx)
    return response;
  },
  (error: AxiosError) => {
    // Standarisasi ekstraksi pesan error menjadi teks semantik yang ramah pembaca layar
    let accessibleErrorMessage =
      "Terjadi kendala komunikasi dengan server pusat.";

    if (error.response) {
      // Backend NestJS merespons dengan kode gagal (misal: 400, 404, 500)
      const serverData: any = error.response.data;

      if (serverData && typeof serverData.message === "string") {
        accessibleErrorMessage = serverData.message;
      } else if (serverData && Array.isArray(serverData.message)) {
        accessibleErrorMessage = serverData.message.join(", "); // Gabungkan jika error validasi Drizzle
      } else if (error.response.status === 404) {
        accessibleErrorMessage =
          "Alamat sistem atau suku cadang yang diminta tidak ditemukan (Koneksi 404).";
      } else if (error.response.status === 500) {
        accessibleErrorMessage =
          "Server backend mengalami gangguan internal. Mohon hubungi administrator (Koneksi 500).";
      }
    } else if (error.request) {
      // Request berhasil dikirim, tapi tidak ada jawaban dari server (NestJS mati / offline)
      accessibleErrorMessage =
        "Server backend tidak merespons. Pastikan layanan NestJS di port 3001 sudah aktif.";
    }

    // PENTING: Meredam mikrofon satpam menggunakan console.warn.
    // Ini tetap mencatat error di log peramban teknisi untuk debugging,
    // namun TIDAK AKAN memicu tirai overlay merah (Error Overlay) dari Next.js,
    // sehingga tabel UI yang memuat fallback data AAA tetap dapat diakses dan dibaca.
    console.warn("[Peringatan Jaringan AAA]:", accessibleErrorMessage);

    // Kembalikan error teks bersih ke lapisan Custom Hook
    return Promise.reject(new Error(accessibleErrorMessage));
  },
);
