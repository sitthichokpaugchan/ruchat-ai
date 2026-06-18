<script>
  // นำเข้าไฟล์ CSS ที่จำเป็น
  import "../app.css";
  import "../tailwind.css";
  import "tippy.js/dist/tippy.css";
  import { Toaster } from "svelte-french-toast";
  import { onMount } from "svelte";

  // รายการเมนูเริ่มต้น (Fallback) หากดึงข้อมูลจากเว็บจริงไม่สำเร็จ
  let menus = [
    "หน้าหลัก",
    "เกี่ยวกับมหาวิทยาลัย",
    "สารสนเทศนักศึกษา",
    "สาขาวิทยบริการฯ",
    "สื่อการเรียนการสอน",
    "วารสาร งานวิจัย KM",
    "แอปพลิเคชัน",
    "ลิ้งก์ที่น่าสนใจ",
    "TCAS"
  ];

  let displayTitle = "";

  // ฟังก์ชันอัปเดตข้อความเลื่อนใน title bar
  function updateDisplayTitle() {
    displayTitle = menus.join(" | ") + "    "; // คั่นเมนูด้วย | และเว้นช่องว่างตอนท้าย
  }

  // อัปเดตครั้งแรกทันที
  updateDisplayTitle();

  onMount(() => {
    // เลื่อนข้อความจากขวาไปซ้ายโดยตัดตัวอักษรตัวแรกไปต่อท้าย
    const interval = setInterval(() => {
      if (displayTitle) {
        displayTitle = displayTitle.substring(1) + displayTitle.charAt(0);
      }
    }, 350); // ความเร็วในการเลื่อน (350 มิลลิวินาที)

    // ฟังก์ชันดึงเมนูสดแบบอซิงโครนัส
    const fetchLiveMenus = async () => {
      try {
        const targetUrl = "https://www.ru.ac.th/th/";
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        
        if (res.ok) {
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          
          // ค้นหาแถบเมนูของ ม.ราม
          const navMenu = doc.querySelector("ul.nav-menu") || doc.querySelector(".nav-menu");
          if (navMenu) {
            const links = navMenu.querySelectorAll("a");
            if (links.length > 0) {
              const fetchedMenus = Array.from(links)
                .map(link => {
                  let text = link.textContent || "";
                  // ตัดช่องว่างและขึ้นบรรทัดใหม่
                  text = text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
                  // จัดรูปแบบ "วารสาร,งานวิจัย,KM" เป็น "วารสาร งานวิจัย KM"
                  if (text.includes("วารสาร") && text.includes("งานวิจัย")) {
                    text = text.replace(/,/g, " ");
                  }
                  return text;
                })
                .filter(text => text.length > 0);
              
              if (fetchedMenus.length > 0) {
                menus = fetchedMenus;
                updateDisplayTitle();
              }
            }
          }
        }
      } catch (error) {
        console.warn("ไม่สามารถดึงข้อมูลเมนูสดจากเว็บได้เนื่องจากติดปัญหาเครือข่าย/CORS จะใช้งานข้อมูลเมนูแบบสำรอง:", error);
      }
    };

    // เรียกทำงานการดึงข้อมูลเมนูสด
    fetchLiveMenus();

    return () => {
      clearInterval(interval);
    };
  });
</script>

<!-- ตั้งค่า title ของหน้าเว็บ -->
<svelte:head>
  <title>{displayTitle}</title>
</svelte:head>

<!-- แสดง Toaster component -->
<Toaster />
<!-- แสดง content ของ page -->
<slot />
