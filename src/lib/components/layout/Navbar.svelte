<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { goto } from "$app/navigation";
  import { chatId, chats } from "$lib/stores";

  let currentChatTitle: string = "RUChat Ai";

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
</script>

<!-- แถบนำทางหลัก -->
<nav
  id="nav"
  class="fixed top-0 flex w-screen items-center justify-between p-4 bg-gray-100 text-gray-700 z-30"
>
  <div class="container mx-auto flex items-center justify-between">
    <!-- ปุ่มสำหรับสร้างแชทใหม่ -->
    <button
      class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg transition"
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
    <!-- แสดงหัวข้อของแชทปัจจุบัน -->
    <div class="text-lg font-semibold">
      {currentChatTitle != "" ? currentChatTitle : "RUChat Ai"}
    </div>
  </div>
</nav>
