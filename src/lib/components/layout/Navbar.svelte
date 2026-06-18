<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { goto } from "$app/navigation";
  import { chatId, chats } from "$lib/stores";
  import { onMount } from "svelte";

  let currentChatTitle: string = "RUChat Ai";

  // รายการเมนูเริ่มต้นพร้อมลิงก์ (Fallback)
  let menus = [
    { text: "หน้าหลัก", url: "https://www.ru.ac.th/th" },
    { text: "เกี่ยวกับมหาวิทยาลัย", url: "https://www.ru.ac.th/th/firstpage/page?view=AboutUs" },
    { text: "สารสนเทศนักศึกษา", url: "https://www.ru.ac.th/th/#information" },
    { text: "สาขาวิทยบริการฯ", url: "https://www.ru.ac.th/th/firstpage/page?view=Campus" },
    { text: "สื่อการเรียนการสอน", url: "https://www.ru.ac.th/th/firstpage/page?view=Media" },
    { text: "วารสาร งานวิจัย KM", url: "https://www.ru.ac.th/th/firstpage/page?view=Journal" },
    { text: "แอปพลิเคชัน", url: "https://www.ru.ac.th/th/firstpage/page?view=Application" },
    { text: "ลิ้งก์ที่น่าสนใจ", url: "https://www.ru.ac.th/th/firstpage/page?view=ExternalLink" },
    { text: "TCAS", url: "https://tcas.ru.ac.th/" }
  ];

  // บล็อกโค้ดที่จะทำงานเมื่อ $chatId หรือ $chats เปลี่ยนแปลง
  $: {
    const id = $chatId;
    const chat = $chats.find((c) => c.id === id);
    // ถ้ามี chat ให้ตั้งค่า currentChatTitle เป็น title ของ chat
    if (chat) {
      currentChatTitle = chat.title;
    } else {
      // ถ้าไม่มี chat ให้ตั้งค่า currentChatTitle เป็น "RUChat Ai"
      currentChatTitle = "RUChat Ai";
    }
  }

  onMount(() => {
    // ดึงเมนูสดจากเว็บไซต์ ม.รามฯ ผ่าน AllOrigins CORS Proxy
    const fetchLiveMenus = async () => {
      try {
        const targetUrl = "https://www.ru.ac.th/th/";
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        
        if (res.ok) {
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          
          // ค้นหาแถบเมนู
          const navMenu = doc.querySelector("ul.nav-menu") || doc.querySelector(".nav-menu");
          if (navMenu) {
            const links = navMenu.querySelectorAll("a");
            if (links.length > 0) {
              const fetchedMenus = Array.from(links)
                .map(link => {
                  let text = link.textContent || "";
                  let href = link.getAttribute("href") || "";
                  
                  // ทำความสะอาดข้อความ
                  text = text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
                  if (text.includes("วารสาร") && text.includes("งานวิจัย")) {
                    text = text.replace(/,/g, " ");
                  }
                  
                  // แปลง relative path เป็น absolute URL
                  if (href.startsWith("/")) {
                    href = "https://www.ru.ac.th" + href;
                  }
                  
                  return { text, url: href };
                })
                .filter(item => item.text.length > 0);
              
              if (fetchedMenus.length > 0) {
                menus = fetchedMenus;
              }
            }
          }
        }
      } catch (error) {
        console.warn("ไม่สามารถดึงข้อมูลเมนูสดจากเว็บได้เนื่องจากติดปัญหาเครือข่าย/CORS จะใช้งานข้อมูลเมนูแบบสำรอง:", error);
      }
    };

    fetchLiveMenus();
  });
</script>

<!-- แถบนำทางหลัก -->
<nav
  id="nav"
  class="fixed top-0 flex w-screen items-center justify-between p-4 bg-gray-100 text-gray-700 z-30 border-b border-gray-200"
>
  <div class="container mx-auto flex items-center justify-between gap-4">
    <!-- ปุ่มสำหรับสร้างแชทใหม่ -->
    <div class="flex-shrink-0">
      <button
        class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg transition font-medium text-sm"
        on:click={async () => {
          console.log("แชทใหม่");
          // ไปที่หน้าแรก
          goto("/");
          // ตั้งค่า chatId ใหม่
          await chatId.set(uuidv4());
        }}
      >
        แชทใหม่
      </button>
    </div>

    <!-- แถบข้อความเลื่อนของ ม.รามฯ -->
    <div class="flex-grow mx-4 overflow-hidden relative bg-white/80 rounded-lg border border-gray-200/50 py-1.5 px-3 select-none flex items-center shadow-sm max-w-[50%] sm:max-w-[60%] md:max-w-[70%]">
      <div class="marquee-wrapper w-full overflow-hidden relative">
        <div class="marquee-content whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300">
          {#each menus as menu, index}
            <a
              href={menu.url}
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-blue-600 hover:underline transition-colors duration-200"
            >
              {menu.text}
            </a>
            {#if index < menus.length - 1}
              <span class="mx-4 text-gray-400 font-normal select-none">•</span>
            {/if}
          {/each}
        </div>
      </div>
    </div>

    <!-- แสดงหัวข้อของแชทปัจจุบัน -->
    <div class="flex-shrink-0 text-lg font-semibold truncate max-w-[150px] sm:max-w-[200px] text-right">
      {currentChatTitle != "" ? currentChatTitle : "RUChat Ai"}
    </div>
  </div>
</nav>

<style>
  .marquee-wrapper {
    display: flex;
    overflow: hidden;
    width: 100%;
  }

  .marquee-content {
    display: inline-block;
    white-space: nowrap;
    animation: marquee-scroll 35s linear infinite;
    padding-left: 100%;
  }

  /* หยุดวิ่งเมื่อเอาเมาส์มาวางทับเพื่อให้คลิกง่ายขึ้น */
  .marquee-content:hover {
    animation-play-state: paused;
  }

  @keyframes marquee-scroll {
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(-100%, 0, 0);
    }
  }
</style>
