<script>
  // นำเข้า page store จาก $app/stores
  import { page } from "$app/stores";
</script>

<!-- หน้าสำหรับแสดงข้อผิดพลาด -->
<div class=" bg-white min-h-screen">
  <div class=" flex h-full">
    <!-- แสดง status code และ message ของ error -->
    <div class="m-auto my-10 text-gray-700 text-3xl font-semibold">
      {$page.status}: {$page.error.message}
    </div>
  </div>
</div>
