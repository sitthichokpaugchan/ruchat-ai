<script lang="ts">
  import { v4 as uuidv4 } from "uuid";
  import toast from "svelte-french-toast";

  import { OLLAMA_API_BASE_URL } from "$lib/constants";
  import { onMount, tick } from "svelte";
  import { copyToClipboard, splitStream } from "$lib/utils";

  import { settings, db, chats, chatId } from "$lib/stores";

  import MessageInput from "$lib/components/chat/MessageInput.svelte";
  import Messages from "$lib/components/chat/Messages.svelte";
  import ModelSelector from "$lib/components/chat/ModelSelector.svelte";
  import Navbar from "$lib/components/layout/Navbar.svelte";
  import { page } from "$app/stores";

  let stopResponseFlag = false;
  let autoScroll = true;

  let selectedModels = [""];

  let title = "";
  let prompt = "";

  let messages = [];
  let history = {
    messages: {},
    currentId: null,
  };

  // อัปเดต messages เมื่อ history.currentId เปลี่ยนแปลง
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

  onMount(async () => {
    await chatId.set(uuidv4());

    chatId.subscribe(async () => {
      await initNewChat();
    });
  });

  // ฟังก์ชันเกี่ยวกับเว็บ

  // เริ่มต้นแชทใหม่
  const initNewChat = async () => {
    console.log($chatId);

    autoScroll = true;

    title = "";
    messages = [];
    history = {
      messages: {},
      currentId: null,
    };
    selectedModels = $page.url.searchParams.get("models")
      ? $page.url.searchParams.get("models")?.split(",")
      : ($settings.models ?? [""]);

    let _settings = JSON.parse(localStorage.getItem("settings") ?? "{}");
    console.log(_settings);
    settings.set({
      ..._settings,
    });
  };

  // ฟังก์ชันเกี่ยวกับ Ollama

  // ส่ง prompt ไปยังโมเดลที่เลือก
  const sendPrompt = async (userPrompt, parentId, _chatId) => {
    await Promise.all(
      selectedModels.map(async (model) => {
        await sendPromptOllama(model, userPrompt, parentId, _chatId);
      })
    );

    await chats.set(await $db.getChats());
  };

  // ส่ง prompt ไปยัง Ollama API
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
    window.scrollTo({ top: document.body.scrollHeight });

    const res = await fetch(`${OLLAMA_API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "text/event-stream",
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    }).catch((err) => {
      console.log(err);
      return null;
    });

    if (res && res.ok) {
      const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(splitStream("\n"))
        .getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done || stopResponseFlag || _chatId !== $chatId) {
          responseMessage.done = true;
          messages = messages;
          break;
        }

        try {
          let lines = value.split("\n");

          for (const line of lines) {
            if (line !== "") {
              console.log(line);
              let data = JSON.parse(line);

              if ("detail" in data) {
                throw data;
              }

              if (data.done == false) {
                if (
                  responseMessage.content == "" &&
                  data.message.content == "\n"
                ) {
                  continue;
                } else {
                  responseMessage.content += data.message.content;
                  messages = messages;
                }
              } else {
                responseMessage.done = true;
                responseMessage.context = data.context ?? null;
                responseMessage.info = {
                  total_duration: data.total_duration,
                  load_duration: data.load_duration,
                  sample_count: data.sample_count,
                  sample_duration: data.sample_duration,
                  prompt_eval_count: data.prompt_eval_count,
                  prompt_eval_duration: data.prompt_eval_duration,
                  eval_count: data.eval_count,
                  eval_duration: data.eval_duration,
                };
                messages = messages;

                if ($settings.responseAutoCopy) {
                  copyToClipboard(responseMessage.content);
                }
              }
            }
          }
        } catch (error) {
          console.log(error);
          if ("detail" in error) {
            toast.error(error.detail);
          }
          break;
        }

        if (autoScroll) {
          window.scrollTo({ top: document.body.scrollHeight });
        }

        await $db.updateChatById(_chatId, {
          title: title === "" ? "ไม่มีชื่อแชท" : title,
          models: selectedModels,
          messages: messages,
          history: history,
        });
      }
    } else {
      if (res !== null) {
        const error = await res.json();
        console.log(error);
        if ("detail" in error) {
          toast.error(error.detail);
          responseMessage.content = error.detail;
        } else {
          toast.error(error.error);
          responseMessage.content = error.error;
        }
      } else {
        toast.error(`เกิดปัญหาในการเชื่อมต่อกับ Ollama`);
        responseMessage.content = `เกิดปัญหาในการเชื่อมต่อกับ Ollama`;
      }

      responseMessage.error = true;
      responseMessage.content = `เกิดปัญหาในการเชื่อมต่อกับ Ollama`;
      responseMessage.done = true;
      messages = messages;
    }

    stopResponseFlag = false;
    await tick();
    if (autoScroll) {
      window.scrollTo({ top: document.body.scrollHeight });
    }

    if (messages.length == 2 && messages.at(1).content !== "") {
      window.history.replaceState(history.state, "", `/c/${_chatId}`);
      await generateChatTitle(_chatId, userPrompt);
    }
  };

  // ส่ง prompt ที่ผู้ใช้ป้อน
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
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
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

  // สร้างชื่อเรื่องของแชท
  const generateChatTitle = async (_chatId, userPrompt) => {
    if ($settings.titleAutoGenerate ?? true) {
      console.log("generateChatTitle");

      const res = await fetch(`${OLLAMA_API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify({
          model: selectedModels[0],
          prompt: `สร้างหัวข้อแชทตรงตามภาษาเขา ไม่เกิน 10 คำ และไม่รวมคำนำหน้า จากนั้นโปรดตอบกลับโดยใช้หัวข้อแชทเท่านั้น: ${userPrompt}`,
          stream: false,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw await res.json();
          return res.json();
        })
        .catch((error) => {
          if ("detail" in error) {
            toast.error(error.detail);
          }
          console.log(error);
          return null;
        });

      if (res) {
        await setChatTitle(
          _chatId,
          res.response === "" ? "ไม่มีชื่อแชท" : res.response
        );
      }
    } else {
      await setChatTitle(_chatId, `${userPrompt}`);
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
    autoScroll =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 40;
  }}
/>

<!-- แสดง Navbar -->
<Navbar />
<!-- ส่วนแสดงผลหลัก -->
<div class="min-h-screen w-full flex justify-center">
  <div class=" py-2.5 flex flex-col justify-between w-full">
    <!-- ส่วนเลือกโมเดล -->
    <div class="max-w-2xl mx-auto w-full px-3 md:px-0 mt-10">
      <ModelSelector bind:selectedModels disabled={messages.length > 0} />
    </div>

    <!-- ส่วนแสดงข้อความ -->
    <div class=" h-full mt-10 mb-32 w-full flex flex-col">
      <Messages
        bind:history
        bind:messages
        bind:autoScroll
        {sendPrompt}
        {regenerateResponse}
      />
    </div>
  </div>

  <!-- ส่วนป้อนข้อความ -->
  <MessageInput
    bind:prompt
    bind:autoScroll
    {messages}
    {submitPrompt}
    {stopResponse}
  />
</div>
