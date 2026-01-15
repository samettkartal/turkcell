# TrustShield - Proje Sunum Scripti

## 1. Giriş ve Proje Özeti (1-2 Dakika)
**Konuşmacı:**
"Merhaba, bugün sizlere Turkcell hackathonu için geliştirdiğimiz **TrustShield** projesini tanıtacağım.
Dijital servislerin (Paycell, BiP, TV+, Superonline) kullanımının artmasıyla birlikte, dolandırıcılık (fraud) girişimleri ve güvenlik riskleri de katlanarak artıyor.
Mevcut statik kural setleri, hızla değişen saldırı yöntemlerine karşı yavaş kalabiliyor.

**TrustShield**, gerçek zamanlı veri akışını analiz eden, dinamik kural motoruna sahip ve aksiyon odaklı bir **Merkezi Güvenlik ve Fraud Yönetim Paneli**dir.
Amacımız: Farklı servislerden gelen sinyalleri tek bir merkezde toplamak, anormallikleri tespit etmek ve saniyeler içinde aksiyon almaktır."

---

## 2. Sistem Mimarisi ve Teknolojiler (1 Dakika)
**Konuşmacı:**
"Projemizin teknik altyapısından kısaca bahsetmek istiyorum:
*   **Backend:** Yüksek performans için **Python FastAPI** kullandık. Veri işleme ve kural motoru burada çalışıyor.
*   **Frontend:** Modern ve reaktif bir arayüz için **React (Vite)** ve **TailwindCSS** tercih ettik.
*   **Veritabanı:** Verilerin hızlı saklanması ve sorgulanması için **SQLite** (Prototip aşamasında) kullandık. Gerçek ortamda PostgreSQL'e kolayca evrilebilir.
*   **Simülasyon:** Gerçekçi bir demo için, arka planda sürekli veri üreten bir **Trafik Jeneratörü** geliştirdik. Bu servis, Paycell ve BiP gibi servislerden yapay eventler (olaylar) üretir."

---

## 3. Ana Özellikler ve Demo (3-4 Dakika)
*(Bu aşamada ekran paylaşımı yapıp Dashboard üzerinden anlatım yapılır)*

### A. Dashboard (Komuta Merkezi)
"Şu an gördüğünüz ekran, güvenlik analistinin ana ekranıdır.
*   **Canlı Trafik Grafiği:** Sisteme akan olayları saniye saniye izleyebiliyoruz.
*   **Haftalık Isı Haritası (Heatmap):** Hangi gün ve saatlerde riskin yoğunlaştığını görebiliyoruz.
*   **Servis Dağılımı:** Risklerin hangi servisten (Paycell mi, TV+ mı?) geldiğini analiz ediyoruz.
*   *Örnek:* Şu an ekranda gördüğünüz veriler canlı olarak, bizim yazdığımız simülasyon aracından geliyor."

### B. Dinamik Kural Motoru (Rule Engine)
*(Risk Rules Sayfasına geçilir)*
"TrustShield'in kalbi burasıdır. Statik kod yazmadan, arayüz üzerinden dinamik kurallar tanımlayabiliyoruz.
Örneğin:
*   *'Eğer Paycell işlemi 20.000 TL üzerindeyse ve Şehir İstanbul değilse -> FRAUD CASE OLUŞTUR'*
*   *'Eğer BiP üzerinden 1 dakikada 100 mesaj atıldıysa -> KULLANICIYI UYAR'*
Bu kurallar Python'un esnekliği sayesinde anında devreye girer. Kod derlemeye gerek yoktur."

### C. Fraud Vaka Yönetimi (Decisions & Cases)
*(Fraud Cases Sayfasına geçilir)*
"Bir kural tetiklendiğinde ne olur? Sistem otomatik olarak bir aksiyon alır.
Burada sistemin otomatik olarak açtığı vakaları görüyoruz.
*   **Otomasyon:** Yüksek riskli işlemlerde sistem insan müdahalesi beklemeden işlemi bloklayabilir veya 2FA zorlayabilir.
*   **İzlenebilirlik (Traceability):** Her vakanın içinde, o vakayı tetikleyen 'Event ID' ve 'Kural ID' bilgisi saklanır. Böylece geriye dönük tam izlenebilirlik sağlarız."

---

## 4. Senaryo Örneği (Demo Finali)
**Konuşmacı:**
"Şimdi canlı bir senaryo görelim.
Simülasyonumuz şu an arka planda **20.000 TL üzeri şüpheli bir Paycell işlemi** üretiyor.
Ekranda (Recent Transactions tablosunda) bu işlemi görüyoruz.
Aynı anda, sistemimizdeki **'High Value Paycell Transaction'** kuralı tetiklendi ve **Open Fraud Cases** sayısına +1 eklendi.
Analist olarak ben bu vakaya girip, detayları inceleyip, 'Hesabı Askıya Al' veya 'Güvenli İşaretle' diyerek süreci tamamlayabilirim."

---

## 5. Kapanış
**Konuşmacı:**
"Özetle TrustShield; Turkcell servisleri için ölçeklenebilir, gerçek zamanlı ve kullanıcı dostu bir güvenlik kalkanıdır.
Bizi dinlediğiniz için teşekkür ederiz."
