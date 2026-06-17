<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import { goto } from "$app/navigation";
  import { db, chats, chatId } from "$lib/stores";
  import { onMount } from "svelte";

  let show = false;
  let navElement;

  let search = "";

  let chatDeleteId: string | null = null;

  let chatTitleEditId: string | null = null;
  let chatTitle = "";

  onMount(async () => {
    if (window.innerWidth > 1280) {
      show = true;
    }
  });

  // ตั้งค่าอาร์เรย์แชทจากฐานข้อมูลอย่างรีแอกทีฟเมื่อใดก็ตามที่ $db เปลี่ยนแปลง
  $: if ($db) {
    (async () => {
      await chats.set(await $db.getChats());
    })();
  }

  // จัดการการล้นของ body เมื่อแถบด้านข้างเปิด/ปิด
  $: if (show) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "unset";
  }

  /**
   * โหลดแชทด้วย ID และนำทางไปยังเส้นทางที่เกี่ยวข้อง
   *
   * @param {string} id - ID ของแชทที่จะโหลด
   */
  const loadChat = async (id: string) => {
    goto(`/c/${id}`);
  };

  /**
   * แก้ไขชื่อเรื่องของแชทและอัปเดตฐานข้อมูลตามนั้น
   *
   * @param {string} id - ID ของแชทที่จะแก้ไข
   * @param {string} _title - ชื่อเรื่องใหม่สำหรับแชท
   */
  const editChatTitle = async (id: string, _title: string) => {
    await $db!.updateChatById(id, {
      title: _title,
    });
    chats.update((currentChats) =>
      currentChats.map((chat) =>
        chat.id === id ? { ...chat, title: _title } : chat
      )
    );
  };

  /**
   * ลบแชทออกจากฐานข้อมูลและนำทางไปยังเส้นทางรูท
   *
   * @param {string} id - ID ของแชทที่จะลบ
   */
  const deleteChat = async (id: string) => {
    goto("/");
    $db!.deleteChatById(id);
  };
</script>

{#if show}
  <!-- โอเวอร์เลย์สำหรับปิดแถบด้านข้างเมื่อคลิกด้านนอก -->
  <div
    class="fixed inset-0 bg-black/50 z-30"
    on:click={() => {
      show = false;
    }}
  />
{/if}

<div
  bind:this={navElement}
  class="h-screen {show
    ? ''
    : '-translate-x-[260px]'}  w-[260px] fixed top-0 left-0 z-40 transition bg-white text-gray-800 shadow-2xl text-sm"
>
  <div class="flex flex-col h-screen">
    <div class="px-2.5 pt-2.5 flex justify-center space-x-2">
      <button
        class="flex-grow flex justify-between rounded-md px-3 py-1.5 hover:bg-gray-200 transition"
        on:click={async () => {
          goto("/");
          await chatId.set(uuidv4());
          show = false;
        }}
      >
        <div class="flex self-center">
          <div class=" self-center font-medium text-sm">แชทใหม่</div>
        </div>
      </button>
    </div>

    <div class="px-2.5 mt-1 mb-2 flex justify-center space-x-2">
      <div class="flex w-full">
        <input
          class="w-full rounded-r py-1.5 pl-2.5 pr-4 text-sm text-gray-700 bg-gray-100 outline-none"
          placeholder="ค้นหา"
          bind:value={search}
        />
      </div>
    </div>
    <div class="pl-2.5 pb-2.5 flex-1 flex flex-col space-y-1 overflow-y-auto">
      {#each $chats.filter((chat) => {
        if (search === "") {
          return true;
        } else {
          let title = chat.title.toLowerCase();

          if (title.includes(search)) {
            return true;
          } else {
            return false;
          }
        }
      }) as chat, i}
        <div class=" w-full pr-2 relative">
          <button
            class=" w-full flex justify-between rounded-md px-3 py-2 hover:bg-gray-200 {chat.id ===
            $chatId
              ? 'bg-gray-200'
              : ''} transition whitespace-nowrap text-ellipsis"
            on:click={() => {
              if (chat.id !== chatTitleEditId) {
                chatTitleEditId = null;
                chatTitle = "";
              }

              if (chat.id !== $chatId) {
                loadChat(chat.id);
              }
            }}
          >
            <div class=" flex self-center flex-1">
              <div
                class=" text-left self-center overflow-hidden {chat.id ===
                $chatId
                  ? 'w-[160px]'
                  : 'w-[220px]'} "
              >
                {#if chatTitleEditId === chat.id}
                  <input
                    bind:value={chatTitle}
                    class=" bg-transparent w-full outline-none"
                  />
                {:else}
                  {chat.title}
                {/if}
              </div>
            </div>
          </button>

          {#if chat.id === $chatId}
            <div class=" absolute right-[22px] top-[10px]">
              {#if chatTitleEditId === chat.id}
                <div class="flex self-center space-x-1.5">
                  <button
                    class=" self-center hover:text-gray-900 transition"
                    on:click={() => {
                      editChatTitle(chat.id, chatTitle);
                      chatTitleEditId = null;
                      chatTitle = "";
                    }}
                  >
                    ✓
                  </button><span />
                  <button
                    class=" self-center hover:text-gray-900 transition"
                    on:click={() => {
                      chatTitleEditId = null;
                      chatTitle = "";
                    }}
                  >
                    ✕
                  </button>
                </div>
              {:else if chatDeleteId === chat.id}
                <div class="flex self-center space-x-1.5">
                  <button
                    class=" self-center hover:text-gray-900 transition"
                    on:click={() => {
                      deleteChat(chat.id);
                    }}
                  >
                    ✓
                  </button><span />
                  <button
                    class=" self-center hover:text-gray-900 transition"
                    on:click={() => {
                      chatDeleteId = null;
                    }}
                  >
                    ✕
                  </button>
                </div>
              {:else}
                <div class="flex self-center space-x-1.5">
                  <button
                    class=" self-center hover:text-gray-900 transition"
                    on:click={() => {
                      chatTitle = chat.title;
                      chatTitleEditId = chat.id;
                    }}
                  >
                    แก้
                  </button><span />
                  <button
                    class=" self-center hover:text-gray-900 transition"
                    on:click={() => {
                      chatDeleteId = chat.id;
                    }}
                  >
                    ลบ
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <div class="px-3 py-2 text-gray-500">ไม่มีรายการประวัติ</div>
      {/each}
    </div>
  </div>

  <div
    class="fixed left-0 top-[50dvh] z-40 -translate-y-1/2 transition-transform translate-x-[255px] md:translate-x-[260px] rotate-0"
  >
    <button
      class=" group"
      on:click={() => {
        show = !show;
      }}
      ><span class="" data-state="closed"
        ><div
          class="flex h-[72px] w-8 items-center justify-center opacity-20 group-hover:opacity-100 transition"
        >
          <div class="flex h-6 w-6 flex-col items-center">
            <div
              class="h-3 w-1 rounded-full bg-gray-700 rotate-0 translate-y-[0.15rem] {show
                ? 'group-hover:rotate-[15deg]'
                : 'group-hover:rotate-[-15deg]'}"
            />
            <div
              class="h-3 w-1 rounded-full bg-gray-700 rotate-0 translate-y-[-0.15rem] {show
                ? 'group-hover:rotate-[-15deg]'
                : 'group-hover:rotate-[15deg]'}"
            />
          </div>
        </div>
      </span>
    </button>
  </div>
</div>
