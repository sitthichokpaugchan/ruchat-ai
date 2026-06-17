<script lang="ts">
  import { models, settings } from "$lib/stores";
  import toast from "svelte-french-toast";

  export let selectedModels = [""];
  export let disabled = false;

  // ฟังก์ชันสำหรับบันทึกโมเดลเริ่มต้น
  const saveDefaultModel = () => {
    settings.set({ ...$settings, models: selectedModels });
    localStorage.setItem("settings", JSON.stringify($settings));
    toast.success("ตั้งเป็นโมเดลเริ่มต้นแล้ว");
  };
</script>

<div class="flex flex-col my-2">
  <!-- วนลูปแสดงรายการโมเดลที่เลือก -->
  {#each selectedModels as selectedModel}
    <div class="flex">
      <!-- select สำหรับเลือกโมเดล -->
      <select
        id="models"
        class="outline-none bg-transparent text-lg font-semibold rounded-lg block w-full placeholder-gray-400"
        bind:value={selectedModel}
        {disabled}
      >
        <option class=" text-gray-700" value="" selected>เลือกโมเดล</option>

        <!-- วนลูปแสดงรายการโมเดลทั้งหมด -->
        {#each $models as model}
          {#if model.name === "hr"}
            <hr />
          {:else}
            <option value={model.name} class="text-gray-700 text-lg"
              >{model.name}</option
            >
          {/if}
        {/each}
      </select>
    </div>
  {/each}
</div>

<!-- ปุ่มสำหรับบันทึกโมเดลเริ่มต้น -->
<div class="text-left mt-1.5 text-xs text-gray-500">
  <button on:click={saveDefaultModel}> ตั้งเป็นค่าเริ่มต้น</button>
</div>
