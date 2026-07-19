# RootFacts - AI Plant & Vegetable Fun Facts App

> Submission Proyek Akhir - Belajar Penerapan AI di Aplikasi Web - Dicoding Academy  
> Jalur: React + Vite

---

## Deskripsi Proyek

RootFacts adalah aplikasi asisten berbasis web yang menggabungkan Computer Vision dan Generative AI untuk mengenali sayuran melalui kamera dan menyajikan fakta menarik secara otomatis.

Aplikasi ini memiliki dua fungsionalitas utama:

- **Computer Vision** - Menggunakan kamera untuk mengenali berbagai jenis sayuran secara real-time via TensorFlow.js.
- **Generative AI** - Setelah sayuran dikenali, menghasilkan fun fact unik dan kreatif menggunakan model Transformers.js (berjalan 100% lokal di browser pengguna).

---

## Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | ^19.2.0 | UI Framework |
| Vite | ^6.0.7 | Build Tool & Dev Server |
| TensorFlow.js | ^4.22.0 | Computer Vision (deteksi sayuran) |
| TF.js WebGPU Backend | ^4.22.0 | Akselerasi GPU (WebGPU/WebGL) |
| @huggingface/transformers | ^3.8.1 | Generative AI lokal (fun fact) |
| vite-plugin-pwa | ^1.0.0 | PWA + Service Worker (Workbox) |
| lucide-react | ^0.563.0 | Icon library |
| ESLint | ^9.19.0 | Linter kode |

---

## Fitur yang Diimplementasikan

### Kriteria 1 - Computer Vision (Deteksi Sayuran)
- [x] Streaming kamera aktif via MediaStream API
- [x] Model TensorFlow.js berhasil dimuat dengan indikator loading dan persentase
- [x] Menampilkan label nama sayuran secara otomatis
- [x] FPS Limit yang dikonfigurasi pada CameraService
- [x] Backend Adaptif: pengecekan `navigator.gpu` (WebGPU dengan fallback ke WebGL)
- [x] Manajemen Memori: menggunakan `tf.tidy()` dan `.dispose()` pada setiap siklus prediksi
- [x] Arsitektur menggunakan React (komponen terstruktur)

### Kriteria 2 - Generative AI (Fun Fact)
- [x] Prompt AI dinamis berdasarkan label deteksi sayuran
- [x] Menampilkan teks Fun Fact unik
- [x] Copy to Clipboard untuk menyalin hasil teks AI
- [x] Parameter model dikonfigurasi: `temperature`, `max_new_tokens`, `top_p`, `do_sample`
- [x] Fitur Persona Dinamis: dropdown gaya bahasa untuk mengatur tone fakta (Normal / Lucu / Profesional / Santai)
- [x] Backend Adaptif untuk Transformers.js (WebGPU ke WebGL fallback)

### Kriteria 3 - Offline Capability & Deployment
- [x] Deploy ke Netlify (URL tercantum di `STUDENT.txt`)
- [x] Web App Manifest lengkap terkonfigurasi di Vite
- [x] Service Worker via Workbox (Precaching HTML, CSS, JS)
- [x] Aplikasi dapat diinstal (mendukung PWA)
- [x] ESLint terkonfigurasi (`eslint-config-dicodingacademy`)
- [x] Offline AI Model: Precaching file `.json` dan `.bin` model agar dapat berjalan luring sepenuhnya

---

## Panduan Setup & Menjalankan Proyek

### Prasyarat

Pastikan environment lokal memenuhi:

```
Node.js  : v22.12.0
npm      : v11.6.2
OS       : Windows
```

---

### Langkah 1 - Instalasi Dependensi

Di terminal proyek, jalankan:

```bash
npm install
```

Tunggu hingga semua package terinstall dan folder `node_modules` muncul.

> Catatan: Jangan commit folder `node_modules` ke repository atau menyertakannya dalam ZIP submission.

---

### Langkah 2 - Jalankan Development Server

```bash
npm run dev
```

Output yang diharapkan:

```
  VITE v6.x.x  ready in XXX ms

  ->  Local:   http://localhost:3001/
```

Buka browser dan akses URL lokal tersebut. Gunakan browser seperti Chrome atau Edge untuk kompabilitas WebRTC dan WebGPU terbaik.

---

### Langkah 3 - Struktur Kode

Kode logika inti dipisahkan dalam folder `src/services/` menggunakan class service:

#### 1. CameraService (`src/services/CameraService.js`)
Menangani enumerasi kamera, memulai stream MediaDevices, manajemen frame delay/FPS, dan menghentikan siaran kamera. Menambahkan penanganan fallback untuk mencegah crash pada environment non-HTTPS.

#### 2. DetectionService (`src/services/DetectionService.js`)
Memuat model TensorFlow.js dan metadatanya. Mengaplikasikan Backend Adaptive dan menjalankan prediksi (menggunakan `tf.tidy()` untuk efisiensi memori) dengan menerima input dari video element kamera.

#### 3. RootFactsService (`src/services/RootFactsService.js`)
Memuat pipeline Transformers.js (`Xenova/LaMini-Flan-T5-77M`). Mengelola *persona mapping* (mengubah parameter dan prompt teks sesuai *tone* pilihan), lalu menghasilkan teks yang relevan dengan hasil deteksi.

---

### Langkah 4 - Build untuk Production

```bash
npm run build
```

Folder `dist/` akan dibuat. Folder ini berisi aset statis dan konfigurasi PWA yang siap di-deploy ke hosting seperti Netlify.

---

## File Penting

| File | Keterangan |
|------|-----------|
| `src/App.jsx` | Root komponen yang menghubungkan semua layanan dan UI |
| `src/services/CameraService.js` | Logika akses kamera dan FPS |
| `src/services/DetectionService.js` | Logika TensorFlow.js dan prediksi |
| `src/services/RootFactsService.js` | Logika Transformers.js dan prompt |
| `public/model/` | Folder model TF.js (metadata, weights) |
| `vite.config.js` | Konfigurasi build dan Workbox/PWA caching |
| `eslint.config.js` | Konfigurasi Linter |
| `STUDENT.txt` | File wajib yang harus berisi URL hasil deployment |

---

## Target Penilaian

| Kriteria | Target |
|----------|--------|
| Deteksi Sayuran (Computer Vision) | Advanced |
| Generative AI (Fun Fact) | Advanced |
| Offline Capability & Deployment | Advanced |

---

## Referensi

- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

*Dibuat untuk keperluan submission Dicoding Academy - Belajar Penerapan AI di Aplikasi Web*

