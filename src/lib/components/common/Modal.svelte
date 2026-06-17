<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  export let show = false;
  let mounted = false;
  onMount(() => {
    mounted = true;
  });
  // เมื่อ mounted หรือ show เปลี่ยนแปลง
  $: if (mounted) {
    // ถ้า show เป็น true ให้ซ่อน scrollbar ของ body
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      // ถ้า show เป็น false ให้แสดง scrollbar ของ body
      document.body.style.overflow = "unset";
    }
  }
</script>

<!-- ถ้า show เป็น true ให้แสดง modal -->
{#if show}
  <div
    class="fixed inset-0 bg-black/50 flex justify-center z-50 overflow-hidden"
    on:click={() => {
      show = false;
    }}
  >
    <div
      class="m-auto rounded-xl max-w-full w-[40rem] mx-2 bg-gray-50 shadow-2xl"
      transition:fade={{ delay: 100, duration: 200 }}
      on:click={(e) => {
        e.stopPropagation();
      }}
    >
      <!-- slot สำหรับใส่ content ของ modal -->
      <slot />
    </div>
  </div>
{/if}
