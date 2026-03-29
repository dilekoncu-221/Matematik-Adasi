# Kullanıcı Akışı (User Flow)

1. **Uygulamaya Giriş**
   - Kullanıcı `index.html` sayfasını açar.
   - Matematik Adası karşılama ekranı görünür. Kullanıcı adı girme veya doğrudan adaya geçiş yapma seçeneği sunulur.

2. **Ana Menü (Ada Haritası)**
   Kullanıcı ana ekranda 4 temel fonksiyona erişir:
   - **Eğitimler:** Konu anlatımlarına giriş yapar.
   - **Alıştırmalar:** Öğrenilen konularla ilgili sorular çözer.
   - **Başarılarım:** Kazanılan rozetleri, seviyeleri ve yıldızları görüntüler.
   - **Profil (Avatar/Ayarlar):** Avatar ve kullanıcı ayarlarını yönetir.

3. **Eğitim ve Etkileşim**
   - Kullanıcı "Eğitimler" veya "Alıştırmalar" kısmına girdiğinde, ilgili bileşen veya sayfa açılır.
   - Soruyu doğru yanıtladığında animasyonlu bir tebrik mesajı ve "Yıldız" kazanır.
   - Yanlış yanıtladığında ise cesaretlendirici bir mesaj veya ipucu alır.

4. **Geribildirim ve İlerleme**
   - Her modül tamamlandığında ana adaya (ana sayfaya) yönlendirilir.
   - Kullanıcının puanları (yıldızlar) birikir ve "Başarılarım" bölümünde yeni seviyelerin/rozetlerin kilidinin açılmasını sağlar.
