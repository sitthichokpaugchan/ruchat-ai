<script lang="ts">
  export let submitPrompt: Function;
  export let stopResponse: Function;
  export let autoScroll = true;
  export let prompt = "";
  export let messages = [];
  export let scrollToBottom: Function = () => {};
</script>

<!-- ส่วนของ input ที่อยู่ด้านล่างของหน้าจอ (ใช้ sticky แทน fixed เพื่อให้อยู่เหนือ footer ในโครงสร้างและไม่ทับซ้อนกัน) -->
<div class="sticky bottom-0 w-full z-30 pointer-events-none">
  <!-- ปุ่มสำหรับเลื่อนลง (ใช้ fixed เพื่อให้ลอยและมองเห็นได้เสมอตลอดการเลื่อนอ่านประวัติการแชท) -->
  {#if autoScroll === false && messages.length > 0}
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <button
        class="bg-white border border-gray-200 p-2 px-4 rounded-full hover:bg-gray-50 transition text-sm shadow-lg flex items-center space-x-1 text-gray-700 font-medium"
        on:click={() => {
          autoScroll = true;
          scrollToBottom(true);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
        <span>เลื่อนไปด้านล่าง</span>
      </button>
    </div>
  {/if}
  <!-- ส่วนของ input form -->
  <div class="bg-gradient-to-t from-white via-white/90 to-transparent pt-6 pointer-events-auto">
    <div class="max-w-3xl px-2.5 mx-auto">
      <div class="pb-2">
        <form
          class="flex flex-col w-full rounded-xl border border-gray-200 bg-white text-gray-700 shadow-lg"
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
        <div class="mt-1 text-[10px] sm:text-xs text-gray-400 text-center">
          LLM สามารถทำผิดพลาดได้ ตรวจสอบข้อมูลที่สำคัญ
        </div>
      </div>
    </div>
  </div>
</div>
