## Feature Planner (Perancangan Modul/Fitur Baru)

**Gunakan prompt ini pada tahap PLANNING MODE untuk merancang arsitektur sebelum AI menulis satu baris kode pun.**

> **Prompt:**
> "Saya ingin menambahkan integrasi dari service request ke finance ke dalam proyek Mipsys.
>
> Sebagai Senior Architect, buatkan _Feature Integration Blueprint_ dengan cakupan berikut:
>
> 1. **Ringkasan Fitur & Batasan:** Definisikan tujuan utama fitur ini dan sebutkan batasan tegasnya (apa yang TIDAK termasuk) agar terhindar dari _Scope Creep_.
> 2. **Integrasi Data Model:** Buatkan diagram relasi entitas menggunakan sintaks **Mermaid.js** yang memetakan bagaimana fitur baru ini menempel pada fondasi yang sudah ada (seperti `service_requests` atau `stock_movements`).
> 3. **Defect & Risk Analysis:** Lakukan analisis rekayasa terhadap potensi _race condition_, anomali kalkulasi finansial, atau _illegal state bypass_ pada alur fitur ini.
> 4. **Fase Implementasi (Build Phases):** Pecah pengerjaan menjadi langkah-langkah _Agile_ (Skema DB ➔ API ➔ UI ➔ Integrasi E2E).
>
> Peringatan: Pastikan seluruh rencana ini tunduk pada arsitektur yang tertulis di `AGENTS.md`."
