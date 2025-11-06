

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import * as jspdf from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { StudentData, TardinessRecord, GeneratedOutput, TardinessCategory } from './types';
import { generateTardinessReport, generateMonthlyReport } from './services/geminiService';
import { LogoIcon, SummaryIcon, WhatsAppIcon, RecapIcon, CopyIcon, CheckIcon, ExportIcon, PdfIcon, ExcelIcon, MoonIcon, SunIcon, InsightIcon, TagIcon, ClassIcon, PieChartIcon, NotificationIcon } from './components/icons';
import { students, classNames, StudentInfo } from './data/students';

const SCHOOL_START_TIME = '07:30';

// Helper component for the form
const InputForm: React.FC<{
  onSubmit: (data: StudentData) => void;
}> = ({ onSubmit }) => {
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [arrivalTime, setArrivalTime] = useState(getCurrentTime);
  const [selectedReason, setSelectedReason] = useState('Macet');
  const [customReason, setCustomReason] = useState('');

  const [nameSuggestions, setNameSuggestions] = useState<StudentInfo[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  
  const [classSuggestions, setClassSuggestions] = useState<string[]>([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value.length > 1) {
      const filtered = students
        .filter(s => s.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Limit suggestions to 5
      setNameSuggestions(filtered);
      setShowNameSuggestions(true);
    } else {
      setShowNameSuggestions(false);
    }
  };

  const handleNameSuggestionClick = (student: StudentInfo) => {
    setName(student.name);
    setClassName(student.className);
    setShowNameSuggestions(false);
  };

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClassName(value);
    if (value.length > 0) {
        const filtered = classNames
            .filter(c => c.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5);
        setClassSuggestions(filtered);
        setShowClassSuggestions(true);
    } else {
        setShowClassSuggestions(false);
    }
  };

  const handleClassSuggestionClick = (name: string) => {
      setClassName(name);
      setShowClassSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className || !arrivalTime) {
      alert('Nama, Kelas, dan Jam Kedatangan wajib diisi.');
      return;
    }
    const reason = selectedReason === 'Lainnya...' ? customReason : selectedReason;
    onSubmit({ name, className, arrivalTime, reason });
    setName('');
    setClassName('');
    setArrivalTime(getCurrentTime());
    setSelectedReason('Macet');
    setCustomReason('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Siswa</label>
        <input 
          type="text" 
          id="name" 
          value={name} 
          onChange={handleNameChange} 
          onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
          onFocus={handleNameChange}
          required 
          autoComplete="off"
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        {showNameSuggestions && nameSuggestions.length > 0 && (
          <ul className="absolute z-20 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
            {nameSuggestions.map((s, index) => (
              <li key={index} onMouseDown={() => handleNameSuggestionClick(s)} className="px-3 py-2 hover:bg-sky-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                {s.name} <span className="text-xs text-gray-500 dark:text-gray-400">({s.className})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative">
        <label htmlFor="className" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kelas</label>
        <input 
            type="text" 
            id="className" 
            value={className} 
            onChange={handleClassNameChange} 
            onBlur={() => setTimeout(() => setShowClassSuggestions(false), 200)}
            onFocus={handleClassNameChange}
            required 
            autoComplete="off"
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        {showClassSuggestions && classSuggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
            {classSuggestions.map((c, index) => (
              <li key={index} onMouseDown={() => handleClassSuggestionClick(c)} className="px-3 py-2 hover:bg-sky-50 dark:hover:bg-gray-600 cursor-pointer text-sm">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam Masuk</label>
          <input type="time" value={SCHOOL_START_TIME} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm" />
        </div>
        <div>
          <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam Datang</label>
          <input type="time" id="arrivalTime" value={arrivalTime} min="07:30" max="08:30" onChange={e => setArrivalTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alasan Keterlambatan</label>
        <select
          id="reason"
          value={selectedReason}
          onChange={e => setSelectedReason(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option>Macet</option>
          <option>Telat Bangun</option>
          <option>Hujan</option>
          <option>Tidur Larut Malam</option>
          <option value="Lainnya...">Lainnya...</option>
        </select>
      </div>
      {selectedReason === 'Lainnya...' && (
        <div>
          <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Alasan Lainnya
          </label>
          <textarea
            id="customReason"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            rows={2}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="Tuliskan alasan spesifik..."
          />
        </div>
      )}
      <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
        Proses & Buat Laporan
      </button>
    </form>
  );
};


// Helper Component for Output
const OutputDisplay: React.FC<{ 
    output: GeneratedOutput | null; 
    isLoading: boolean;
    error: string | null;
}> = ({ output, isLoading, error }) => {
    const [copiedStates, setCopiedStates] = useState({
      whatsapp: false,
    });

    const handleCopy = (text: string, type: 'whatsapp') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedStates(prev => ({ ...prev, [type]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
        });
    };
    
    if (isLoading && !output) { // Show skeleton only if there's no previous output
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">{error}</div>;
    }

    if (!output) {
        return (
            <div className="text-center py-10 px-4">
                <LogoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Menunggu Data Keterlambatan</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Silakan isi formulir untuk membuat laporan.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 text-gray-800 dark:text-gray-200">
            <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-sky-600 dark:text-sky-400"><SummaryIcon className="w-5 h-5" /> Ringkasan Keterlambatan</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{output.summary}</p>
            </div>
             <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md relative">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-green-600 dark:text-green-400"><WhatsAppIcon className="w-5 h-5" /> Pesan WhatsApp untuk Orang Tua</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{output.whatsapp}</p>
                 <button onClick={() => handleCopy(output.whatsapp, 'whatsapp')} className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                     {copiedStates.whatsapp ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />}
                 </button>
            </div>
             <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><RecapIcon className="w-5 h-5" /> Rekap Harian</h3>
                <p className="mt-2 text-sm whitespace-pre-wrap">{output.dailyRecap}</p>
            </div>
        </div>
    );
};

// Helper Component for AI Insight
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | React.ReactNode; color: string; }> = ({ icon, title, value, color }) => (
    <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className={`mr-4 flex-shrink-0 p-2 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
            {typeof value === 'string' ? (
              <p className="font-semibold text-sm break-words">{value}</p>
            ) : (
              value
            )}
        </div>
    </div>
);

const AIInsight: React.FC<{ records: TardinessRecord[] }> = ({ records }) => {
    const stats = useMemo(() => {
        if (records.length === 0) {
            return null;
        }

        const reasonCounts = records.reduce((acc, rec) => {
            const reason = rec.reason || 'Tidak ada';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostCommonReason = Object.keys(reasonCounts).reduce((a, b) => reasonCounts[a] > reasonCounts[b] ? a : b, 'N/A');

        const classCounts = records.reduce((acc, rec) => {
// @fix: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
// @fix: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
            acc[rec.className] = (acc[rec.className] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
// @fix: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
// @fix: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
        const topClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b, 'N/A');

        const totalDuration = records.reduce((sum, rec) => sum + rec.durationMinutes, 0);
        const avgDuration = records.length > 0 ? Math.round(totalDuration / records.length) : 0;

        const categoryCounts = records.reduce((acc, rec) => {
            acc[rec.category]++;
            return acc;
        }, { [TardinessCategory.Ringan]: 0, [TardinessCategory.Sedang]: 0, [TardinessCategory.Berat]: 0 });

        return { mostCommonReason, topClass, avgDuration, categoryCounts };
    }, [records]);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700 flex items-center gap-2">
                <InsightIcon className="w-6 h-6"/> Analisis Pola Harian
            </h2>
            {!stats ? (
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">Belum ada data untuk dianalisis hari ini.</p>
            ) : (
                <div className="space-y-3">
                    <StatCard
                        icon={<TagIcon className="w-5 h-5 text-purple-800 dark:text-purple-200" />}
                        title="Alasan Paling Umum"
                        value={stats.mostCommonReason}
                        color="bg-purple-100 dark:bg-purple-900/50"
                    />
                    <StatCard
                        icon={<ClassIcon className="w-5 h-5 text-blue-800 dark:text-blue-200" />}
                        title="Kelas Teratas"
                        value={stats.topClass}
                        color="bg-blue-100 dark:bg-blue-900/50"
                    />
                    <StatCard
                        icon={<LogoIcon className="w-5 h-5 text-teal-800 dark:text-teal-200" />}
                        title="Rata-rata Terlambat"
                        value={`${stats.avgDuration} menit`}
                        color="bg-teal-100 dark:bg-teal-900/50"
                    />
                    <StatCard
                        icon={<PieChartIcon className="w-5 h-5 text-orange-800 dark:text-orange-200" />}
                        title="Distribusi Kategori"
                        value={
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                            <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full">Ringan: {stats.categoryCounts.Ringan}</span>
                            <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full">Sedang: {stats.categoryCounts.Sedang}</span>
                            <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-full">Berat: {stats.categoryCounts.Berat}</span>
                        </div>
                        }
                        color="bg-orange-100 dark:bg-orange-900/50"
                    />
                </div>
            )}
        </div>
    );
};

const MonthlyReport: React.FC<{ allRecords: TardinessRecord[] }> = ({ allRecords }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<{
        report: string;
        parentMessage: string | null;
        topOffender: { name: string; className: string; count: number } | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [copiedStates, setCopiedStates] = useState({ parentMessage: false });

    const handleCopy = (text: string, type: 'parentMessage') => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedStates(prev => ({ ...prev, [type]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
        });
    };

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const availablePeriods = useMemo(() => {
        const periods = new Map<number, Set<number>>();
        allRecords.forEach(rec => {
            const date = new Date(rec.id);
            const year = date.getFullYear();
            const month = date.getMonth();
            if (!periods.has(year)) {
                periods.set(year, new Set());
            }
            periods.get(year)!.add(month);
        });
        return periods;
    }, [allRecords]);

    const availableYears = useMemo(() => Array.from(availablePeriods.keys()).sort((a, b) => Number(b) - Number(a)), [availablePeriods]);
    const availableMonths = useMemo(() => {
        return availablePeriods.has(selectedYear) ? Array.from(availablePeriods.get(selectedYear)!).sort((a, b) => Number(a) - Number(b)) : [];
    }, [selectedYear, availablePeriods]);

    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    useEffect(() => {
        if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
             setSelectedMonth(availableMonths[availableMonths.length - 1]);
        } else if (availableMonths.length === 0 && allRecords.length > 0) {
            // Find the latest month with data if the current selection becomes invalid
             if (availableYears.length > 0) {
                 const latestYear = availableYears[0];
                 const latestMonths = Array.from(availablePeriods.get(latestYear)!).sort((a, b) => Number(b) - Number(a));
                 setSelectedYear(latestYear);
                 if (latestMonths.length > 0) {
                    setSelectedMonth(latestMonths[0]);
                 }
             }
        }
    }, [availableMonths, selectedMonth, availableYears, allRecords, availablePeriods]);
    

    const reportFileName = `laporan_keterlambatan_${monthNames[selectedMonth]}_${selectedYear}`;

    const filteredRecords = useMemo(() => {
        return allRecords.filter(rec => {
            const recDate = new Date(rec.id);
            return recDate.getMonth() === selectedMonth && recDate.getFullYear() === selectedYear;
        });
    }, [allRecords, selectedMonth, selectedYear]);

    useEffect(() => {
        setReportData(null);
        setError(null);
    }, [selectedMonth, selectedYear]);

    const handleGenerateReport = async () => {
        if (filteredRecords.length === 0) {
            alert('Tidak ada data untuk bulan yang dipilih.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setReportData(null);
        try {
            const result = await generateMonthlyReport(filteredRecords);
            setReportData(result);
        } catch (e: any) {
            setError(e.message || 'Gagal membuat laporan bulanan.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (filteredRecords.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }
        const headers = ['ID', 'Tanggal', 'Nama', 'Kelas', 'Jam Datang', 'Durasi Terlambat (mnt)', 'Kategori', 'Alasan'];
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map(r => [
                `"${r.id}"`,
                `"${new Date(r.id).toLocaleDateString('id-ID')}"`,
                `"${r.name}"`,
                `"${r.className}"`,
                `"${r.arrivalTime}"`,
                r.durationMinutes,
                r.category,
                `"${r.reason || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${reportFileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportXLSX = () => {
        if (filteredRecords.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }
        const dataToExport = filteredRecords.map(r => ({
            'Tanggal': new Date(r.id).toLocaleDateString('id-ID'),
            'Nama Siswa': r.name,
            'Kelas': r.className,
            'Jam Datang': r.arrivalTime,
            'Durasi Terlambat (menit)': r.durationMinutes,
            'Kategori': r.category,
            'Alasan': r.reason || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Keterlambatan');
        XLSX.writeFile(workbook, `${reportFileName}.xlsx`);
    };

    const handleExportPDF = () => {
        if (filteredRecords.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }
        
        const doc = new jspdf.jsPDF();
        const plainReport = reportData?.report ? reportData.report.replace(/\*\*/g, '') : 'Belum ada rekap AI yang dibuat.';

        doc.setFontSize(18);
        doc.text(`Laporan Keterlambatan Bulanan`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Periode: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 30);
        
        if(reportData?.report) {
            doc.setFontSize(12);
            doc.text('Ringkasan Analisis AI', 14, 45);
            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(plainReport, 180);
            doc.text(splitText, 14, 52);
        }

        const tableColumn = ["Tanggal", "Nama Siswa", "Kelas", "Durasi (mnt)", "Kategori", "Alasan"];
        const tableRows = filteredRecords.map(r => [
            new Date(r.id).toLocaleDateString('id-ID'),
            r.name,
            r.className,
            r.durationMinutes,
            r.category,
            r.reason || ''
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: reportData?.report ? 80 : 45,
        });

        doc.save(`${reportFileName}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700">Filter Laporan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bulan</label>
                        <select id="month" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                            {availableMonths.map((m) => <option key={m} value={m}>{monthNames[m]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tahun</label>
                        <select id="year" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleGenerateReport} disabled={isLoading || filteredRecords.length === 0} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-400 disabled:cursor-not-allowed transition-colors">
                            {isLoading ? 'Membuat Laporan...' : 'Rekap Laporan Bulanan'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-800/30 dark:bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg min-h-[300px]">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4 border-b pb-3 border-white/30">
                    <h2 className="text-xl font-semibold text-white">Hasil Laporan Bulanan</h2>
                    <div className="flex items-center gap-2">
                         <button onClick={handleExportPDF} title="Unduh PDF" disabled={filteredRecords.length === 0} className="flex items-center gap-2 py-1 px-3 text-sm font-medium rounded-md bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <PdfIcon className="w-4 h-4" /> <span>PDF</span>
                        </button>
                         <button onClick={handleExportXLSX} title="Unduh Excel" disabled={filteredRecords.length === 0} className="flex items-center gap-2 py-1 px-3 text-sm font-medium rounded-md bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ExcelIcon className="w-4 h-4" /> <span>Excel</span>
                        </button>
                        <button onClick={handleExportCSV} title="Unduh CSV" disabled={filteredRecords.length === 0} className="flex items-center gap-2 py-1 px-3 text-sm font-medium rounded-md bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ExportIcon className="w-4 h-4" /> <span>CSV</span>
                        </button>
                    </div>
                </div>
                {isLoading && <div className="text-white text-center py-10">Menganalisis data bulanan dengan AI...</div>}
                {error && <div className="p-4 rounded-lg bg-red-900/50 text-red-300">{error}</div>}
                {reportData?.report && <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: reportData.report.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />}
                
                {reportData && reportData.parentMessage && reportData.topOffender && (
                    <div className="mt-6 p-4 bg-black/20 backdrop-blur-sm rounded-lg shadow-md relative border border-white/20">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-yellow-300">
                            <NotificationIcon className="w-5 h-5" /> 
                            Pemberitahuan Orang Tua
                        </h3>
                        <p className="mt-2 text-xs text-white/80">
                        Saran pesan untuk orang tua dari ananda <strong>{reportData.topOffender.name}</strong> ({reportData.topOffender.className}) yang terlambat sebanyak <strong>{reportData.topOffender.count}</strong> kali bulan ini.
                        </p>
                        <p className="mt-3 text-sm whitespace-pre-wrap text-white bg-black/20 p-3 rounded-md">{reportData.parentMessage}</p>
                        <button onClick={() => handleCopy(reportData.parentMessage ?? '', 'parentMessage')} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            {copiedStates.parentMessage ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-200" />}
                        </button>
                    </div>
                )}

                {!isLoading && !reportData && !error && (
                    <div className="text-center py-10 text-gray-400">
                        <p>Pilih bulan dan tahun, lalu klik "Rekap Laporan Bulanan" untuk melihat analisis AI.</p>
                        <p className="text-xs mt-2">({filteredRecords.length} catatan ditemukan untuk periode ini)</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function App() {
  const [records, setRecords] = useState<TardinessRecord[]>(() => {
      try {
          const savedRecords = localStorage.getItem('tardinessRecords');
          return savedRecords ? JSON.parse(savedRecords) : [];
      } catch (error) {
          console.error("Could not parse records from localStorage", error);
          return [];
      }
  });
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<GeneratedOutput | null>(() => {
      try {
        const savedOutput = localStorage.getItem('dailyReportOutput');
        if (savedOutput) {
            const { date, data } = JSON.parse(savedOutput);
            const today = new Date().toDateString();
            if (date === today) {
                return data;
            }
        }
      } catch (error) {
          console.error("Could not parse daily report from localStorage", error);
      }
      return null;
  });
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as 'light' | 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
      localStorage.setItem('tardinessRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (output) {
        const today = new Date().toDateString();
        const dataToSave = { date: today, data: output };
        localStorage.setItem('dailyReportOutput', JSON.stringify(dataToSave));
    }
  }, [output]);

  const dailyRecords = useMemo(() => {
    const today = new Date().toDateString();
    return records.filter(rec => new Date(rec.id).toDateString() === today);
  }, [records]);

  const handleFormSubmit = useCallback(async (data: StudentData) => {
    // --- 1. Process and save data instantly ---
    const arrival = new Date(`1970-01-01T${data.arrivalTime}:00`);
    const start = new Date(`1970-01-01T${SCHOOL_START_TIME}:00`);
    
    let durationMinutes = Math.round((arrival.getTime() - start.getTime()) / 60000);
    if (durationMinutes < 0) durationMinutes = 0;

    let category: TardinessCategory;
    if (durationMinutes >= 1 && durationMinutes <= 5) {
      category = TardinessCategory.Ringan;
    } else if (durationMinutes >= 6 && durationMinutes <= 15) {
      category = TardinessCategory.Sedang;
    } else {
      category = TardinessCategory.Berat;
    }

    const newRecord: TardinessRecord = {
      ...data,
      id: new Date().toISOString(),
      schoolStartTime: SCHOOL_START_TIME,
      durationMinutes,
      category,
    };
    
    // Get history for AI *before* adding the new record
    const historyForAI = dailyRecords;
    
    // Update state immediately to make UI responsive
    setRecords(prev => [...prev, newRecord]);

    // --- 2. Generate AI report in the background ---
    setIsReportLoading(true);
    setError(null);

    try {
      const generatedOutput = await generateTardinessReport(newRecord, historyForAI);
      setOutput(generatedOutput);
    } catch (e: any) {
      setError(e.message || 'Gagal membuat laporan AI. Data siswa tetap tersimpan.');
    } finally {
      setIsReportLoading(false);
    }
  }, [dailyRecords]);

  const dailyReportFileName = `laporan_keterlambatan_harian_${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}`;

  const handleDailyExportCSV = () => {
      if (dailyRecords.length === 0) {
          alert('Tidak ada data untuk diekspor.');
          return;
      }
      const headers = ['ID', 'Tanggal', 'Nama', 'Kelas', 'Jam Datang', 'Durasi Terlambat (mnt)', 'Kategori', 'Alasan'];
      const csvContent = [
          headers.join(','),
          ...dailyRecords.map(r => [
              `"${r.id}"`,
              `"${new Date(r.id).toLocaleDateString('id-ID')}"`,
              `"${r.name}"`,
              `"${r.className}"`,
              `"${r.arrivalTime}"`,
              r.durationMinutes,
              r.category,
              `"${r.reason || ''}"`
          ].join(','))
      ].join('\n');

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${dailyReportFileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDailyExportXLSX = () => {
      if (dailyRecords.length === 0) {
          alert('Tidak ada data untuk diekspor.');
          return;
      }
      const dataToExport = dailyRecords.map(r => ({
          'Tanggal': new Date(r.id).toLocaleDateString('id-ID'),
          'Nama Siswa': r.name,
          'Kelas': r.className,
          'Jam Datang': r.arrivalTime,
          'Durasi Terlambat (menit)': r.durationMinutes,
          'Kategori': r.category,
          'Alasan': r.reason || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Keterlambatan Harian');
      XLSX.writeFile(workbook, `${dailyReportFileName}.xlsx`);
  };

  const handleDailyExportPDF = () => {
      if (dailyRecords.length === 0) {
          alert('Tidak ada data untuk diekspor.');
          return;
      }
      if (!output) {
          alert('Laporan AI belum dibuat. Mohon proses data terlebih dahulu.');
          return;
      }
      
      const doc = new jspdf.jsPDF();
      const plainRecap = output.dailyRecap.replace(/\*\*/g, '');

      doc.setFontSize(18);
      doc.text(`Laporan Keterlambatan Harian`, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 30);
      
      doc.setFontSize(12);
      doc.text('Rekap Harian (AI)', 14, 45);
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(plainRecap, 180);
      doc.text(splitText, 14, 52);

      const tableColumn = ["Nama Siswa", "Kelas", "Jam Datang", "Durasi (mnt)", "Kategori"];
      const tableRows = dailyRecords.map(r => [
          r.name,
          r.className,
          r.arrivalTime,
          r.durationMinutes,
          r.category
      ]);

      (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 75,
      });

      doc.save(`${dailyReportFileName}.pdf`);
  };

  const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-white text-sky-700 shadow dark:bg-gray-100 dark:text-sky-700'
          : 'text-white hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto relative">
         <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 p-2 rounded-full text-white/80 hover:bg-white/20 transition-colors"
            aria-label="Toggle dark mode"
        >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>

        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3">
            <LogoIcon className="w-10 h-10 text-white" />
            <h1 className="text-4xl font-bold tracking-tight text-white">LazGo</h1>
          </div>
          <p className="mt-2 text-lg text-sky-200 dark:text-sky-300">Where Time Meets Responsibility</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 p-1 bg-blue-800/30 dark:bg-white/5 rounded-lg">
            <TabButton label="Input Harian" isActive={activeTab === 'daily'} onClick={() => setActiveTab('daily')} />
            <TabButton label="Laporan Bulanan" isActive={activeTab === 'monthly'} onClick={() => setActiveTab('monthly')} />
          </div>
        </div>

        <main>
          {activeTab === 'daily' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700">Input Data Keterlambatan</h2>
                    <InputForm onSubmit={handleFormSubmit} />
                  </div>

                  <AIInsight records={dailyRecords} />

                  {dailyRecords.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                      <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700">Riwayat Hari Ini</h2>
                      <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {dailyRecords.map(rec => (
                          <li key={rec.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center">
                            <div>
                              <span className="font-medium">{rec.name}</span>
                              <span className="text-gray-500 dark:text-gray-400"> ({rec.className})</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Datang: {rec.arrivalTime}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              rec.category === 'Ringan' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                              rec.category === 'Sedang' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                              {rec.durationMinutes} mnt
                            </span>
                          </li>
                        )).reverse()}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-800/30 dark:bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg">
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/30 pb-3 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Laporan Harian</h2>
                        <p className="text-sm text-sky-200 dark:text-sky-300">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDailyExportPDF} title="Unduh PDF" disabled={dailyRecords.length === 0 || !output} className="flex items-center gap-2 py-1 px-3 text-sm font-medium rounded-md bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <PdfIcon className="w-4 h-4" /> <span>PDF</span>
                        </button>
                        <button onClick={handleDailyExportXLSX} title="Unduh Excel" disabled={dailyRecords.length === 0} className="flex items-center gap-2 py-1 px-3 text-sm font-medium rounded-md bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ExcelIcon className="w-4 h-4" /> <span>Excel</span>
                        </button>
                        <button onClick={handleDailyExportCSV} title="Unduh CSV" disabled={dailyRecords.length === 0} className="flex items-center gap-2 py-1 px-3 text-sm font-medium rounded-md bg-white/20 hover:bg-white/30 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ExportIcon className="w-4 h-4" /> <span>CSV</span>
                        </button>
                    </div>
                  </div>
                  <OutputDisplay output={output} isLoading={isReportLoading} error={error} />
                </div>
              </div>
          )}
          {activeTab === 'monthly' && (
              <MonthlyReport allRecords={records} />
          )}
        </main>
      </div>
    </div>
  );
}
