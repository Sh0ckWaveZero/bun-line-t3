import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface HolidayImportProps {
  onImport: (holidays: any[]) => void;
  onClose: () => void;
}

export function HolidayImport({ onImport, onClose }: HolidayImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      previewFile(selectedFile);
    }
  };

  const previewFile = async (file: File) => {
    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        throw new Error('รองรับเฉพาะไฟล์ .json และ .csv เท่านั้น');
      }

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
      }

      const validData = data.filter(item =>
        item.date && item.nameEnglish && item.nameThai && item.year
      );

      if (validData.length === 0) {
        throw new Error('ไม่พบข้อมูลวันหยุดที่ถูกต้องในไฟล์');
      }

      setPreview(validData.slice(0, 10)); // Show first 10 items
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถอ่านไฟล์ได้');
      setPreview([]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holidays: preview,
          import: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onImport(preview);
        onClose();
      } else {
        setError(result.message || 'ไม่สามารถนำเข้าข้อมูลได้');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดขณะนำเข้าข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">นำเข้าวันหยุด</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-6">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-muted-foreground">
                  รองรับไฟล์ .json และ .csv
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="text-sm">
              <p className="font-semibold">ไฟล์ที่เลือก:</p>
              <p className="text-muted-foreground">{file.name}</p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">ตัวอย่างข้อมูล (แสดง 10 รายการแรก)</h3>
              <div className="border rounded-lg overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">วันที่</th>
                      <th className="p-2 text-left">ชื่อ (ไทย)</th>
                      <th className="p-2 text-left">ชื่อ (อังกฤษ)</th>
                      <th className="p-2 text-left">ปี</th>
                      <th className="p-2 text-left">ประเภท</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{item.date}</td>
                        <td className="p-2">{item.nameThai}</td>
                        <td className="p-2">{item.nameEnglish}</td>
                        <td className="p-2">{item.year}</td>
                        <td className="p-2">{item.type || 'national'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || preview.length === 0 || loading}
            >
              {loading ? 'กำลังนำเข้า...' : 'นำเข้า'}
            </Button>
          </div>

          {/* Template Download */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">ไม่มีไฟล์? ดาวน์โหลด Template ได้ที่:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const template = [
                  {
                    date: "2026-01-01",
                    nameEnglish: "New Year's Day",
                    nameThai: "วันขึ้นปีใหม่",
                    year: 2026,
                    type: "national",
                    description: "First day of the year"
                  }
                ];
                const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'holidays-template.json';
                a.click();
              }}>
                ดาวน์โหลด JSON Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const template = `date,nameEnglish,nameThai,year,type,description
"2026-01-01","New Year's Day","วันขึ้นปีใหม่",2026,"national","First day of the year"`;
                const blob = new Blob([template], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'holidays-template.csv';
                a.click();
              }}>
                ดาวน์โหลด CSV Template
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
