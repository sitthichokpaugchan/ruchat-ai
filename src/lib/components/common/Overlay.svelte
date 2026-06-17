<script>
  /**
   * คอมโพเนนต์ที่แสดง spinner โหลดข้อความ
   * บนเนื้อหาของ slot เมื่อ property `show` เป็น true
   *
   * @property {boolean} show - จะแสดง overlay หรือไม่
   * @property {string} content - ข้อความที่จะแสดงถัดจาก spinner
   * @property {number} opacity - ความทึบของพื้นหลัง overlay (ค่าเริ่มต้น: 1)
   */
  import Spinner from "./Spinner.svelte";

  export let show = false;
  export let content = "";

  export let opacity = 1;
</script>

<div class="relative">
  {#if show}
    <div class="absolute w-full h-full flex">
      <!-- พื้นหลัง overlay -->
      <div
        class="absolute rounded"
        style="inset: -10px; opacity: {opacity}; backdrop-filter: blur(5px);"
      />

      <!-- spinner และข้อความ -->
      <div class="flex w-full flex-col justify-center">
        <div class="py-3">
          <Spinner className="ml-2" />
        </div>

        {#if content !== ""}
          <div class="text-center text-gray-100 text-xs font-medium z-50">
            {content}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- เนื้อหาของ slot -->
  <slot />
</div>
