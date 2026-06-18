<script>
  // นำเข้าไฟล์ CSS ที่จำเป็น
  import "../app.css";
  import "../tailwind.css";
  import "tippy.js/dist/tippy.css";
  import { Toaster } from "svelte-french-toast";
  import { onMount } from "svelte";
  import { chatId, chats } from "$lib/stores";

  let baseTitle = "RUChat Ai";
  let displayTitle = "";

  // ติดตามการเปลี่ยนแปลงของห้องแชทปัจจุบันเพื่อเปลี่ยนข้อความใน title bar
  $: {
    const id = $chatId;
    const chat = $chats.find((c) => c.id === id);
    let newTitle = "RUChat Ai";
    if (chat && chat.title) {
      newTitle = chat.title;
    }
    
    if (baseTitle !== newTitle) {
      baseTitle = newTitle;
      displayTitle = baseTitle + "    "; // เติมเว้นวรรคท้ายข้อความเพื่อให้การเลื่อนดูต่อเนื่อง
    }
  }

  if (!displayTitle) {
    displayTitle = baseTitle + "    ";
  }

  onMount(() => {
    const interval = setInterval(() => {
      if (displayTitle) {
        // เลื่อนข้อความจากขวาไปซ้ายโดยตัดตัวอักษรตัวแรกไปต่อท้าย
        displayTitle = displayTitle.substring(1) + displayTitle.charAt(0);
      }
    }, 350); // ความเร็วในการเลื่อน (350 มิลลิวินาที)

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
