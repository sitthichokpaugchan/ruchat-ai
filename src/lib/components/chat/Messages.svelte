<script lang="ts">
  import { marked } from "marked";
  import { v4 as uuidv4 } from "uuid";
  import hljs from "highlight.js";
  import "highlight.js/styles/github-dark.min.css";
  import auto_render from "katex/dist/contrib/auto-render.mjs";
  import "katex/dist/katex.min.css";
  import { chatId } from "$lib/stores";
  import { copyToClipboard } from "$lib/utils";
  import { tick } from "svelte";

  export let sendPrompt: Function;
  export let regenerateResponse: Function;
  export let bottomPadding = false;
  export let autoScroll;
  export let history = {};
  export let messages = [];

  // เมื่อได้ข้อความครบแล้ว ให้เรนเดอร์ LaTeX, ไฮไลท์โค้ด และสร้างปุ่มคัดลอกโค้ด
  $: if (messages && messages.length > 0 && (messages.at(-1).done ?? false)) {
    (async () => {
      await tick();
      renderLatex();
      hljs.highlightAll();
      createCopyCodeBlockButton();
    })();
  }

  // เมื่อเปิดใช้งานการเลื่อนอัตโนมัติและมี padding ด้านล่าง ให้เลื่อนไปที่ด้านล่างของหน้า
  $: if (autoScroll && bottomPadding) {
    (async () => {
      await tick();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    })();
  }

  // ฟังก์ชันสำหรับสร้างปุ่มคัดลอกโค้ดในบล็อกโค้ด
  const createCopyCodeBlockButton = () => {
    let blocks = document.querySelectorAll("pre");
    blocks.forEach((block) => {
      if (
        navigator.clipboard &&
        block.childNodes.length < 2 &&
        block.id !== "user-message"
      ) {
        let code = block.querySelector("code");
        code.classList.add("rounded-t-none");

        let topBarDiv = document.createElement("div");
        topBarDiv.classList.add(
          "bg-gray-900",
          "flex",
          "justify-between",
          "p-2",
          "rounded-t-lg",
          "overflow-x-auto"
        );

        let langDiv = document.createElement("div");
        let codeClassNames = code?.className.split(" ");
        langDiv.textContent =
          codeClassNames[0] === "hljs"
            ? codeClassNames[1].slice(9)
            : codeClassNames[0].slice(9);
        langDiv.classList.add("text-white", "text-xs", "m-1");

        let button = document.createElement("button");
        button.textContent = "คัดลอก";
        button.classList.add(
          "bg-transparent",
          "text-gray-300",
          "text-xs",
          "m-1",
          "hover:bg-gray-700",
          "rounded",
          "cursor-pointer"
        );
        button.addEventListener("click", () => copyCode(block, button));

        topBarDiv.appendChild(langDiv);
        topBarDiv.appendChild(button);
        block.prepend(topBarDiv);
      }
    });

    async function copyCode(block, button) {
      let code = block.querySelector("code");
      let text = code.innerText;
      await navigator.clipboard.writeText(text);
      button.innerText = "คัดลอกแล้ว";
      setTimeout(() => {
        button.innerText = "คัดลอก";
      }, 1000);
    }
  };

  // ฟังก์ชันสำหรับเรนเดอร์นิพจน์ LaTeX
  const renderLatex = () => {
    let chatMessageElements = document.getElementsByClassName("chat-assistant");
    for (const element of chatMessageElements) {
      auto_render(element, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: true },
          { left: "[", right: "]", display: true },
        ],
        throwOnError: false,
      });
    }
  };

  // ฟังก์ชันสำหรับจัดการการแก้ไขข้อความ
  const editMessageHandler = async (messageId) => {
    history.messages[messageId].edit = true;
    history.messages[messageId].originalContent =
      history.messages[messageId].content;
    history.messages[messageId].editedContent =
      history.messages[messageId].content;
    await tick();
    const editElement = document.getElementById(`message-edit-${messageId}`);
    editElement.style.height = "";
    editElement.style.height = `${editElement.scrollHeight}px`;
  };

  // ฟังก์ชันสำหรับยืนยันการแก้ไขข้อความ
  const confirmEditMessage = async (messageId) => {
    history.messages[messageId].edit = false;
    let userPrompt = history.messages[messageId].editedContent;
    let userMessageId = uuidv4();
    let userMessage = {
      id: userMessageId,
      parentId: history.messages[messageId].parentId,
      childrenIds: [],
      role: "user",
      content: userPrompt,
      ...(history.messages[messageId].files && {
        files: history.messages[messageId].files,
      }),
    };
    let messageParentId = history.messages[messageId].parentId;
    if (messageParentId !== null) {
      history.messages[messageParentId].childrenIds = [
        ...history.messages[messageParentId].childrenIds,
        userMessageId,
      ];
    }
    history.messages[userMessageId] = userMessage;
    history.currentId = userMessageId;
    await tick();
    await sendPrompt(userPrompt, userMessageId, $chatId);
  };

  // ฟังก์ชันสำหรับยกเลิกการแก้ไขข้อความ
  const cancelEditMessage = (messageId) => {
    history.messages[messageId].edit = false;
    history.messages[messageId].editedContent = undefined;
  };

  // ฟังก์ชันสำหรับแสดงข้อความก่อนหน้า
  const showPreviousMessage = async (message) => {
    if (message.parentId !== null) {
      let messageId =
        history.messages[message.parentId].childrenIds[
          Math.max(
            history.messages[message.parentId].childrenIds.indexOf(message.id) -
              1,
            0
          )
        ];
      if (message.id !== messageId) {
        let messageChildrenIds = history.messages[messageId].childrenIds;
        while (messageChildrenIds.length !== 0) {
          messageId = messageChildrenIds.at(-1);
          messageChildrenIds = history.messages[messageId].childrenIds;
        }
        history.currentId = messageId;
      }
    } else {
      let childrenIds = Object.values(history.messages)
        .filter((message) => message.parentId === null)
        .map((message) => message.id);
      let messageId =
        childrenIds[Math.max(childrenIds.indexOf(message.id) - 1, 0)];
      if (message.id !== messageId) {
        let messageChildrenIds = history.messages[messageId].childrenIds;
        while (messageChildrenIds.length !== 0) {
          messageId = messageChildrenIds.at(-1);
          messageChildrenIds = history.messages[messageId].childrenIds;
        }
        history.currentId = messageId;
      }
    }
    await tick();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  // ฟังก์ชันสำหรับแสดงข้อความถัดไป
  const showNextMessage = async (message) => {
    if (message.parentId !== null) {
      let messageId =
        history.messages[message.parentId].childrenIds[
          Math.min(
            history.messages[message.parentId].childrenIds.indexOf(message.id) +
              1,
            history.messages[message.parentId].childrenIds.length - 1
          )
        ];
      if (message.id !== messageId) {
        let messageChildrenIds = history.messages[messageId].childrenIds;
        while (messageChildrenIds.length !== 0) {
          messageId = messageChildrenIds.at(-1);
          messageChildrenIds = history.messages[messageId].childrenIds;
        }
        history.currentId = messageId;
      }
    } else {
      let childrenIds = Object.values(history.messages)
        .filter((message) => message.parentId === null)
        .map((message) => message.id);
      let messageId =
        childrenIds[
          Math.min(childrenIds.indexOf(message.id) + 1, childrenIds.length - 1)
        ];
      if (message.id !== messageId) {
        let messageChildrenIds = history.messages[messageId].childrenIds;
        while (messageChildrenIds.length !== 0) {
          messageId = messageChildrenIds.at(-1);
          messageChildrenIds = history.messages[messageId].childrenIds;
        }
        history.currentId = messageId;
      }
    }
    await tick();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };
</script>

{#if messages.length == 0}
  <!-- แสดงข้อความเริ่มต้นเมื่อไม่มีข้อความ -->
  <div class="m-auto text-center max-w-md pb-56 px-2">
    <div class="mt-2 text-2xl text-gray-800 font-semibold">
      วันนี้ฉันจะช่วยคุณได้อย่างไร
    </div>
  </div>
{:else}
  <!-- วนลูปแสดงข้อความ -->
  {#each messages as message, messageIdx}
    <div class="w-full">
      <div
        class="flex justify-between px-5 mb-3 max-w-3xl mx-auto rounded-lg group"
      >
        <div class="flex w-full">
          <div class="mr-4">
            <!-- แสดงไอคอนตามบทบาท -->
            {#if message.role === "user"}
              <img
                src="/user.png"
                class="w-7 h-7 object-cover rounded-full"
                alt="User profile"
                draggable="false"
              />
            {:else}
              <img
                src="/favicon.png"
                class="w-7 h-7 object-cover rounded-full"
                alt="Ollama profile"
                draggable="false"
              />
            {/if}
          </div>
          <div class="w-full overflow-hidden">
            <div class="font-bold mb-0.5">
              <!-- แสดงชื่อผู้ส่ง -->
              {#if message.role === "user"}
                คุณ
              {:else}
                Ollama <span class="text-gray-500 text-sm font-medium"
                  >{message.model ? ` ${message.model}` : ""}</span
                >
              {/if}
            </div>
            <!-- แสดงสถานะกำลังโหลด -->
            {#if message.role !== "user" && message.content === ""}
              <div class="w-full mt-3">
                <div class="animate-pulse flex w-full">
                  <div class="space-y-2 w-full">
                    <div class="h-2 bg-gray-200 rounded mr-14" />
                    <div class="grid grid-cols-3 gap-4">
                      <div class="h-2 bg-gray-200 rounded col-span-2" />
                      <div class="h-2 bg-gray-200 rounded col-span-1" />
                    </div>
                    <div class="grid grid-cols-4 gap-4">
                      <div class="h-2 bg-gray-200 rounded col-span-1" />
                      <div class="h-2 bg-gray-200 rounded col-span-2" />
                      <div class="h-2 bg-gray-200 rounded col-span-1 mr-4" />
                    </div>
                    <div class="h-2 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            {:else}
              <div
                class="prose w-full max-w-full prose-headings:my-0 prose-p:my-0 prose-p:-mb-4 prose-pre:my-0 prose-table:my-0 prose-blockquote:my-0 prose-img:my-0 prose-ul:-my-4 prose-ol:-my-4 prose-li:-my-3 prose-ul:-mb-6 prose-ol:-mb-6 prose-li:-mb-4 whitespace-pre-wrap"
              >
                <!-- แสดงข้อความของผู้ใช้ -->
                {#if message.role == "user"}
                  {#if message.files}
                    <div class="my-3 w-full flex overflow-x-auto space-x-2">
                      {#each message.files as file}
                        <div>
                          {#if file.type === "image"}
                            <img
                              src={file.url}
                              alt="input"
                              class="max-h-96 rounded-lg"
                              draggable="false"
                            />
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                  <!-- แสดงฟอร์มแก้ไขข้อความ -->
                  {#if message?.edit === true}
                    <div class="w-full">
                      <textarea
                        id="message-edit-{message.id}"
                        class="bg-transparent outline-none w-full resize-none"
                        bind:value={history.messages[message.id].editedContent}
                        on:input={(e) => {
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                      <div
                        class="mt-2 mb-1 flex justify-center space-x-2 text-sm font-medium"
                      >
                        <button
                          class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg transition"
                          on:click={() => {
                            confirmEditMessage(message.id);
                          }}
                        >
                          บันทึกและส่ง
                        </button>
                        <button
                          class="px-4 py-2 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition"
                          on:click={() => {
                            cancelEditMessage(message.id);
                          }}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  {:else}
                    <div class="w-full">
                      <pre
                        id="user-message"
                        class="whitespace-pre-wrap">{message.content}</pre>
                      <div class="flex justify-start space-x-1">
                        <!-- แสดงปุ่มนำทางข้อความ -->
                        {#if message.parentId !== null && message.parentId in history.messages && (history.messages[message.parentId]?.childrenIds.length ?? 0) > 1}
                          <div class="flex items-center">
                            <button
                              on:click={() => {
                                showPreviousMessage(message);
                              }}
                              class="p-1 rounded hover:bg-gray-100 transition text-sm"
                            >
                              ก่อนหน้า
                            </button>
                            <div class="text-xs font-bold mx-1">
                              {history.messages[
                                message.parentId
                              ].childrenIds.indexOf(message.id) + 1} / {history
                                .messages[message.parentId].childrenIds.length}
                            </div>
                            <button
                              on:click={() => {
                                showNextMessage(message);
                              }}
                              class="p-1 rounded hover:bg-gray-100 transition text-sm"
                            >
                              ถัดไป
                            </button>
                          </div>
                        {:else if message.parentId === null && Object.values(history.messages).filter((message) => message.parentId === null).length > 1}
                          <div class="flex items-center">
                            <button
                              on:click={() => {
                                showPreviousMessage(message);
                              }}
                              class="p-1 rounded hover:bg-gray-100 transition text-sm"
                            >
                              ก่อนหน้า
                            </button>
                            <div class="text-xs font-bold mx-1">
                              {Object.values(history.messages)
                                .filter((message) => message.parentId === null)
                                .map((message) => message.id)
                                .indexOf(message.id) + 1} / {Object.values(
                                history.messages
                              ).filter((message) => message.parentId === null)
                                .length}
                            </div>
                            <button
                              on:click={() => {
                                showNextMessage(message);
                              }}
                              class="p-1 rounded hover:bg-gray-100 transition text-sm"
                            >
                              ถัดไป
                            </button>
                          </div>
                        {/if}
                        <button
                          class="invisible group-hover:visible p-1 rounded hover:bg-gray-100 transition text-sm"
                          on:click={() => {
                            editMessageHandler(message.id);
                          }}
                        >
                          แก้ไข
                        </button>
                      </div>
                    </div>
                  {/if}
                {/if}
                <!-- แสดงข้อความของ assistant -->
                {#if message.role === "assistant"}
                  <div>
                    <div class="w-full">
                      <!-- แสดงข้อความแสดงข้อผิดพลาด -->
                      {#if message?.error === true}
                        <div
                          class="flex mt-2 mb-4 space-x-2 border border-red-500 bg-red-500/30 font-medium rounded-lg p-4"
                        >
                          <span class="self-center">!</span>
                          <div class="self-center">{message.content}</div>
                        </div>
                      {:else}
                        {@html marked(message.content.replace("\\", "\\\\"))}
                      {/if}
                      <!-- แสดงปุ่มควบคุมข้อความ -->
                      {#if message.done}
                        <div class="flex justify-start space-x-1 -mt-2">
                          {#if message.parentId !== null && message.parentId in history.messages && (history.messages[message.parentId]?.childrenIds.length ?? 0) > 1}
                            <div class="flex items-center">
                              <button
                                on:click={() => {
                                  showPreviousMessage(message);
                                }}
                                class="p-1 rounded hover:bg-gray-100 transition text-sm"
                              >
                                ก่อนหน้า
                              </button>
                              <div class="text-xs font-bold mx-1">
                                {history.messages[
                                  message.parentId
                                ].childrenIds.indexOf(message.id) + 1} / {history
                                  .messages[message.parentId].childrenIds
                                  .length}
                              </div>
                              <button
                                on:click={() => {
                                  showNextMessage(message);
                                }}
                                class="p-1 rounded hover:bg-gray-100 transition text-sm"
                              >
                                ถัดไป
                              </button>
                            </div>
                          {/if}
                          <button
                            class="{messageIdx + 1 === messages.length
                              ? 'visible'
                              : 'invisible group-hover:visible'} p-1 rounded hover:bg-gray-100 transition text-sm"
                            on:click={() => {
                              copyToClipboard(message.content);
                            }}
                          >
                            คัดลอก
                          </button>
                          {#if messageIdx + 1 === messages.length}
                            <button
                              type="button"
                              class="{messageIdx + 1 === messages.length
                                ? 'visible'
                                : 'invisible group-hover:visible'} p-1 rounded hover:bg-gray-100 transition text-sm"
                              on:click={regenerateResponse}
                            >
                              สร้างใหม่
                            </button>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/each}
{/if}
