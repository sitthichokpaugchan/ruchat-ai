<script lang="ts">
  export let submitPrompt: Function;
  export let stopResponse: Function;
  export let autoScroll = true;
  export let prompt = "";
  export let messages = [];
</script>

<!-- ส่วนของ input ที่อยู่ด้านล่างของหน้าจอ -->
<div class="fixed bottom-0 left-0 right-0">
  <!-- ปุ่มสำหรับเลื่อนลง -->
  <div class="px-2.5 pt-2.5 mx-auto flex justify-center">
    {#if autoScroll === false && messages.length > 0}
      <div class="flex justify-center mb-4">
        <button
          class="bg-white border border-gray-100 p-1.5 rounded-full hover:bg-gray-100 transition text-sm"
          on:click={() => {
            autoScroll = true;
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          }}
        >
          เลื่อนไปด้านล่าง
        </button>
      </div>
    {/if}
  </div>
  <!-- ส่วนของ input form -->
  <div class="bg-white">
    <div class="max-w-3xl px-2.5 mx-auto">
      <div class="bg-gradient-to-t from-white pb-2">
        <form
          class="flex flex-col w-full rounded-xl border border-gray-200 bg-white text-gray-700"
          on:submit|preventDefault={(e) => {
            if (prompt.trim() !== "") {
              submitPrompt(prompt);
              prompt = "";
              e.target.style.height = "auto";
            }
          }}
        >
          <div class="flex items-end bg-gray-100">
            <!-- Textarea สำหรับกรอก prompt -->
            <textarea
              id="chat-textarea"
              class="w-full py-3 px-4 rounded-xl resize-none bg-transparent text-gray-700 outline-none"
              placeholder="ส่งข้อความ"
              bind:value={prompt}
              on:keypress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // ป้องกันการขึ้นบรรทัดใหม่
                  if (prompt.trim() !== "") {
                    // ตรวจสอบว่า prompt ไม่ใช่ค่าว่าง
                    submitPrompt(prompt);
                    prompt = ""; // ล้างค่า prompt หลังจากส่ง
                    e.target.style.height = "auto"; // รีเซ็ตความสูงของ textarea
                  }
                }
              }}
              rows="1"
              on:input={(e) => {
                e.target.style.height = "";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 200) + "px";
              }}
            />
            <!-- ปุ่มสำหรับส่ง prompt หรือหยุดการตอบสนอง -->
            <div class="flex space-x-0.5 mb-2 mr-2">
              {#if messages.length == 0 || messages.at(-1).done == true}
                <button
                  class="{prompt !== ''
                    ? 'bg-blue-500 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-white'} transition rounded-lg p-1 w-7 h-7 flex items-center justify-center text-sm"
                  type="submit"
                  disabled={prompt === ""}
                >
                  ส่ง
                </button>
              {:else}
                <button
                  class="bg-blue-500 text-white hover:bg-blue-700 transition rounded-lg p-1.5 text-sm"
                  on:click={stopResponse}
                >
                  หยุด
                </button>
              {/if}
            </div>
          </div>
        </form>
        <!-- ข้อความเตือน -->
        <div class="mt-1.5 text-xs text-gray-500 text-center">
          LLM สามารถทำผิดพลาดได้ ตรวจสอบข้อมูลที่สำคัญ
        </div>
      </div>
    </div>
  </div>
</div>
