<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import toast from "svelte-french-toast";

  import { DEFAULT_MODEL } from "$lib/constants";
  import { chatStream } from "$lib/apis/ollama";
  import { tick } from "svelte";
  import { convertMessagesToHistory, copyToClipboard } from "$lib/utils";
  import { goto } from "$app/navigation";
  import { settings, db, chats, chatId } from "$lib/stores";

  import MessageInput from "$lib/components/chat/MessageInput.svelte";
  import Messages from "$lib/components/chat/Messages.svelte";

  import { page } from "$app/stores";

  let loaded = false;
  let stopResponseFlag = false;
  let autoScroll = true;
  let isProgrammaticScroll = false;
  let scrollTimeout;

  const scrollToBottom = (smooth = false) => {
    isProgrammaticScroll = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
    
    scrollTimeout = setTimeout(() => {
      isProgrammaticScroll = false;
    }, smooth ? 800 : 50);
  };

  let selectedModels = [DEFAULT_MODEL];

  let title = "";
  let prompt = "";

  let messages = [];
  let history = {
    messages: {},
    currentId: null,
  };

  // อัปเดต `messages` เมื่อ `history.currentId` เปลี่ยนแปลง
  $: if (history.currentId !== null) {
    let _messages = [];

    let currentMessage = history.messages[history.currentId];
    while (currentMessage !== null) {
      _messages.unshift({ ...currentMessage });
      currentMessage =
        currentMessage.parentId !== null
          ? history.messages[currentMessage.parentId]
          : null;
    }
    messages = _messages;
  } else {
    messages = [];
  }

  // อัปเดต `title` เมื่อมีการเปลี่ยนชื่อแชทใน store
  $: {
    const chat = $chats.find((c) => c.id === $chatId);
    if (chat) {
      title = chat.title;
    }
  }

  // โหลดแชทเมื่อ `page.params.id` เปลี่ยนแปลง
  $: if ($page.params.id) {
    (async () => {
      let chat = await loadChat();

      await tick();
      if (chat) {
        loaded = true;
      } else {
        await goto("/");
      }
    })();
  }

  // ฟังก์ชันเกี่ยวกับเว็บ

  // โหลดข้อมูลแชท
  const loadChat = async () => {
    await chatId.set($page.params.id);
    const chat = await $db.getChatById($chatId);

    if (chat) {
      console.log(chat);

      selectedModels = [DEFAULT_MODEL];
      history =
        (chat?.history ?? undefined) !== undefined
          ? chat.history
          : convertMessagesToHistory(chat.messages);
      title = chat.title;

      let _settings = JSON.parse(localStorage.getItem("settings") ?? "{}");
      await settings.set({
        ..._settings,
      });
      autoScroll = true;

      await tick();
      if (messages.length > 0) {
        history.messages[messages.at(-1).id].done = true;
      }
      await tick();

      return chat;
    } else {
      return null;
    }
  };

  // ฟังก์ชันเกี่ยวกับ Ollama

  // ส่งพรอมต์ไปยังโมเดลที่เลือก
  const sendPrompt = async (userPrompt, parentId, _chatId) => {
    await Promise.all(
      selectedModels.map(async (model) => {
        console.log(model);
        await sendPromptOllama(model, userPrompt, parentId, _chatId);
      })
    );

    await chats.set(await $db.getChats());
  };

  // ส่งพรอมต์ไปยัง Ollama API
  const sendPromptOllama = async (model, userPrompt, parentId, _chatId) => {
    console.log("sendPromptOllama");
    let responseMessageId = uuidv4();
    let responseMessage = {
      parentId: parentId,
      id: responseMessageId,
      childrenIds: [],
      role: "assistant",
      content: "",
      model: model,
    };

    history.messages[responseMessageId] = responseMessage;
    history.currentId = responseMessageId;
    if (parentId !== null) {
      history.messages[parentId].childrenIds = [
        ...history.messages[parentId].childrenIds,
        responseMessageId,
      ];
    }

    await tick();
    scrollToBottom(false);

    let stream;
    try {
      stream = await chatStream({
        model: model,
        messages: [...messages]
          .filter((message) => message)
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
        authHeader: $settings.authHeader,
      });
    } catch (err: any) {
      console.log(err);
      toast.error(err?.message || "เกิดปัญหาในการเชื่อมต่อกับ Ollama Cloud");
      responseMessage.error = true;
      responseMessage.content = err?.message || "เกิดปัญหาในการเชื่อมต่อกับ Ollama Cloud";
      responseMessage.done = true;
      history = history;
      stopResponseFlag = false;
      return;
    }

    try {
      for await (const chunk of stream) {
        if (stopResponseFlag || _chatId !== $chatId) {
          if (stream.abort) stream.abort();
          responseMessage.done = true;
          history = history;
          break;
        }

        if (!chunk.done) {
          if (
            responseMessage.content === "" &&
            chunk.message?.content === "\n"
          ) {
            continue;
          } else {
            responseMessage.content += chunk.message?.content || "";
            history = history;
          }
        } else {
          responseMessage.done = true;
          responseMessage.context = (chunk as any).context ?? null;
          responseMessage.info = {
            total_duration: (chunk as any).total_duration,
            load_duration: (chunk as any).load_duration,
            sample_count: (chunk as any).sample_count,
            sample_duration: (chunk as any).sample_duration,
            prompt_eval_count: (chunk as any).prompt_eval_count,
            prompt_eval_duration: (chunk as any).prompt_eval_duration,
            eval_count: (chunk as any).eval_count,
            eval_duration: (chunk as any).eval_duration,
          };
          history = history;

          if ($settings.notificationEnabled && !document.hasFocus()) {
            const notification = new Notification(`Ollama - ${model}`, {
              body: responseMessage.content,
              icon: "/ru-logo.png",
            });
          }

          if ($settings.responseAutoCopy) {
            copyToClipboard(responseMessage.content);
          }
        }

        if (autoScroll) {
          scrollToBottom(false);
        }
        await $db.updateChatById(_chatId, {
          title: title === "" ? "ไม่มีชื่อแชท" : title,
          models: selectedModels,
          messages: messages,
          history: history,
        });
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error?.message || "เกิดข้อผิดพลาดในการรับข้อมูล");
      responseMessage.error = true;
      responseMessage.content = error?.message || "เกิดข้อผิดพลาดในการรับข้อมูล";
      responseMessage.done = true;
      history = history;
    }

    stopResponseFlag = false;
    await tick();
    if (autoScroll) {
      scrollToBottom(false);
    }

    if (messages.length == 2 && messages.at(1).content !== "") {
      window.history.replaceState(history.state, "", `/c/${_chatId}`);
      await generateChatTitle(_chatId, userPrompt);
    }
  };

  // ส่งพรอมต์ที่ผู้ใช้ป้อน
  const submitPrompt = async (userPrompt) => {
    const _chatId = JSON.parse(JSON.stringify($chatId));
    console.log("submitPrompt", _chatId);

    if (selectedModels.includes("")) {
      toast.error("ไม่ได้เลือกโมเดล");
    } else if (messages.length != 0 && messages.at(-1).done != true) {
      console.log("wait");
    } else {
      document.getElementById("chat-textarea").style.height = "";

      let userMessageId = uuidv4();
      let userMessage = {
        id: userMessageId,
        parentId: messages.length !== 0 ? messages.at(-1).id : null,
        childrenIds: [],
        role: "user",
        content: userPrompt,
      };

      if (messages.length !== 0) {
        history.messages[messages.at(-1).id].childrenIds.push(userMessageId);
      }

      history.messages[userMessageId] = userMessage;
      history.currentId = userMessageId;

      await tick();
      if (messages.length == 1) {
        await $db.createNewChat({
          id: _chatId,
          title: "ไม่มีชื่อแชท",
          models: selectedModels,
          messages: messages,
          history: history,
        });
      }

      prompt = "";

      setTimeout(() => {
        scrollToBottom(true);
      }, 50);

      await sendPrompt(userPrompt, userMessageId, _chatId);
    }
  };

  // หยุดการตอบสนอง
  const stopResponse = () => {
    stopResponseFlag = true;
    console.log("stopResponse");
  };

  // สร้างการตอบสนองใหม่
  const regenerateResponse = async () => {
    const _chatId = JSON.parse(JSON.stringify($chatId));
    console.log("regenerateResponse", _chatId);

    if (messages.length != 0 && messages.at(-1).done == true) {
      messages.splice(messages.length - 1, 1);
      messages = messages;

      let userMessage = messages.at(-1);
      let userPrompt = userMessage.content;

      await sendPrompt(userPrompt, userMessage.id, _chatId);
    }
  };

  // ตั้งชื่อเรื่องของแชท
  const setChatTitle = async (_chatId, _title) => {
    await $db.updateChatById(_chatId, { title: _title });
    if (_chatId === $chatId) {
      title = _title;
    }
  };
</script>

<!-- จัดการการเลื่อนหน้าจอ -->
<svelte:window
  on:scroll={(e) => {
    if (isProgrammaticScroll) return;
    autoScroll =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 40;
  }}
/>

<!-- แสดง Navbar และเนื้อหาหลักเมื่อโหลดเสร็จ -->
{#if loaded}
  <div class="min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] w-full flex flex-col items-center relative">
    <div class="flex-grow w-full flex justify-center">
      <div class=" py-2.5 flex flex-col justify-between w-full">
        <!-- ส่วนแสดงข้อความ -->
        <div class=" h-full mt-10 mb-8 w-full flex flex-col">
          <Messages
            bind:history
            bind:messages
            bind:autoScroll
            {sendPrompt}
            {regenerateResponse}
            {scrollToBottom}
          />
        </div>
      </div>
    </div>

    <!-- ส่วนป้อนข้อความ -->
    <MessageInput
      bind:prompt
      bind:autoScroll
      {messages}
      {submitPrompt}
      {stopResponse}
      {scrollToBottom}
    />
  </div>
{/if}
