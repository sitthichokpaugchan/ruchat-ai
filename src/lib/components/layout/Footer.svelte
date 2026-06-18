<script lang="ts">
  // ข้อมูลติดต่อ ม.รามฯ
  const contactInfo = {
    name: "มหาวิทยาลัยรามคำแหง : Ramkhamhaeng University",
    address: "282 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240",
    phone: "0-2310-8000",
    fax: "0-2310-8022",
    email: "saraban@ru.ac.th",
    website: "https://www.ru.ac.th"
  };
</script>

<footer class="bg-[#04091e] text-gray-400 py-8 px-6 border-t border-blue-950 mt-auto w-full select-none text-xs sm:text-sm">
  <div class="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
    <!-- ข้อมูลติดต่อ มหาวิทยาลัย -->
    <div class="flex flex-col text-center md:text-left">
      <h3 class="text-white font-bold text-sm sm:text-base mb-2">
        {contactInfo.name}
      </h3>
      <p class="text-gray-400 leading-relaxed mb-1">
        {contactInfo.address}
      </p>
      <div class="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-gray-400 mt-2">
        <span><strong>โทรศัพท์:</strong> <a href="tel:{contactInfo.phone}" class="hover:text-[#ffb700] transition-colors">{contactInfo.phone}</a></span>
        <span><strong>โทรสาร:</strong> {contactInfo.fax}</span>
        <span><strong>อีเมล:</strong> <a href="mailto:{contactInfo.email}" class="hover:text-[#ffb700] transition-colors">{contactInfo.email}</a></span>
      </div>
    </div>

    <!-- ลิงก์ช่องทางติดต่ออื่น ๆ -->
    <div class="flex flex-col items-center md:items-end gap-3">
      <div class="flex gap-4">
        <!-- Facebook -->
        <a href="https://www.facebook.com/ramkhamhaeng.ru/" target="_blank" rel="noopener noreferrer" class="hover:text-[#ffb700] text-gray-400 transition-colors" title="Facebook">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd" />
          </svg>
        </a>
        <!-- Twitter / X -->
        <a href="https://twitter.com/prramru" target="_blank" rel="noopener noreferrer" class="hover:text-[#ffb700] text-gray-400 transition-colors" title="Twitter">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <!-- YouTube -->
        <a href="https://www.youtube.com/channel/UCkqEn8wBnRZQt6aitsKoKVg" target="_blank" rel="noopener noreferrer" class="hover:text-[#ffb700] text-gray-400 transition-colors" title="YouTube">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.42 4.814a2.503 2.503 0 0 1-1.768 1.768C18.254 19 12 19 12 19s-6.254 0-7.812-.418a2.503 2.503 0 0 1-1.768-1.768C2 15.256 2 12 2 12s0-3.255.42-4.814a2.507 2.507 0 0 1 1.768-1.768C5.746 5 12 5 12 5s6.254 0 7.812.418zM10.07 15.002L15.34 12l-5.27-3.002v6.004z" clip-rule="evenodd" />
          </svg>
        </a>
        <!-- Website -->
        <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" class="hover:text-[#ffb700] text-gray-400 transition-colors" title="Website">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </a>
      </div>
      <div class="text-center md:text-right text-gray-500 text-xs mt-1">
        <span><a href={contactInfo.website} target="_blank" rel="noopener noreferrer" class="hover:text-[#ffb700] transition-colors">Ramkhamhaeng University</a></span>
      </div>
    </div>
  </div>
</footer>
