// Public site çevirileri (eski Resources/SharedResource.*.resx dosyalarından).
(function () {
  const LANG_KEY = "lang";
  const SUPPORTED = ["en", "tr"];

  const STRINGS = {
    en: {
      Home: "Home",
      Education: "Education",
      Experience: "Experience",
      Projects: "Projects",
      Skills: "Skills",
      Contact: "Contact",
      DownloadCV: "Download CV",
      Welcome: "Welcome",
      Demo: "Demo",
      GitHub: "GitHub",
      ContactMeHeader: "Contact Me",
      ContactMeSubtext: "Feel free to contact me for any project, job opportunities, or any other inquiries.",
      FormName: "Name",
      FormEmail: "Email",
      FormSubject: "Subject",
      FormMessage: "Message",
      FormSendMessage: "Send Message",
      Certificates: "Certificates",
      NoCertificates: "No certificates added yet.",
      ContactSuccess: "Your message has been sent successfully! I will get back to you as soon as possible.",
      ContactError: "An error occurred while sending your message. Please try again.",
      ContactInvalid: "Please check the highlighted fields.",
      ContactTooMany: "You have sent too many messages in a short time. Please wait a minute and try again.",
      Links: "Links",
      ProfilePhoto: "Profile Photo",
      Loading: "Loading...",
      LoadError: "Content could not be loaded. Please try again later.",
      TurnstileMissing: "Security verification could not be completed.",
      TurnstileFailed: "Security verification failed. Please complete the check again and resend.",
      BackToTop: "Back to top",
      Present: "Present",
    },
    tr: {
      Home: "Ana Sayfa",
      Education: "Eğitim",
      Experience: "Deneyim",
      Projects: "Projeler",
      Skills: "Yetenekler",
      Contact: "İletişim",
      DownloadCV: "CV'mi İndir",
      Welcome: "Hoş geldiniz",
      Demo: "Demo",
      GitHub: "GitHub",
      ContactMeHeader: "Benimle İletişime Geçin",
      ContactMeSubtext: "Herhangi bir proje, iş fırsatı veya diğer sorularınız için benimle iletişime geçmekten çekinmeyin.",
      FormName: "İsim",
      FormEmail: "E-posta",
      FormSubject: "Konu",
      FormMessage: "Mesaj",
      FormSendMessage: "Mesaj Gönder",
      Certificates: "Sertifikalar",
      NoCertificates: "Henüz sertifika eklenmemiş.",
      ContactSuccess: "Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağım.",
      ContactError: "Mesajınız gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
      ContactInvalid: "Lütfen işaretli alanları kontrol edin.",
      ContactTooMany: "Kısa sürede çok fazla mesaj gönderdiniz. Lütfen bir dakika bekleyip tekrar deneyin.",
      Links: "Bağlantılar",
      ProfilePhoto: "Profil Fotoğrafı",
      Loading: "Yükleniyor...",
      LoadError: "İçerik yüklenemedi. Lütfen daha sonra tekrar deneyin.",
      TurnstileMissing: "Güvenlik doğrulaması yapılamadı.",
      TurnstileFailed: "Güvenlik doğrulaması başarısız oldu. Lütfen doğrulamayı tekrar yapıp yeniden gönderin.",
      BackToTop: "Başa dön",
      Present: "Günümüz",
    },
  };

  function getLang() {
    const saved = localStorage.getItem(LANG_KEY);
    // Varsayılan Türkçe; ziyaretçi EN'ye geçerse tercih saklanır
    return SUPPORTED.includes(saved) ? saved : "tr";
  }

  window.i18n = {
    getLang,
    setLang: (lang) => localStorage.setItem(LANG_KEY, lang),
    t: (key) => STRINGS[getLang()][key] ?? key,
    // Intl.DateTimeFormat için yerel ayar
    locale: () => (getLang() === "tr" ? "tr-TR" : "en-US"),
    // API iki dilli alanları "alanTr" / "alanEn" olarak döner; aktif dildekini seçer.
    pick: (obj, field) => (obj ? obj[field + (getLang() === "tr" ? "Tr" : "En")] : null),
  };
})();
