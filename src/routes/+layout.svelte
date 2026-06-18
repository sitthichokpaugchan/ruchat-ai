<script>
  // นำเข้าไฟล์ CSS ที่จำเป็น
  import "../app.css";
  import "../tailwind.css";
  import "tippy.js/dist/tippy.css";
  import { Toaster } from "svelte-french-toast";
</script>

<!-- ตั้งค่า title ของหน้าเว็บ -->
<svelte:head>
  <title>RUChat AI</title>
</svelte:head>

<!-- แสดง Toaster component -->
<Toaster />
<!-- แสดง content ของ page -->
<slot />
