import { GoogleGenAI } from "@google/genai";
import { TardinessRecord, GeneratedOutput } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

function formatHistory(records: TardinessRecord[]): string {
  if (records.length === 0) {
    return "Belum ada siswa yang terlambat hari ini selain siswa saat ini.";
  }
  return records.map(r => `- ${r.name} (${r.className}): Terlambat ${r.durationMinutes} menit (${r.category})`).join('\n');
}

export async function generateTardinessReport(
  currentRecord: TardinessRecord,
  history: TardinessRecord[]
): Promise<GeneratedOutput> {
  const prompt = `
    Kamu adalah LazGo, asisten sekolah yang efisien dan profesional untuk mencatat keterlambatan siswa.

    Tugasmu adalah memproses data keterlambatan siswa dan menghasilkan output dalam format yang ditentukan. Selalu gunakan Bahasa Indonesia yang baik dan formal.

    Data Siswa Saat Ini:
    - Nama: ${currentRecord.name}
    - Kelas: ${currentRecord.className}
    - Jam Masuk Seharusnya: ${currentRecord.schoolStartTime}
    - Jam Kedatangan: ${currentRecord.arrivalTime}
    - Durasi Keterlambatan: ${currentRecord.durationMinutes} menit
    - Kategori Keterlambatan: ${currentRecord.category}
    - Alasan: ${currentRecord.reason || 'Tidak ada'}

    Riwayat Keterlambatan Hari Ini (Siswa yang sudah tercatat sebelumnya):
    ${formatHistory(history)}

    ---

    Instruksi:
    Berdasarkan data di atas, hasilkan output dengan format TEPAT seperti di bawah ini. JANGAN tambahkan teks pembuka atau penutup lainnya. Gunakan emoji dan formatting tebal (**...**) yang sudah ditentukan.

    1️⃣ **Ringkasan Keterlambatan**
    [Buat ringkasan singkat dan jelas tentang keterlambatan siswa SAAT INI. Sebutkan nama, kelas, durasi, dan kategori.]

    2️⃣ **Pesan WhatsApp untuk Orang Tua**
    [Buat pesan WhatsApp yang formal, sopan, dan informatif untuk orang tua siswa SAAT INI. Gunakan tanggal hari ini (asumsikan hari ini adalah tanggal saat pesan dibuat). Gunakan format tebal (*...*) dan miring (_..._) jika perlu untuk penekanan. Sapa dengan "Yth. Bapak/Ibu Orang Tua/Wali dari ananda [Nama Siswa]".]

    3️⃣ **Rekap Harian**
    [Buat ringkasan dari SEMUA siswa yang terlambat hari ini (termasuk siswa saat ini dari data di atas dan riwayat). Jika hanya ada satu siswa, sebutkan "Total Keterlambatan Hari Ini: 1 siswa.". Jika ada lebih dari satu, berikan daftar ringkas dan totalnya.]
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    const text = response.text;
    
    // Robust parsing of the response
    const summaryMatch = text.match(/1️⃣\s\*\*Ringkasan Keterlambatan\*\*\s*([\s\S]*?)(?=\s*2️⃣|$)/);
    const whatsappMatch = text.match(/2️⃣\s\*\*Pesan WhatsApp untuk Orang Tua\*\*\s*([\s\S]*?)(?=\s*3️⃣|$)/);
    const dailyRecapMatch = text.match(/3️⃣\s\*\*Rekap Harian\*\*\s*([\s\S]*)/);
    
    const summary = summaryMatch ? summaryMatch[1].trim() : "Gagal memuat ringkasan.";
    const whatsapp = whatsappMatch ? whatsappMatch[1].trim() : "Gagal memuat pesan WhatsApp.";
    const dailyRecap = dailyRecapMatch ? dailyRecapMatch[1].trim() : "Gagal memuat rekap harian.";

    return { summary, whatsapp, dailyRecap };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Tidak dapat terhubung ke AI. Mohon coba lagi.");
  }
}


export async function generateMonthlyReport(records: TardinessRecord[]): Promise<string> {
    const formattedData = records.map(r => 
        `- Tanggal: ${new Date(r.id).toLocaleDateString('id-ID')}, Nama: ${r.name}, Kelas: ${r.className}, Terlambat: ${r.durationMinutes} menit, Kategori: ${r.category}, Alasan: ${r.reason || '-'}`
    ).join('\n');

    const prompt = `
        Kamu adalah LazGo, seorang analis data sekolah yang bertugas membuat laporan bulanan tentang keterlambatan siswa.

        Berikut adalah data mentah keterlambatan siswa untuk bulan ini:
        ${formattedData}

        ---

        Instruksi:
        Berdasarkan data di atas, buatlah laporan analisis yang komprehensif dalam Bahasa Indonesia. Laporan harus mencakup poin-poin berikut, dengan format yang jelas menggunakan markdown (gunakan **...** untuk tebal).

        **Laporan Analisis Keterlambatan Bulanan**

        **1. Ringkasan Umum**
        - Total Keterlambatan: [Jumlah total keterlambatan dalam sebulan]
        - Rata-rata Durasi Keterlambatan: [Hitung rata-rata durasi keterlambatan dalam menit]
        - Rincian Kategori:
            - Ringan: [Jumlah]
            - Sedang: [Jumlah]
            - Berat: [Jumlah]

        **2. Tren dan Pola Utama**
        - [Identifikasi tren yang paling menonjol. Contoh: "Keterlambatan paling sering terjadi pada hari Senin pagi" atau "Terjadi peningkatan jumlah keterlambatan di minggu ketiga bulan ini".]
        - [Sebutkan pola lain yang menarik jika ada.]

        **3. Siswa dengan Keterlambatan Terbanyak**
        - [Sebutkan 3-5 siswa yang paling sering terlambat, beserta jumlah keterlambatannya. Contoh: "1. Nama Siswa (Kelas) - 5 kali terlambat".]

        **4. Rekomendasi**
        - [Berikan 1-2 rekomendasi singkat yang dapat ditindaklanjuti oleh pihak sekolah berdasarkan analisis. Contoh: "Disarankan untuk memberikan perhatian khusus kepada siswa-siswa yang disebutkan di atas" atau "Mungkin perlu dilakukan evaluasi penyebab keterlambatan yang meningkat di minggu ketiga.".]

        Gunakan bahasa yang profesional dan mudah dipahami.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for monthly report:", error);
        throw new Error("Tidak dapat menghasilkan laporan bulanan dari AI. Mohon coba lagi.");
    }
}